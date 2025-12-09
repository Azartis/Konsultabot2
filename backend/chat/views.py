from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.views.decorators.csrf import csrf_exempt
import uuid
import logging
import json

from .models import KnowledgeBase, CampusInfo, Conversation, ChatSession, UserKnowledgeBase
from .serializers import (
    KnowledgeBaseSerializer, 
    CampusInfoSerializer, 
    ConversationSerializer,
    ChatMessageSerializer,
    ChatResponseSerializer,
    ChatSessionSerializer,
    UserKnowledgeBaseSerializer
)
from .user_knowledge_base import (
    get_user_knowledge_base_entries,
    save_to_user_knowledge_base,
    search_user_knowledge_base
)
from .language_processor import LanguageProcessor
from .technical_knowledge import get_technical_solution
from .utility_functions import search_web_for_complex_problem, is_complex_technical_problem

# Direct Gemini integration
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def has_internet(timeout: float = 3.0) -> bool:
    """Check if internet is available"""
    try:
        requests.head("https://www.gstatic.com/generate_204", timeout=timeout)
        return True
    except Exception:
        return False

def ask_gemini_direct(prompt: str, system_instruction: str = None) -> str:
    """Direct Gemini API call"""
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY not found")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        final_prompt = prompt
        if system_instruction:
            final_prompt = f"{system_instruction}\n\nUser: {prompt}"
        
        response = model.generate_content(final_prompt)
        return response.text.strip() if hasattr(response, 'text') and response.text else ""
        
    except Exception as e:
        raise RuntimeError(f"Gemini failed: {e}")

def get_gemini_response(message: str, language: str = "english"):
    """Get response from Gemini with KonsultaBot persona"""
    print(f"🧪 Testing chat with Gemini: '{message}'")
    print(f"🔍 Checking internet: {has_internet()}")
    
    if not has_internet():
        print("❌ No internet connection")
        return None
    
    try:
        api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        print(f"🔑 API Key present: {bool(api_key)} (length: {len(api_key) if api_key else 0})")
        
        if not api_key:
            print("❌ No API key found")
            return None
        
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Simple prompt without complex system instruction
        prompt = f"You are KonsultaBot, an IT support assistant. User asks: {message}"
        
        print(f"📤 Sending to Gemini: {prompt[:50]}...")
        response = model.generate_content(prompt)
        
        if hasattr(response, 'text') and response.text:
            response_text = response.text.strip()
            print(f"📝 Gemini response length: {len(response_text)}")
            print(f"📄 Response preview: {response_text[:100]}...")
            return {"response": response_text, "mode": "online"}
        else:
            print(f"❌ No text in response: {response}")
            return None
            
    except Exception as e:
        print(f"❌ Gemini error: {e}")
        import traceback
        traceback.print_exc()
        return None

GEMINI_AVAILABLE = True
print("✅ Direct Gemini integration loaded")

logger = logging.getLogger('konsultabot')

