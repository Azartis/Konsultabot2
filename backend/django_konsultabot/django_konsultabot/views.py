from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

@csrf_exempt
@require_http_methods(["GET"])
def health_redirect(request):
    """Health check endpoint for /health/"""
    try:
        return JsonResponse({
            'status': 'healthy',
            'message': 'Server is running',
            'timestamp': timezone.now().isoformat()
        }, status=200)
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=503)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_health(request):
    """Health check endpoint for /api/health/"""
    try:
        return Response({
            'status': 'healthy',
            'message': 'Server is running',
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)