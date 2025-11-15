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
from django.utils import timezone
from django.conf import settings
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


from rest_framework import serializers

class ChatMessageSerializer(serializers.ModelSerializer):
    session_id = serializers.CharField(source='session.session_id')
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'message', 'response', 'timestamp', 'session_id', 
                 'message_type', 'response_source', 'intent_detected', 'confidence_score']

@api_view(['GET'])
@permission_classes([])
def chat_history(request):
    """
    Get chat history for the current session or all sessions
    """
    try:
        session_id = request.GET.get('session_id')
        
        # Query with error handling
        if session_id:
            # Get history for specific session
            session = ConversationSession.objects.filter(session_id=session_id).first()
            if not session:
                return Response({
                    'status': 'error',
                    'message': 'Session not found',
                    'code': 'SESSION_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
                
            messages = ChatMessage.objects.filter(session=session).order_by('timestamp')
        else:
            messages = ChatMessage.objects.all().order_by('-timestamp')[:50]

        # Get messages with select_related for efficiency
        messages = messages.select_related('session')
        
        # Serialize messages
        serializer = ChatMessageSerializer(messages, many=True)
        
        return Response({
            'status': 'success',
            'history': serializer.data,
            'count': len(serializer.data)
        })

    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([])
@csrf_exempt
def chat_endpoint(request):
    """
    Enhanced chat endpoint for KonsultaBot IT Support with improved error handling
    
    POST /api/v1/chat/
    {
        "query": "How do I connect to EVSU WiFi?",
        "language": "english",  // optional, auto-detect if not provided
        "session_id": "uuid",   // optional, creates new if not provided
        "voice_response": false,  // optional, returns TTS audio if true
        "offline": false  // optional, store query for later if true
    }
    """
    start_time = timezone.now()
    
    try:
        # Validate request data
        if not request.body:
            return Response({
                'status': 'error',
                'message': 'Request body is required',
                'code': 'MISSING_BODY'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Parse request data with error handling
        try:
            data = json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            return Response({
                'status': 'error',
                'message': 'Invalid JSON in request body',
                'code': 'INVALID_JSON'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Extract and validate query
        query = data.get('query', '').strip()
        if not query:
            return Response({
                'status': 'error',
                'message': 'Query is required',
                'code': 'MISSING_QUERY'
            }, status=status.HTTP_400_BAD_REQUEST)
        language = data.get('language', 'english').lower()
        session_id = data.get('session_id')
        voice_response = data.get('voice_response', False)
        offline_mode = data.get('offline', False)
        
        # Validate input with improved feedback
        if not query:
            return Response({
                'status': 'error',
                'error': 'Query is required',
                'code': 'MISSING_QUERY',
                'valid_fields': ['query', 'language', 'session_id', 'voice_response', 'offline'],
                'example': {
                    'query': 'How do I connect to EVSU WiFi?',
                    'language': 'english'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate language with detailed feedback
        supported_languages = ['english', 'tagalog', 'bisaya', 'waray']
        if language not in supported_languages:
            return Response({
                'status': 'error',
                'error': f'Unsupported language. Supported languages: {", ".join(supported_languages)}',
                'code': 'INVALID_LANGUAGE',
                'supported_languages': supported_languages,
                'provided_language': language,
                'suggestion': 'Use "english" if unsure'
            }, status=status.HTTP_400_BAD_REQUEST)
            
            # Initialize timing and connectivity checks
        response_start_time = timezone.now()
        response_timeout = getattr(settings, 'CHAT_RESPONSE_TIMEOUT', 30)  # 30 seconds default
        
        # Enhanced error handling for network and system status
        try:
            # Check network connectivity
            from .utils.network_detector import network_detector
            connection_info = network_detector.get_connection_quality()
            if not connection_info['connected']:
                return Response({
                    'status': 'error',
                    'error': 'Network connectivity issues detected',
                    'code': 'NETWORK_ERROR',
                    'suggestion': 'Please check your internet connection and try again',
                    'offline_available': True,
                    'connection_info': connection_info
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
        except Exception as e:
            logger.error(f"Network detection error: {str(e)}")
            # Continue processing even if network detection fails
            connection_info = {
                'connected': False,
                'quality': 'unknown',
                'recommended_mode': 'offline'
            }
            
        # Validate query length
        if len(query) > 1000:
            return Response({
                'status': 'error',
                'message': 'Query too long (max 1000 characters)',
                'code': 'QUERY_TOO_LONG'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle offline mode
        if offline_mode or getattr(settings, 'KONSULTABOT_SETTINGS', {}).get('OFFLINE_MODE', False):
            from .utils.offline_handler import offline_handler
            
            # Store query for later processing
            query_stored = offline_handler.store_query(
                user_id=request.user.id if request.user.is_authenticated else None,
                query=query,
                metadata={
                    'language': language,
                    'session_id': session_id,
                    'voice_response': voice_response,
                }
            )
            
            if query_stored:
                return Response({
                    'status': 'pending',
                    'message': 'Query stored for offline processing',
                    'offline': True,
                    'query': query,
                    'timestamp': timezone.now().isoformat(),
                    'estimated_processing_time': '5-10 minutes'
                }, status=status.HTTP_202_ACCEPTED)
            else:
                return Response({
                    'status': 'error',
                    'error': 'Failed to store offline query',
                    'code': 'OFFLINE_STORAGE_ERROR',
                    'retry_after': 60  # Suggest retry after 1 minute
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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
        
        # Process AI query with improved error handling
        try:
            ai_response = multilingual_ai_handler.handle_ai_query(
                query=query,
                user=request.user if request.user.is_authenticated else None,
                language=language,
                session=session,
                context=context
            )
        except Exception as e:
            # Check for API key error
            if 'GOOGLE_API_KEY' in str(e):
                return Response({
                    'status': 'error',
                    'message': 'AI service configuration error. Please contact system administrator.',
                    'code': 'API_KEY_ERROR',
                    'debug_info': str(e) if settings.DEBUG else None
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Other errors
            logger.error(f"AI query processing error: {e}")
            return Response({
                'status': 'error',
                'message': 'An error occurred while processing your request.',
                'code': 'PROCESSING_ERROR',
                'debug_info': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Save user message
        user_message = ChatMessage.objects.create(
            session=session,
            sender='user',
            message=query,
            intent_detected=ai_response.get('intent', ''),
            entities_extracted=ai_response.get('entities', {})
        )
        
        # Save bot's response
        bot_message = ChatMessage.objects.create(
            session=session,
            sender='bot',
            message=ai_response['message'],
            response=ai_response['message'],  # Store the response separately
            response_source=ai_response.get('source', 'unknown'),
            response_time=ai_response.get('processing_time', 0),
            confidence_score=ai_response.get('confidence', 0)
        )
        
        # Update user message with bot's response
        user_message.response = ai_response['message']
        user_message.save()
        
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
@throttle_classes([ChatRateThrottle])
def gemini_chat(request):
    """
    Process chat messages through Gemini AI
    
    POST /api/v1/chat/gemini/
    {
        "query": "What is quantum computing?",
        "context": null  // optional conversation context
    }
    """
    try:
        data = json.loads(request.body) if request.body else {}
        query = data.get('query', '').strip()
        context = data.get('context')

        if not query:
            return Response({
                'error': 'Query is required',
                'code': 'MISSING_QUERY'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Process with Gemini
        try:
            response = multilingual_ai_handler.process_with_gemini(
                query=query,
                context=context,
                user=request.user if request.user.is_authenticated else None
            )
        except Exception as e:
            logger.error(f"Error processing with Gemini: {e}", exc_info=True)
            return Response({
                'error': f'Failed to process query: {str(e)}',
                'code': 'GEMINI_PROCESSING_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(response, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        return Response({
            'error': str(e),
            'code': 'GEMINI_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
@throttle_classes([ChatRateThrottle])
def gemini_translate(request):
    """
    Translate text using Gemini AI
    
    POST /api/v1/chat/gemini/translate/
    {
        "text": "Hello world",
        "target_lang": "English"  // target language
    }
    """
    try:
        data = json.loads(request.body) if request.body else {}
        text = data.get('text', '').strip()
        target_lang = data.get('target_lang', 'English')

        if not text:
            return Response({
                'error': 'Text is required',
                'code': 'MISSING_TEXT'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Process translation
        response = multilingual_ai_handler.translate_with_gemini(
            text=text,
            target_lang=target_lang
        )

        return Response(response, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Gemini translation error: {e}")
        return Response({
            'error': str(e),
            'code': 'TRANSLATION_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
@throttle_classes([ChatRateThrottle])
def gemini_image_gen(request):
    """
    Generate images using Gemini AI
    
    POST /api/v1/chat/gemini/image/
    {
        "prompt": "A beautiful sunset over mountains"
    }
    """
    try:
        data = json.loads(request.body) if request.body else {}
        prompt = data.get('prompt', '').strip()

        if not prompt:
            return Response({
                'error': 'Prompt is required',
                'code': 'MISSING_PROMPT'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate image
        response = multilingual_ai_handler.generate_image_with_gemini(
            prompt=prompt,
            user=request.user if request.user.is_authenticated else None
        )

        return Response(response, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Gemini image generation error: {e}")
        return Response({
            'error': str(e),
            'code': 'IMAGE_GEN_ERROR'
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
    """Simple health check endpoint"""
    try:
        return Response({
            'status': 'healthy',
            'message': 'Server is running',
            'timestamp': timezone.now().isoformat()
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
