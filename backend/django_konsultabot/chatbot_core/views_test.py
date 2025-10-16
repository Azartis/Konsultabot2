"""
Test endpoints for Gemini integration in KonsultaBot
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from .utils.gemini_helper import GeminiModelManager

# Initialize the Gemini model manager
gemini = None  # We'll initialize this later

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def test_ping(request):
    """Simple test endpoint that just returns success"""
    try:
        return Response({
            'status': 'success',
            'message': 'API is working',
            'time': '2025-10-15 20:15:00'
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def test_simple(request):
    """Test endpoint for checking Gemini configuration"""
    try:
        # Get available models
        models = gemini.list_available_models()
        
        return Response({
            'status': 'success',
            'gemini_configured': gemini.is_configured(),
            'model': settings.KONSULTABOT_SETTINGS['AI_MODEL'],
            'available_models': models[:5],  # Only show first 5 models
            'config': {
                k: v for k, v in settings.KONSULTABOT_SETTINGS.items() 
                if k not in ['GOOGLE_API_KEY']  # Don't expose API key
            }
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def test_gemini(request):
    """Test endpoint for Gemini chat functionality"""
    try:
        # Get the prompt from request data
        prompt = request.data.get('query', '')
        if not prompt:
            return Response({
                'status': 'error',
                'message': 'Missing query parameter'
            }, status=400)

        # Generate response using Gemini
        response = gemini.generate_response(prompt)
        if not response:
            return Response({
                'status': 'error',
                'message': 'Failed to generate response'
            }, status=500)

        # Return successful response
        return Response({
            'status': 'success',
            'model': gemini.model_name,
            'query': prompt,
            'response': response,
            'model_info': gemini.get_model_info()
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)