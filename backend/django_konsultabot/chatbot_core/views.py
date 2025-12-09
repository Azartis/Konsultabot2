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
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
import tempfile
import os

from .ai_handler import multilingual_ai_handler
from .mode_router import ChatMode, detect_mode
try:
    from .utils.speech_processor import speech_processor
except (ImportError, ModuleNotFoundError) as e:
    import logging
    logger = logging.getLogger('konsultabot.views')
    logger.warning(f"Speech processor not available: {e}")
    speech_processor = None
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
    Enhanced chat endpoint for KonsultaBot with improved error handling
    
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
        feedback_only = data.get('feedback_only', False)
        
        # Allow empty query only for feedback-only requests
        if not query and not feedback_only:
            return Response({
                'status': 'error',
                'message': 'Query is required',
                'code': 'MISSING_QUERY'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Force English as default language - always use English for responses
        language = data.get('language', 'english').lower()
        # Normalize language - always default to English
        if language in ['auto', 'spanish', 'mexican', 'español', 'espanol'] or language not in ['english', 'tagalog', 'bisaya', 'waray']:
            language = 'english'
            logger.info(f"Language normalized to English (was: {data.get('language', 'english')})")
        
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
        
        # Try to get user from token if not authenticated
        user = None
        if request.user.is_authenticated:
            user = request.user
        else:
            # Try to get user from Authorization header
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                from rest_framework.authtoken.models import Token
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    token_key = auth_header.split(' ')[1]
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except (Token.DoesNotExist, IndexError, AttributeError):
                    pass
        
        # Get or create session
        session = None
        if session_id:
            try:
                session = ConversationSession.objects.get(
                    session_id=session_id
                )
                # Update user if we now have authentication
                if user and not session.user:
                    session.user = user
                    session.save()
            except ConversationSession.DoesNotExist:
                pass
        
        if not session:
            session = ConversationSession.objects.create(
                user=user,
                language=language if language != 'auto' else 'english'
            )
        
        # Get or create session context for tracking question count and satisfaction
        from .models import SessionContext
        session_context, _ = SessionContext.objects.get_or_create(
            session=session,
            defaults={'conversation_state': {}}
        )
        
        # Get current question count and satisfaction from conversation state
        state = session_context.conversation_state or {}
        question_count = state.get('question_count', 0)
        is_satisfied = state.get('is_satisfied', True)
        
        # Handle feedback-only requests (no AI processing needed)
        if feedback_only:
            satisfaction_feedback = data.get('is_satisfied')
            if satisfaction_feedback is not None:
                state['is_satisfied'] = bool(satisfaction_feedback)
            
            # Try to save previous technical solution if user gave positive feedback
            if satisfaction_feedback == True and query:
                # Get the last bot message from this session
                last_bot_message = ChatMessage.objects.filter(
                    session=session,
                    sender='bot',
                    response_source='gemini'
                ).order_by('-timestamp').first()
                
                if last_bot_message:
                    # Check if it's a technical query and save to KB
                    query_lower = query.lower()
                    technical_keywords = [
                        'wifi', 'network', 'internet', 'connection', 'connect',
                        'printer', 'print', 'printing',
                        'laptop', 'computer', 'pc', 'desktop',
                        'password', 'login', 'account', 'reset',
                        'error', 'crash', 'not working', 'broken', 'fix', 'repair',
                        'software', 'app', 'application', 'program',
                        'hardware', 'device', 'screen', 'keyboard', 'mouse',
                        'troubleshoot', 'problem', 'issue', 'help',
                        'install', 'update', 'download', 'virus', 'malware',
                        'email', 'outlook', 'microsoft', 'office',
                        'evsu', 'campus', 'it support', 'technical'
                    ]
                    
                    is_technical = any(keyword in query_lower for keyword in technical_keywords)
                    
                    if is_technical:
                        try:
                            from .knowledge_base import add_entry, search_best_match
                            existing_match = search_best_match(query, min_score=0.75)
                            if not existing_match:
                                tags = []
                                tag_keywords = {
                                    'wifi': ['wifi', 'network', 'internet', 'connection'],
                                    'printer': ['printer', 'print', 'printing'],
                                    'laptop': ['laptop', 'computer', 'pc', 'desktop'],
                                    'password': ['password', 'login', 'account', 'reset'],
                                    'software': ['software', 'app', 'application', 'program', 'install'],
                                    'hardware': ['hardware', 'device', 'screen', 'keyboard', 'mouse'],
                                    'error': ['error', 'crash', 'not working', 'broken'],
                                }
                                
                                for tag, keywords in tag_keywords.items():
                                    if any(kw in query_lower for kw in keywords):
                                        tags.append(tag)
                                
                                if not tags:
                                    tags = ['technical', 'support']
                                
                                title = query.strip()[:50] + ('...' if len(query) > 50 else '')
                                kb_entry = add_entry(
                                    title=title,
                                    question_pattern=query,
                                    answer=last_bot_message.message,
                                    tags=tags,
                                    source='gemini'
                                )
                                logger.info(f"Auto-saved technical solution to KB from feedback: {kb_entry.get('id')} - {title}")
                        except Exception as e:
                            logger.error(f"Failed to auto-save technical solution to KB from feedback: {e}")
            
            session_context.conversation_state = state
            session_context.save(update_fields=['conversation_state', 'updated_at'])
            
            return Response({
                'status': 'success',
                'message': 'Feedback received',
                'feedback_saved': True,
            }, status=status.HTTP_200_OK)
        
        # Check user's personal knowledge base first (if authenticated)
        user_kb_match = None
        if user:
            try:
                from chat.user_knowledge_base import search_user_knowledge_base
                user_kb_match = search_user_knowledge_base(user, query, language, min_confidence=0.6)
            except Exception as e:
                logger.error(f"Error checking user knowledge base: {e}")
        
        # If found in user KB, use it directly
        if user_kb_match:
            ai_response = {
                'message': user_kb_match['answer'],
                'intent': user_kb_match.get('category', 'general'),
                'confidence': user_kb_match['confidence'],
                'source': 'user_kb',
                'processing_time': 0.1,
                'question_count': question_count + 1,
                'metadata': {
                    'kb_entry_id': user_kb_match['id'],
                    'kb_category': user_kb_match['category']
                }
            }
        else:
            # Get conversation context (track last 10 messages for adaptive flow)
            context = session.get_recent_context(limit=10)
            
            # Detect mode upfront to satisfy routing rules
            routed = detect_mode(query)
            forced_mode = routed.mode
            
            # Process AI query with improved error handling
            try:
                ai_response = multilingual_ai_handler.handle_ai_query(
                    query=query,
                    user=request.user if request.user.is_authenticated else None,
                    language=language,
                    session=session,
                    context=context,
                    forced_mode=forced_mode
                )
            ai_response['mode'] = routed.mode.value
            ai_response['routing_reason'] = routed.reason
            ai_response.setdefault('metadata', {}).update(routed.metadata)
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
        response_source = ai_response.get('source', 'unknown')
        # Map 'knowledge_base' to the correct source choice
        if response_source == 'knowledge_base':
            response_source = 'knowledge_base'
        elif response_source not in ['gemini', 'knowledge_base', 'local_intelligence', 'hybrid', 'system']:
            response_source = 'gemini' if 'gemini' in response_source else 'unknown'
        
        bot_message = ChatMessage.objects.create(
            session=session,
            sender='bot',
            message=ai_response['message'],
            response=ai_response['message'],  # Store the response separately
            response_source=response_source,
            response_time=ai_response.get('processing_time', 0),
            confidence_score=ai_response.get('confidence', 0)
        )
        
        # Update user message with bot's response
        user_message.response = ai_response['message']
        user_message.save()
        
        # Save to user's personal knowledge base (if authenticated and not already from user KB)
        if user and ai_response.get('source') != 'user_kb':
            try:
                from chat.user_knowledge_base import (
                    save_to_user_knowledge_base,
                    extract_keywords_from_query,
                    categorize_query
                )
                
                # Only save if response has good confidence and is meaningful
                confidence = ai_response.get('confidence', 0)
                if confidence >= 0.5 and len(ai_response['message']) > 20:
                    category = categorize_query(query)
                    keywords = extract_keywords_from_query(query)
                    
                    user_kb_entry = save_to_user_knowledge_base(
                        user=user,
                        question=query,
                        answer=ai_response['message'],
                        language=language,
                        category=category,
                        keywords=keywords,
                        source='chat',
                        confidence=confidence
                    )
                    
                    if user_kb_entry:
                        logger.info(f"Saved to user KB for {user.username}: {user_kb_entry.id}")
            except Exception as e:
                logger.error(f"Error saving to user knowledge base: {e}")
        
        # Update question count in session context
        question_count = ai_response.get('question_count', question_count + 1)
        state['question_count'] = question_count
        
        # Check if user provided satisfaction feedback in the request
        satisfaction_feedback = data.get('is_satisfied')
        previous_satisfaction = state.get('is_satisfied', True)
        if satisfaction_feedback is not None:
            state['is_satisfied'] = bool(satisfaction_feedback)
        
        # Auto-save technical solutions to Knowledge Base when user is satisfied
        # Only save technical solutions (not general chat) when:
        # 1. Response came from Gemini (not already from KB)
        # 2. User just gave positive feedback (satisfaction changed to True)
        # 3. Query is technical support related
        # 4. Similar entry doesn't already exist in KB
        if (response_source == 'gemini' and 
            satisfaction_feedback is not None and 
            satisfaction_feedback == True):
            
            # Check if this is a technical support query
            query_lower = query.lower()
            intent = ai_response.get('intent', '').lower()
            
            # Technical keywords that indicate IT support queries
            technical_keywords = [
                'wifi', 'network', 'internet', 'connection', 'connect',
                'printer', 'print', 'printing',
                'laptop', 'computer', 'pc', 'desktop',
                'password', 'login', 'account', 'reset',
                'error', 'crash', 'not working', 'broken', 'fix', 'repair',
                'software', 'app', 'application', 'program',
                'hardware', 'device', 'screen', 'keyboard', 'mouse',
                'troubleshoot', 'problem', 'issue', 'help',
                'install', 'update', 'download', 'virus', 'malware',
                'email', 'outlook', 'microsoft', 'office',
                'evsu', 'campus', 'it support', 'technical'
            ]
            
            is_technical = any(keyword in query_lower for keyword in technical_keywords) or \
                          any(keyword in intent for keyword in ['tech', 'support', 'troubleshoot'])
            
            if is_technical:
                try:
                    from .knowledge_base import add_entry, search_best_match
                    # Check if similar entry already exists (high threshold to avoid duplicates)
                    existing_match = search_best_match(query, min_score=0.75)
                    if not existing_match:
                        # Extract relevant tags from query
                        tags = []
                        tag_keywords = {
                            'wifi': ['wifi', 'network', 'internet', 'connection'],
                            'printer': ['printer', 'print', 'printing'],
                            'laptop': ['laptop', 'computer', 'pc', 'desktop'],
                            'password': ['password', 'login', 'account', 'reset'],
                            'software': ['software', 'app', 'application', 'program', 'install'],
                            'hardware': ['hardware', 'device', 'screen', 'keyboard', 'mouse'],
                            'error': ['error', 'crash', 'not working', 'broken'],
                        }
                        
                        for tag, keywords in tag_keywords.items():
                            if any(kw in query_lower for kw in keywords):
                                tags.append(tag)
                        
                        if not tags:
                            tags = ['technical', 'support']
                        
                        # Generate title from query (first 50 chars)
                        title = query.strip()[:50] + ('...' if len(query) > 50 else '')
                        
                        # Save to Knowledge Base
                        kb_entry = add_entry(
                            title=title,
                            question_pattern=query,
                            answer=ai_response['message'],
                            tags=tags,
                            source='gemini'
                        )
                        logger.info(f"Auto-saved technical solution to KB: {kb_entry.get('id')} - {title}")
                except Exception as e:
                    logger.error(f"Failed to auto-save technical solution to KB: {e}")
                    # Don't fail the request if KB save fails
        
        session_context.conversation_state = state
        session_context.save(update_fields=['conversation_state', 'updated_at'])
        
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
            'connection_status': ai_response.get('connection_status', 'unknown'),
            'question_count': question_count,
            'is_satisfied': state.get('is_satisfied', True),
            'deeper_search_triggered': question_count >= 10 and not state.get('is_satisfied', True),
        }
        
        # Add voice response if requested
        if voice_response and ai_response['message']:
            try:
                if speech_processor is None:
                    raise ImportError("Speech processor not available")
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
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
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
        if speech_processor is None:
            return Response({
                'error': 'Speech recognition not available. Please install SpeechRecognition package.',
                'code': 'SPEECH_NOT_AVAILABLE'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
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
@permission_classes([AllowAny])
def transcribe_audio_endpoint(request):
    """
    Transcribe audio file to text (simplified endpoint for mobile app)
    
    POST /api/v1/chat/transcribe/
    Content-Type: multipart/form-data
    
    Form data:
    - audio: Audio file (wav, mp3, m4a, etc.)
    - language: Target language code (optional, default: 'en-US')
    
    Returns:
    {
        "transcript": "transcribed text",
        "text": "transcribed text",  # Alternative field name
        "confidence": 0.95,
        "language": "en-US"
    }
    """
    try:
        # Check if audio file is provided
        if 'audio' not in request.FILES:
            return Response({
                'error': 'Audio file is required',
                'code': 'MISSING_AUDIO'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        audio_file = request.FILES['audio']
        language = request.POST.get('language', 'en-US')
        
        # Validate file size (max 10MB)
        if audio_file.size > 10 * 1024 * 1024:
            return Response({
                'error': 'Audio file too large (max 10MB)',
                'code': 'FILE_TOO_LARGE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get file format from extension or content type
        file_extension = audio_file.name.split('.')[-1].lower() if '.' in audio_file.name else 'm4a'
        
        # Read audio data
        audio_data = audio_file.read()
        
        # Process speech to text
        if speech_processor is None:
            return Response({
                'error': 'Speech recognition not available',
                'code': 'SPEECH_NOT_AVAILABLE'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Convert language code format if needed (en-US -> english)
        language_map = {
            'en-US': 'english',
            'en': 'english',
            'tl-PH': 'tagalog',
            'ceb-PH': 'bisaya',
            'war-PH': 'waray',
        }
        language_key = language_map.get(language, 'english')
        
        # Transcribe audio
        stt_result = speech_processor.speech_to_text(
            audio_data=audio_data,
            language=language_key,
            audio_format=file_extension
        )
        
        # Prepare response in format expected by mobile app
        transcript = stt_result.get('text', '').strip()
        
        if not transcript and stt_result.get('error'):
            return Response({
                'error': stt_result['error'],
                'code': 'TRANSCRIPTION_FAILED',
                'transcript': '',
                'text': ''
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Return both 'transcript' and 'text' for compatibility
        response_data = {
            'transcript': transcript,
            'text': transcript,  # Alternative field name
            'confidence': stt_result.get('confidence', 0.0),
            'language': stt_result.get('language', language),
            'method': stt_result.get('method', 'unknown')
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Audio transcription error: {e}", exc_info=True)
        return Response({
            'error': 'Audio transcription failed',
            'code': 'TRANSCRIPTION_ERROR',
            'details': str(e),
            'transcript': '',
            'text': ''
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
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
        if speech_processor is None:
            return Response({
                'error': 'Text-to-speech not available. Please install SpeechRecognition package.',
                'code': 'TTS_NOT_AVAILABLE'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
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
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
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
