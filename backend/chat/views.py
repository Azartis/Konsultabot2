from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
import uuid
import logging

from .models import KnowledgeBase, CampusInfo, Conversation, ChatSession
from .serializers import (
    KnowledgeBaseSerializer, 
    CampusInfoSerializer, 
    ConversationSerializer,
    ChatMessageSerializer,
    ChatResponseSerializer,
    ChatSessionSerializer
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
