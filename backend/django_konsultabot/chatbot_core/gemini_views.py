from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.throttling import UserRateThrottle

class ChatRateThrottle(UserRateThrottle):
    scope = 'chat'
    rate = '100/hour'
import google.generativeai as genai
from django.conf import settings
import json
import logging

logger = logging.getLogger('konsultabot.gemini')

GOOGLE_API_KEY = getattr(settings, 'GOOGLE_API_KEY', None)
GEMINI_ENABLED = False
model = None

if GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        logger.info("Gemini API key detected. Initializing Gemini client...")
        try:
            logger.info("Available models:")
            for model_info in genai.list_models():
                logger.info(f"Model: {model_info.name}")
                logger.info(f"  Display name: {model_info.display_name}")
                logger.info(f"  Description: {model_info.description}")
                logger.info(f"  Version: {model_info.version}")
                logger.info(f"  Supported methods: {model_info.supported_generation_methods}")
                logger.info("---")
        except Exception as list_error:
            logger.warning(f"Unable to list Gemini models: {list_error}")

        # Try models in order of preference with fallback
        # Use models/ prefix for SDK
        fallback_models = [
            'models/gemini-2.5-flash',      # Latest stable Flash (June 2025)
            'models/gemini-2.0-flash',      # Stable Flash (January 2025)
            'models/gemini-flash-latest',    # Latest release alias
            'models/gemini-2.5-pro',        # Pro version
            'models/gemini-pro-latest',      # Legacy Pro alias
        ]
        
        model = None
        for model_name in fallback_models:
            try:
                model = genai.GenerativeModel(model_name)
                logger.info(f"Successfully initialized Gemini model: {model_name}")
                GEMINI_ENABLED = True
                break
            except Exception as model_error:
                logger.warning(f"Could not initialize {model_name}: {model_error}")
                if model_name == fallback_models[-1]:
                    # Last model failed
                    logger.error(f"All Gemini models failed. Last error: {model_error}")
                    raise
                continue
        
        if model:
            logger.info("Gemini model initialized successfully.")
    except Exception as config_error:
        logger.error(f"Failed to initialize Gemini due to configuration error: {config_error}")
else:
    logger.warning("GOOGLE_API_KEY not set. Gemini endpoints will be disabled.")

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([ChatRateThrottle])
def gemini_chat(request):
    if not GEMINI_ENABLED or model is None:
        return Response({
            'error': 'Gemini integration is currently disabled on the server. Please configure GOOGLE_API_KEY to enable AI responses.',
            'mode': 'gemini',
            'success': False
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    try:
        message = request.data.get('query')
        context = request.data.get('context', '')
        
        if not message:
            return Response({
                'error': 'No message provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Add context if provided
        prompt = f"{context}\n\n{message}" if context else message

        try:
            # Generate response from Gemini
            response = model.generate_content(prompt)
            
            if response and response.text:
                return Response({
                    'response': response.text,
                    'mode': 'gemini',
                    'success': True
                })
            else:
                logger.error("Gemini returned empty response")
                return Response({
                    'error': 'No response from AI model',
                    'mode': 'gemini',
                    'success': False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Error generating Gemini response: {e}", exc_info=True)
            return Response({
                'error': f'Failed to generate response: {str(e)}',
                'mode': 'gemini',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
@throttle_classes([ChatRateThrottle])
def gemini_translate(request):
    if not GEMINI_ENABLED or model is None:
        return Response({
            'error': 'Gemini integration is currently disabled on the server.',
            'success': False
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    try:
        text = request.data.get('text')
        target_lang = request.data.get('target_lang', 'English')
        
        if not text:
            return Response({
                'error': 'No text provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"Translate the following text to {target_lang}:\n\n{text}"
        
        response = model.generate_content(prompt)
        
        return Response({
            'translation': response.text,
            'source_text': text,
            'target_language': target_lang,
            'success': True
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)