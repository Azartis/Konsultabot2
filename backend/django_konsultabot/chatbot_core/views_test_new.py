"""
Simple test endpoint for Gemini
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import os

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def test_ping(request):
    """Simple test endpoint that just returns success"""
    return Response({
        'status': 'success',
        'message': 'API is working'
    })

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def test_simple(request):
    """Simple test endpoint for testing Gemini configuration"""
    return Response({
        'status': 'debug',
        'env_vars': {k: ('*' * len(v) if v and ('KEY' in k or 'SECRET' in k) else v) 
                    for k, v in os.environ.items()},
        'api_key_exists': bool(os.getenv('GOOGLE_API_KEY')),
        'api_key_length': len(os.getenv('GOOGLE_API_KEY', '')) if os.getenv('GOOGLE_API_KEY') else 0
    })