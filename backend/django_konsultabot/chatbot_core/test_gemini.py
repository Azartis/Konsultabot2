"""
Test endpoint for Gemini integration
"""
import os
from rest_framework.decorators import authentication_classes, api_view, permission_classes
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai
from django.conf import settings
import json

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def test_gemini(request):
    """Simple test endpoint for Gemini"""
    try:
        # Use request.data instead of json.loads
        query = request.data.get('query', '')
        if not query:
            return Response({
                'error': 'Query is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Configure Gemini
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            return Response({
                'error': 'API key not configured'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        genai.configure(api_key=api_key)
        
        # For debugging
        print(f"API Key: {api_key[:10]}...{api_key[-5:]}")
        print(f"Query: {query}")
        
        try:
            # Create model instance
            model = genai.GenerativeModel('models/gemini-2.5-pro')
            
            # Generate response with safety settings
            print("Generating response for query:", query)
            response = model.generate_content(query)
            print("Response generated successfully")
            
            if not hasattr(response, 'text'):
                print(f"Response content: {response}")
                return Response({
                    'error': 'No text attribute in response'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            print("Final response:", response.text)
            
            # Generate response with safety settings
            response = model.generate_content(
                query,
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
                ]
            )
            print("Response generated successfully")
            print(f"Response type: {type(response)}")
            print(f"Response attributes: {dir(response)}")
            
            if not hasattr(response, 'text'):
                print(f"Response content: {response}")
                return Response({
                    'error': 'No text attribute in response'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'response': response.text,
                'model': 'gemini-pro'
            })
            
        except Exception as e:
            print(f"Error: {str(e)}")
            print(f"Error type: {type(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)