# Initialize language processor
language_processor = LanguageProcessor()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Process chat message and return AI response"""
    serializer = ChatMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    message = serializer.validated_data['message']
    language = serializer.validated_data.get('language', 'english')
    session_id = serializer.validated_data.get('session_id')
    
    try:
        # Get or create chat session
        if session_id:
            try:
                chat_session = ChatSession.objects.get(session_id=session_id, user=request.user, is_active=True)
            except ChatSession.DoesNotExist:
                chat_session = ChatSession.objects.create(
                    user=request.user,
                    session_id=session_id
                )
        else:
            # Create new session
            session_id = str(uuid.uuid4())
            chat_session = ChatSession.objects.create(
                user=request.user,
                session_id=session_id
            )
        
        # Check if this is a complex technical problem that needs web search
        if is_complex_technical_problem(message):
            print(f"Complex technical problem detected - using Google AI")
            web_result = search_web_for_complex_problem(message, language)
            if web_result and web_result.get('answer'):
                web_response = f"🤖 **Let me help you with this complex issue:**\n\n{web_result['answer']}\n\n*I used my advanced AI capabilities to give you the most comprehensive guidance possible. Did this help clarify things for you?*"
                
                # Save complex technical conversation
                conversation = Conversation.objects.create(
                    user=request.user,
                    message=message,
                    response=web_response,
                    language_detected=language,
                    mode='complex_technical_ai',
                    confidence_score=web_result.get('confidence', 0.9),
                    response_time=2.0
                )
                
                # Update session
                chat_session.message_count += 1
                chat_session.save(update_fields=['message_count'])
                
                return Response({
                    'response': web_response,
                    'language': language,
                    'intent': 'complex_technical',
                    'mode': 'complex_technical_ai',
                    'confidence': web_result.get('confidence', 0.9),
                    'response_time': 2.0,
                    'session_id': session_id
                })

        # Check for basic technical problems (knowledge base)
        tech_solution = get_technical_solution(message, language)
        if tech_solution:
            # Save technical conversation
            conversation = Conversation.objects.create(
                user=request.user,
                message=message,
                response=f"**{tech_solution['problem']}**\n\n{tech_solution['solution']}\n\n**Prevention:** {tech_solution['prevention']}",
                language_detected=language,
                mode='technical_knowledge',
                confidence_score=tech_solution['confidence'],
                response_time=0.5
            )
            
            # Update session
            chat_session.message_count += 1
            chat_session.save(update_fields=['message_count'])
            
            return Response({
                'response': f"**{tech_solution['problem']}**\n\n{tech_solution['solution']}\n\n**Prevention:** {tech_solution['prevention']}",
                'mode': 'technical_knowledge',
                'language': language,
                'confidence': tech_solution['confidence'],
                'session_id': session_id
            })
        
        # Enhanced technical keyword detection as fallback
        technical_keywords = [
            'problem', 'issue', 'error', 'not working', 'broken', 'fix', 'help',
            'troubleshoot', 'repair', 'solve', 'crash', 'freeze', 'slow', 'fast',
            'install', 'update', 'driver', 'software', 'hardware', 'network',
            'internet', 'wifi', 'connection', 'password', 'login', 'account',
            'file', 'folder', 'document', 'email', 'browser', 'website',
            'virus', 'malware', 'security', 'backup', 'recovery', 'data'
        ]
        
        if any(keyword in message.lower() for keyword in technical_keywords):
            technical_help_response = """Hey! I can definitely help you with that technical issue! 😊 I know tech problems can be really frustrating, but don't worry - we'll figure this out together.

To give you the best help possible, could you tell me a bit more about what's happening?

🔧 **I'd love to know:**
• What device or software is giving you trouble?
• What exactly is it doing (or not doing)?
• When did you first notice this problem?
• Have you tried anything to fix it yet?

**I'm really good at solving these common issues:**
🖨️ **Printer troubles:** Won't turn on, paper jams, printing quality issues, showing offline
💻 **Computer problems:** Won't start, running super slow, freezing up, overheating
🌐 **Internet/WiFi:** Can't connect, slow speeds, keeps dropping connection
📱 **Mobile devices:** Sluggish performance, battery draining fast, app crashes
💾 **Software issues:** Programs won't open, update problems, virus concerns

