"""
KonsultaBot Advanced API Views - Voice, Translation, and AI Chat
"""
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
import tempfile
import os

from .ai_handler import multilingual_ai_handler
from .utils.speech_processor import speech_processor
from .utils.translation_service import translation_service
from .models import ConversationSession, ChatMessage
from analytics.models import QueryLog

logger = logging.getLogger('konsultabot.views')


class ChatRateThrottle(UserRateThrottle):
    scope = 'chat'
    rate = '100/hour'


class VoiceRateThrottle(UserRateThrottle):
    scope = 'voice'
    rate = '50/hour'


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
@throttle_classes([ChatRateThrottle])
def chat_endpoint(request):
    """
    Main chat endpoint supporting text and voice input with multilingual AI
    
    POST /api/v1/chat/
    {
        "query": "My WiFi is not working",
        "language": "english",  // optional, auto-detect if not provided
        "session_id": "uuid",   // optional, creates new if not provided
        "voice_response": true  // optional, returns TTS audio if true
    }
    """
    try:
        # Parse request data
        data = json.loads(request.body) if request.body else {}
        query = data.get('query', '').strip()
        language = data.get('language', 'auto')
        session_id = data.get('session_id')
        voice_response = data.get('voice_response', False)
        
        # Validate input
        if not query:
            return Response({
                'error': 'Query is required',
                'code': 'MISSING_QUERY'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(query) > 1000:
            return Response({
                'error': 'Query too long (max 1000 characters)',
                'code': 'QUERY_TOO_LONG'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create session
        session = None
        if session_id:
            try:
                session = ConversationSession.objects.get(
                    session_id=session_id,
                    user=request.user if request.user.is_authenticated else None
                )
            except ConversationSession.DoesNotExist:
                pass
        
        if not session:
            session = ConversationSession.objects.create(
                user=request.user if request.user.is_authenticated else None,
                language=language if language != 'auto' else 'english'
            )
        
        # Get conversation context
        context = session.get_recent_context(limit=5)
        
        # Process AI query
        ai_response = multilingual_ai_handler.handle_ai_query(
            query=query,
            user=request.user if request.user.is_authenticated else None,
            language=language,
            session=session,
            context=context
        )
        
        # Save messages to session
        ChatMessage.objects.create(
            session=session,
            sender='user',
            message=query,
            intent_detected=ai_response.get('intent', ''),
            entities_extracted=ai_response.get('entities', {})
        )
        
        ChatMessage.objects.create(
            session=session,
            sender='bot',
            message=ai_response['message'],
            response_source=ai_response.get('source', 'unknown'),
            response_time=ai_response.get('processing_time', 0),
            confidence_score=ai_response.get('confidence', 0)
        )
        
        # Prepare response
        response_data = {
            'message': ai_response['message'],
            'session_id': str(session.session_id),
            'language': ai_response.get('response_language', 'english'),
            'intent': ai_response.get('intent', 'unknown'),
            'confidence': ai_response.get('confidence', 0),
            'source': ai_response.get('source', 'unknown'),
            'processing_time': ai_response.get('processing_time', 0),
            'translation_used': ai_response.get('translation_used', False),
            'connection_status': ai_response.get('connection_status', 'unknown')
        }
        
        # Add voice response if requested
        if voice_response and ai_response['message']:
            try:
                tts_result = speech_processor.text_to_speech(
                    ai_response['message'],
                    ai_response.get('response_language', 'english')
                )
                
                if tts_result['audio_data']:
                    # Convert audio to base64 for JSON response
                    import base64
                    audio_b64 = base64.b64encode(tts_result['audio_data']).decode('utf-8')
                    response_data['voice_response'] = {
                        'audio_data': audio_b64,
                        'format': tts_result['format'],
                        'method': tts_result['method']
                    }
                
            except Exception as e:
                logger.error(f"TTS generation failed: {e}")
                response_data['voice_response'] = {'error': 'TTS generation failed'}
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON in request body',
            'code': 'INVALID_JSON'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return Response({
            'error': 'Internal server error',
            'code': 'INTERNAL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
@throttle_classes([VoiceRateThrottle])
def speech_to_text_endpoint(request):
    """
    Convert uploaded audio to text with language detection
    
    POST /api/v1/chat/speech-to-text/
    Content-Type: multipart/form-data
    
    Form data:
    - audio: Audio file (wav, mp3, m4a, etc.)
    - language: Target language (optional, auto-detect if not provided)
    """
    try:
        # Check if audio file is provided
        if 'audio' not in request.FILES:
            return Response({
                'error': 'Audio file is required',
                'code': 'MISSING_AUDIO'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        audio_file = request.FILES['audio']
        language = request.POST.get('language', 'auto')
        
        # Validate file size (max 10MB)
        if audio_file.size > 10 * 1024 * 1024:
            return Response({
                'error': 'Audio file too large (max 10MB)',
                'code': 'FILE_TOO_LARGE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get file format from extension
        file_extension = audio_file.name.split('.')[-1].lower() if '.' in audio_file.name else 'wav'
        
        # Read audio data
        audio_data = audio_file.read()
        
        # Process speech to text
        stt_result = speech_processor.speech_to_text(
            audio_data=audio_data,
            language=language,
            audio_format=file_extension
        )
        
        # Prepare response
        response_data = {
            'text': stt_result['text'],
            'confidence': stt_result['confidence'],
            'language': stt_result['language'],
            'method': stt_result['method'],
            'alternatives': stt_result.get('alternatives', [])
        }
        
        if stt_result.get('error'):
            response_data['error'] = stt_result['error']
            return Response(response_data, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Speech-to-text error: {e}")
        return Response({
            'error': 'Speech processing failed',
            'code': 'STT_ERROR',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def text_to_speech_endpoint(request):
    """
    Convert text to speech audio
    
    POST /api/v1/chat/text-to-speech/
    {
        "text": "Hello, how can I help you?",
        "language": "english",
        "voice_type": "neutral"
    }
    """
    try:
        data = json.loads(request.body) if request.body else {}
        text = data.get('text', '').strip()
        language = data.get('language', 'english')
        voice_type = data.get('voice_type', 'neutral')
        
        if not text:
            return Response({
                'error': 'Text is required',
                'code': 'MISSING_TEXT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(text) > 500:
            return Response({
                'error': 'Text too long (max 500 characters)',
                'code': 'TEXT_TOO_LONG'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate speech
        tts_result = speech_processor.text_to_speech(
            text=text,
            language=language,
            voice_type=voice_type
        )
        
        if tts_result['audio_data']:
            # Return audio file directly
            response = HttpResponse(
                tts_result['audio_data'],
                content_type=f'audio/{tts_result["format"]}'
            )
            response['Content-Disposition'] = f'attachment; filename="speech.{tts_result["format"]}"'
            return response
        else:
            return Response({
                'error': tts_result.get('error', 'TTS generation failed'),
                'code': 'TTS_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        return Response({
            'error': 'TTS processing failed',
            'code': 'TTS_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def translate_endpoint(request):
    """
    Translate text between supported languages
    
    POST /api/v1/chat/translate/
    {
        "text": "Hello, how are you?",
        "target_language": "tagalog",
        "source_language": "auto"
    }
    """
    try:
        data = json.loads(request.body) if request.body else {}
        text = data.get('text', '').strip()
        target_language = data.get('target_language', 'english')
        source_language = data.get('source_language', 'auto')
        
        if not text:
            return Response({
                'error': 'Text is required',
                'code': 'MISSING_TEXT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Perform translation
        translation_result = translation_service.translate_text(
            text=text,
            target_language=target_language,
            source_language=source_language
        )
        
        return Response({
            'translated_text': translation_result['translated_text'],
            'source_language': translation_result['source_language'],
            'target_language': translation_result['target_language'],
            'confidence': translation_result['confidence'],
            'method': translation_result['method']
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return Response({
            'error': 'Translation failed',
            'code': 'TRANSLATION_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def feedback_endpoint(request):
    """
    Submit feedback for a chat response
    
    POST /api/v1/chat/feedback/
    {
        "session_id": "uuid",
        "message_id": 123,
        "rating": 5,
        "feedback": "Very helpful!",
        "is_helpful": true
    }
    """
    try:
        data = json.loads(request.body) if request.body else {}
        session_id = data.get('session_id')
        message_id = data.get('message_id')
        rating = data.get('rating')
        feedback_text = data.get('feedback', '')
        is_helpful = data.get('is_helpful')
        
        if not session_id:
            return Response({
                'error': 'Session ID is required',
                'code': 'MISSING_SESSION_ID'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the message to update
        try:
            if message_id:
                message = ChatMessage.objects.get(
                    id=message_id,
                    session__session_id=session_id,
                    sender='bot'
                )
            else:
                # Get the latest bot message in the session
                message = ChatMessage.objects.filter(
                    session__session_id=session_id,
                    sender='bot'
                ).order_by('-timestamp').first()
            
            if not message:
                return Response({
                    'error': 'Message not found',
                    'code': 'MESSAGE_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Update feedback
            if rating is not None:
                message.user_rating = max(1, min(5, int(rating)))
            if feedback_text:
                message.user_feedback = feedback_text
            if is_helpful is not None:
                message.is_helpful = bool(is_helpful)
            
            message.save()
            
            return Response({
                'message': 'Feedback saved successfully',
                'message_id': message.id
            }, status=status.HTTP_200_OK)
            
        except ChatMessage.DoesNotExist:
            return Response({
                'error': 'Message not found',
                'code': 'MESSAGE_NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        return Response({
            'error': 'Failed to save feedback',
            'code': 'FEEDBACK_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for monitoring
    
    GET /api/v1/chat/health/
    """
    try:
        # Check database connectivity
        session_count = ConversationSession.objects.count()
        
        # Check AI services
        from .utils.network_detector import network_detector
        from .utils.gemini_helper import gemini_processor
        
        connection_status = network_detector.get_connection_quality()
        gemini_status = gemini_processor.get_model_status()
        
        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'database': {
                'connected': True,
                'session_count': session_count
            },
            'network': {
                'connected': connection_status['connected'],
                'quality': connection_status['quality']
            },
            'ai_services': {
                'gemini_available': gemini_status['available'],
                'local_ai_available': True
            },
            'supported_languages': translation_service.get_supported_languages()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@login_required
def session_history(request, session_id):
    """
    Get conversation history for a session
    
    GET /api/v1/chat/sessions/{session_id}/history/
    """
    try:
        session = ConversationSession.objects.get(
            session_id=session_id,
            user=request.user
        )
        
        messages = ChatMessage.objects.filter(
            session=session
        ).order_by('timestamp')
        
        history = []
        for message in messages:
            history.append({
                'id': message.id,
                'sender': message.sender,
                'message': message.message,
                'timestamp': message.timestamp.isoformat(),
                'intent': message.intent_detected,
                'confidence': message.confidence_score,
                'source': message.response_source,
                'rating': message.user_rating,
                'is_helpful': message.is_helpful
            })
        
        return Response({
            'session_id': str(session.session_id),
            'created_at': session.created_at.isoformat(),
            'language': session.language,
            'message_count': len(history),
            'messages': history
        }, status=status.HTTP_200_OK)
        
    except ConversationSession.DoesNotExist:
        return Response({
            'error': 'Session not found',
            'code': 'SESSION_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Session history error: {e}")
        return Response({
            'error': 'Failed to retrieve session history',
            'code': 'HISTORY_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def supported_languages(request):
    """
    Get list of supported languages
    
    GET /api/v1/chat/languages/
    """
    try:
        languages = translation_service.get_supported_languages()
        
        return Response({
            'languages': languages,
            'default_language': 'english'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Languages endpoint error: {e}")
        return Response({
            'error': 'Failed to retrieve supported languages',
            'code': 'LANGUAGES_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
