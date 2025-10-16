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

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)

# List available models
logger.info("Available models:")
for model_info in genai.list_models():
    logger.info(f"Model: {model_info.name}")
    logger.info(f"  Display name: {model_info.display_name}")
    logger.info(f"  Description: {model_info.description}")
    logger.info(f"  Version: {model_info.version}")
    logger.info(f"  Supported methods: {model_info.supported_generation_methods}")
    logger.info("---")

# Use the latest pro model for chat
model = genai.GenerativeModel('models/gemini-pro-latest')

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([ChatRateThrottle])
def gemini_chat(request):
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