The more details you can share, the better I can help you get this sorted out! Don't worry if you're not sure about technical terms - just describe what you're experiencing in your own words. 👍"""
            
            # Save technical support request conversation
            conversation = Conversation.objects.create(
                user=request.user,
                message=message,
                response=technical_help_response,
                language_detected=language,
                mode='technical_support_request',
                confidence_score=0.8,
                response_time=0.3
            )
            
            # Update session
            chat_session.message_count += 1
            chat_session.save(update_fields=['message_count'])
            
            return Response({
                'response': technical_help_response,
                'mode': 'technical_support_request',
                'language': language,
                'confidence': 0.8,
                'session_id': session_id
            })
        
        # Process message with language processor (for non-technical queries)
        result = language_processor.process_message(
            message=message,
            language=language,
            online_mode=True,
            user=request.user
        )
        
        # Check if we got a low-confidence or generic response - use web search as fallback
        if (result['confidence'] < 0.7 or 
            'how can i help' in result['response'].lower() or 
            'i\'m here to help' in result['response'].lower() or
            'welcome to konsultabot' in result['response'].lower() or
            'what would you like to know' in result['response'].lower() or
            result['mode'] in ['basic_response', 'fallback', 'greeting']):
            
            print(f"Low confidence response ({result['confidence']}) - trying web search")
            
            # Try web search for better answer
            web_result = search_web_for_complex_problem(message, language)
            if web_result and web_result.get('answer'):
                web_response = f"🌐 **Let me search for a better answer:**\n\n{web_result['answer']}\n\n*I wanted to make sure I gave you the most helpful response possible! Does this answer your question, or would you like me to explain anything further?*"
                
                # Save web search conversation
                conversation = Conversation.objects.create(
                    user=request.user,
                    message=message,
                    response=web_response,
                    language_detected=language,
                    mode='web_search_fallback',
                    confidence_score=web_result.get('confidence', 0.8),
                    response_time=1.5
                )
                
                # Update session
                chat_session.message_count += 1
                chat_session.save(update_fields=['message_count'])
                
                return Response({
                    'response': web_response,
                    'language': language,
                    'intent': 'web_search',
                    'mode': 'web_search_fallback',
                    'confidence': web_result.get('confidence', 0.8),
                    'response_time': 1.5,
                    'session_id': session_id
                })
        
        # Try Gemini integration for general questions (more aggressive triggering)
        general_keywords = ['what is', 'explain', 'how does', 'tell me about', 'artificial intelligence', 'machine learning', 'quantum', 'blockchain', 'technology']
        is_general_question = any(keyword in message.lower() for keyword in general_keywords)
        
        if GEMINI_AVAILABLE and (result['confidence'] < 0.9 or result['mode'] in ['basic_response', 'fallback', 'greeting'] or is_general_question):
            print(f"🤖 Trying Gemini for: '{message}' (confidence: {result['confidence']}, mode: {result['mode']}, general: {is_general_question})")
            try:
                # Use the working simple Gemini function
                import google.generativeai as genai
                # Use the working API key
                api_key = "AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U"
                if api_key:
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel("gemini-2.5-flash")
                    response = model.generate_content(f"You are KonsultaBot, an IT support assistant for EVSU Dulag Campus. Answer this: {message}")
                    
                    if hasattr(response, 'text') and response.text:
                        gemini_response = f"🤖 **KonsultaBot AI:**\n\n{response.text}\n\n*I used my advanced AI capabilities to give you the most helpful answer possible!*"
                        
                        # Save Gemini conversation
                        conversation = Conversation.objects.create(
                            user=request.user,
                            message=message,
                            response=gemini_response,
                            language_detected=language,
                            mode='gemini_ai',
                            confidence_score=0.9,
                            response_time=1.5
                        )
                        
                        # Update session
                        chat_session.message_count += 1
                        chat_session.save(update_fields=['message_count'])
                        
                        return Response({
                            'response': gemini_response,
                            'language': language,
                            'intent': 'ai_assistance',
                            'mode': 'gemini_ai',
                            'confidence': 0.9,
                            'response_time': 1.5,
                            'session_id': session_id
                        })
            except Exception as e:
                logger.warning(f"Gemini fallback failed: {e}")
        
        # Save regular conversation
        conversation = Conversation.objects.create(
            user=request.user,
            message=message,
            response=result['response'],
            language_detected=result['language'],
            mode=result['mode'],
            confidence_score=result['confidence'],
            response_time=result['response_time']
        )
        
        # Update session
        chat_session.message_count += 1
        chat_session.save(update_fields=['message_count'])
        
        # Prepare response
        response_data = {
            'response': result['response'],
            'language': result['language'],
            'intent': result['intent'],
            'mode': result['mode'],
            'confidence': result['confidence'],
            'response_time': result['response_time'],
            'session_id': session_id
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return Response({
            'error': 'Failed to process message',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_history(request):
    """Get user's conversation history"""
    conversations = Conversation.objects.filter(user=request.user).order_by('-timestamp')[:50]
    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_sessions(request):
    """Get user's chat sessions"""
    sessions = ChatSession.objects.filter(user=request.user).order_by('-started_at')[:20]
    serializer = ChatSessionSerializer(sessions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_session(request):
    """End a chat session"""
    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'error': 'Session ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        session = ChatSession.objects.get(session_id=session_id, user=request.user)
        session.is_active = False
        session.ended_at = timezone.now()
        session.save()
        
        return Response({'message': 'Session ended successfully'})
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([])  # No authentication required for testing
def test_gemini(request):
    """Test Gemini integration directly"""
    if not GEMINI_AVAILABLE:
        return Response({'error': 'Gemini not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    message = request.data.get('message', 'Hello')
    language = request.data.get('language', 'english')
    
    try:
        result = get_bot_response(message, language)
        return Response({
            'message': message,
            'response': result['response'],
            'mode': result['mode'],
            'gemini_available': GEMINI_AVAILABLE,
            'status': 'success'
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'gemini_available': GEMINI_AVAILABLE,
            'status': 'failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([])  # No authentication required for testing
def test_chat_gemini(request):
    """Test chat with Gemini integration - no auth required"""
    message = request.data.get('message', 'Hello')
    language = request.data.get('language', 'english')
    
    debug_info = []
    debug_info.append(f"🧪 Testing chat with Gemini: '{message}'")
    
    if not GEMINI_AVAILABLE:
        return Response({
            'error': 'Gemini not available',
            'gemini_available': False,
            'message': message,
            'debug': debug_info
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    try:
        # Try Gemini directly first
        debug_info.append("Calling get_gemini_response...")
        gemini_result = get_gemini_response(message, language)
        debug_info.append(f"Gemini result: {gemini_result}")
        
        if gemini_result and gemini_result.get('response'):
            response_text = f"🤖 **KonsultaBot AI:**\n\n{gemini_result['response']}\n\n*Powered by Gemini AI!*"
            
            return Response({
                'response': response_text,
                'language': language,
                'mode': gemini_result.get('mode', 'unknown'),
                'gemini_available': True,
                'original_response': gemini_result['response'],
                'status': 'success',
                'debug': debug_info
            })
        else:
            return Response({
                'error': 'No response from Gemini',
                'gemini_available': True,
                'message': message,
                'debug': debug_info
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        debug_info.append(f"Exception: {str(e)}")
        return Response({
            'error': str(e),
            'gemini_available': GEMINI_AVAILABLE,
            'message': message,
            'status': 'failed',
            'debug': debug_info
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def knowledge_base(request):
    """Get knowledge base entries"""
    language = request.GET.get('language', 'english')
    category = request.GET.get('category')
    
    queryset = KnowledgeBase.objects.filter(language=language, is_active=True)
    if category:
        queryset = queryset.filter(category=category)
    
    knowledge = queryset.order_by('-confidence_score')[:20]
    serializer = KnowledgeBaseSerializer(knowledge, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def campus_info(request):
    """Get campus information"""
    language = request.GET.get('language', 'english')
    category = request.GET.get('category')
    
    queryset = CampusInfo.objects.filter(language=language, is_active=True)
    if category:
        queryset = queryset.filter(category=category)
    
    info = queryset.order_by('-created_at')[:20]
    serializer = CampusInfoSerializer(info, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_knowledge(request):
    """Search knowledge base"""
    query = request.GET.get('q', '')
    language = request.GET.get('language', 'english')
    
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Search in knowledge base
    knowledge = KnowledgeBase.objects.filter(
        models.Q(question__icontains=query) | models.Q(keywords__icontains=query),
        language=language,
        is_active=True
    ).order_by('-confidence_score')[:10]
    
    # Search in campus info
    campus = CampusInfo.objects.filter(
        models.Q(title__icontains=query) | models.Q(content__icontains=query) | models.Q(tags__icontains=query),
        language=language,
        is_active=True
    ).order_by('-created_at')[:10]
    
    return Response({
        'knowledge_base': KnowledgeBaseSerializer(knowledge, many=True).data,
        'campus_info': CampusInfoSerializer(campus, many=True).data
    })

@api_view(['POST', 'GET'])
@permission_classes([])  # No authentication required
def simple_gemini_test(request):
    """Ultra simple Gemini test"""
    if request.method == 'GET':
        return Response({'message': 'Send POST with {"message": "your question"}'})
    
    message = request.data.get('message', 'Hello')
    
    try:
        import os
        from dotenv import load_dotenv
        
        # Load .env from project root
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
        load_dotenv(env_path)
        
        # Also try loading from backend .env
        backend_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        load_dotenv(backend_env)
        
        # Temporarily use direct API key for testing
        api_key = "AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U"
        
        if not api_key:
            return Response({'error': 'No API key found', 'status': 'failed'})
        
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        response = model.generate_content(f"You are KonsultaBot. Answer this: {message}")
        
        if hasattr(response, 'text') and response.text:
            return Response({
                'message': message,
                'response': response.text,
                'status': 'success',
                'mode': 'gemini'
            })
        else:
            return Response({'error': 'No response text', 'status': 'failed'})
            
    except Exception as e:
        return Response({'error': str(e), 'status': 'failed'})

@api_view(['GET'])
@permission_classes([])  # No authentication required
def server_info(request):
    """Get server IP information for mobile app configuration"""
    import socket
    
    def get_local_ip():
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"
    
    # Get the IP from the request
    client_ip = request.META.get('REMOTE_ADDR', 'unknown')
    server_ip = get_local_ip()
    
    # Get host from request
    host = request.get_host()
    
    return Response({
        'server_ip': server_ip,
        'client_ip': client_ip,
        'host': host,
        'port': 8000,
        'endpoints': {
            'api_root': f'http://{server_ip}:8000/api/',
            'gemini': f'http://{server_ip}:8000/api/chat/simple-gemini/',
            'chat': f'http://{server_ip}:8000/api/chat/send/',
            'auth': f'http://{server_ip}:8000/api/users/'
        },
        'status': 'success'
    })

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def v1_chat_endpoint(request):
    """
    Simple chat endpoint at /api/v1/chat/
    
    Accepts POST requests with JSON body:
    {
        "query": "Your question here",
        "language": "english"  // optional
    }
    
    Returns:
    {
        "response": "AI response text",
        "status": "success"
    }
    """
    try:
        # Parse request data - support multiple methods:
        # 1. JSON body (request.data from DRF)
        # 2. Raw JSON body (request.body)
        # 3. Query parameters (for simple GET/POST requests)
        data = {}
        
        # Method 1: Try DRF's parsed data (from JSON body)
        if hasattr(request, 'data') and request.data:
            data = request.data
        # Method 2: Try parsing raw body
        elif request.body:
            try:
                body_str = request.body.decode('utf-8')
                if body_str.strip():
                    data = json.loads(body_str)
            except (json.JSONDecodeError, UnicodeDecodeError):
                # If JSON parsing fails, treat as form data or empty
                pass
        
        # Method 3: Fallback to query parameters (GET/POST params)
        # This allows: ?message=hello&language=english
        query_params = request.GET if hasattr(request, 'GET') else {}
        if not data or (not data.get('query') and not data.get('message')):
            # If no body data, check query parameters
            if query_params.get('message') or query_params.get('query'):
                data = {
                    'query': query_params.get('query') or query_params.get('message', ''),
                    'language': query_params.get('language', 'english')
                }
        
        # If still no data, return error
        if not data:
            return Response({
                'status': 'error',
                'message': 'Request body or query parameters required. Send JSON body with "query" or "message" field, or use query parameters: ?message=your_message&language=english',
                'code': 'MISSING_BODY',
                'help': {
                    'method1': 'POST with JSON body: {"query": "your message", "language": "english"}',
                    'method2': 'POST/GET with query params: ?message=your_message&language=english'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract query (support both 'query' and 'message' fields)
        query = data.get('query', '') or data.get('message', '')
        if isinstance(query, str):
            query = query.strip()
        else:
            query = str(query).strip() if query else ''
        
        if not query:
            return Response({
                'status': 'error',
                'message': 'Query or message is required. Provide "query" or "message" in body or as query parameter.',
                'code': 'MISSING_QUERY'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get language (optional, default to english)
        language = data.get('language', 'english')
        if isinstance(language, str):
            language = language.lower()
        else:
            language = 'english'
        
        if language not in ['english', 'tagalog', 'bisaya', 'waray']:
            language = 'english'
        
        # Get response using Gemini
        gemini_result = get_gemini_response(query, language)
        
        if gemini_result and gemini_result.get('response'):
            return Response({
                'status': 'success',
                'response': gemini_result['response'],
                'language': language,
                'mode': gemini_result.get('mode', 'online')
            }, status=status.HTTP_200_OK)
        else:
            # Fallback response if Gemini fails
            return Response({
                'status': 'error',
                'message': 'Unable to generate response. Please try again.',
                'code': 'RESPONSE_GENERATION_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error in v1_chat_endpoint: {e}")
        return Response({
            'status': 'error',
            'message': 'Internal server error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.http import JsonResponse, HttpResponse
import base64

# Try to import speech processor
try:
    from .speech_processor import speech_processor
except ImportError:
    logger.warning("Speech processor not available")
    speech_processor = None

@csrf_exempt
def chat_history_view(request):
    if request.method == 'GET':
        # TODO: fetch real history for logged-in user
        return JsonResponse({'messages': []}, safe=False)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def speech_to_text_view(request):
    """
    Convert uploaded audio to text
    
    POST /api/v1/chat/speech-to-text/
    Content-Type: multipart/form-data
    
    Form data:
    - audio: Audio file (wav, mp3, m4a, etc.)
    - language: Target language (optional, default: 'english')
    
    Returns:
    {
        "text": "transcribed text",
        "confidence": 0.95,
        "language": "english",
        "method": "google_speech_api"
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
        language = request.POST.get('language', 'english')
        
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
                'error': 'Speech recognition not available. Please install SpeechRecognition and pydub packages.',
                'code': 'SPEECH_NOT_AVAILABLE'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        stt_result = speech_processor.speech_to_text(
            audio_data=audio_data,
            language=language,
            audio_format=file_extension
        )
        
        # Prepare response
        if stt_result.get('error'):
            return Response({
                'error': stt_result['error'],
                'code': 'RECOGNITION_FAILED',
                'text': '',
                'confidence': 0.0
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        response_data = {
            'text': stt_result.get('text', ''),
            'confidence': stt_result.get('confidence', 0.0),
            'language': stt_result.get('language', language),
            'method': stt_result.get('method', 'unknown')
        }
        
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
@csrf_exempt
def transcribe_audio_view(request):
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
        "text": "transcribed text",
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
        
        # Get file format from extension
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
            'text': transcript,
            'confidence': stt_result.get('confidence', 0.0),
            'language': stt_result.get('language', language),
            'method': stt_result.get('method', 'unknown')
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Audio transcription error: {e}")
        return Response({
            'error': 'Audio transcription failed',
            'code': 'TRANSCRIPTION_ERROR',
            'details': str(e),
            'transcript': '',
            'text': ''
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_knowledge_base_list(request):
    """
    Get all user's personal knowledge base entries
    
    GET /api/v1/chat/user-kb/
    """
    try:
        entries = get_user_knowledge_base_entries(request.user, limit=100)
        return Response({
            'status': 'success',
            'count': len(entries),
            'entries': entries
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting user knowledge base: {e}")
        return Response({
            'status': 'error',
            'message': str(e),
            'code': 'KB_FETCH_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_knowledge_base_create(request):
    """
    Create a new entry in user's personal knowledge base
    
    POST /api/v1/chat/user-kb/
    {
        "question": "How do I connect to WiFi?",
        "answer": "Go to settings and select EVSU WiFi",
        "category": "technical",
        "language": "english",
        "keywords": "wifi, network, connect"
    }
    """
    try:
        question = request.data.get('question', '').strip()
        answer = request.data.get('answer', '').strip()
        
        if not question or not answer:
            return Response({
                'status': 'error',
                'message': 'Question and answer are required',
                'code': 'MISSING_FIELDS'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        category = request.data.get('category', 'general')
        language = request.data.get('language', 'english')
        keywords = request.data.get('keywords', '')
        confidence = float(request.data.get('confidence', 0.8))
        
        entry = save_to_user_knowledge_base(
            user=request.user,
            question=question,
            answer=answer,
            language=language,
            category=category,
            keywords=keywords,
            source='manual',
            confidence=confidence
        )
        
        if entry:
            serializer = UserKnowledgeBaseSerializer(entry)
            return Response({
                'status': 'success',
                'message': 'Knowledge base entry created',
                'entry': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'status': 'error',
                'message': 'Failed to create entry',
                'code': 'CREATE_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error creating user knowledge base entry: {e}")
        return Response({
            'status': 'error',
            'message': str(e),
            'code': 'KB_CREATE_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_knowledge_base_detail(request, entry_id):
    """
    Get, update, or delete a specific user knowledge base entry
    
    GET /api/v1/chat/user-kb/{id}/
    PUT /api/v1/chat/user-kb/{id}/
    DELETE /api/v1/chat/user-kb/{id}/
    """
    try:
        entry = UserKnowledgeBase.objects.get(id=entry_id, user=request.user)
        
        if request.method == 'GET':
            serializer = UserKnowledgeBaseSerializer(entry)
            return Response({
                'status': 'success',
                'entry': serializer.data
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            # Update entry
            entry.question = request.data.get('question', entry.question)
            entry.answer = request.data.get('answer', entry.answer)
            entry.category = request.data.get('category', entry.category)
            entry.language = request.data.get('language', entry.language)
            entry.keywords = request.data.get('keywords', entry.keywords)
            entry.is_active = request.data.get('is_active', entry.is_active)
            
            if 'confidence_score' in request.data:
                entry.confidence_score = float(request.data['confidence_score'])
            
            entry.save()
            
            serializer = UserKnowledgeBaseSerializer(entry)
            return Response({
                'status': 'success',
                'message': 'Entry updated',
                'entry': serializer.data
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'DELETE':
            entry.delete()
            return Response({
                'status': 'success',
                'message': 'Entry deleted'
            }, status=status.HTTP_200_OK)
            
    except UserKnowledgeBase.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Entry not found',
            'code': 'NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in user knowledge base detail: {e}")
        return Response({
            'status': 'error',
            'message': str(e),
            'code': 'KB_DETAIL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_knowledge_base_sync(request):
    """
    Sync user knowledge base entries (for offline sync)
    
    POST /api/v1/chat/user-kb/sync/
    {
        "entries": [
            {
                "question": "...",
                "answer": "...",
                "category": "...",
                ...
            }
        ]
    }
    """
    try:
        entries_data = request.data.get('entries', [])
        synced_count = 0
        errors = []
        
        for entry_data in entries_data:
            try:
                question = entry_data.get('question', '').strip()
                answer = entry_data.get('answer', '').strip()
                
                if not question or not answer:
                    continue
                
                save_to_user_knowledge_base(
                    user=request.user,
                    question=question,
                    answer=answer,
                    language=entry_data.get('language', 'english'),
                    category=entry_data.get('category', 'general'),
                    keywords=entry_data.get('keywords', ''),
                    source=entry_data.get('source', 'sync'),
                    confidence=float(entry_data.get('confidence_score', 0.8))
                )
                synced_count += 1
            except Exception as e:
                errors.append(str(e))
        
        return Response({
            'status': 'success',
            'synced_count': synced_count,
            'total_count': len(entries_data),
            'errors': errors if errors else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error syncing user knowledge base: {e}")
        return Response({
            'status': 'error',
            'message': str(e),
            'code': 'KB_SYNC_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
