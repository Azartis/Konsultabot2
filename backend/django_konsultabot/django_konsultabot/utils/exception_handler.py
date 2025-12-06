"""
Custom Exception Handler for Django REST Framework
Provides structured error responses and logging
"""
import logging
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logger = logging.getLogger('konsultabot.exceptions')

def custom_exception_handler(exc, context):
    """
    Custom exception handler that:
    1. Logs full stack traces internally
    2. Returns generic error messages to clients (in production)
    3. Includes request ID for tracking
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Get request ID if available
    request = context.get('request')
    request_id = getattr(request, 'id', None) if request else None
    
    # Log the full exception with stack trace
    logger.error(
        f"Exception occurred (Request ID: {request_id})",
        exc_info=True,
        extra={
            'request_id': request_id,
            'view': context.get('view'),
            'request_method': request.method if request else None,
            'request_path': request.path if request else None,
        }
    )
    
    # If response is None, it's an unhandled exception
    if response is None:
        # In production, return generic error
        if not settings.DEBUG:
            return Response(
                {
                    'error': 'An internal server error occurred',
                    'request_id': str(request_id) if request_id else None,
                    'status': 'error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        else:
            # In development, include full traceback
            return Response(
                {
                    'error': str(exc),
                    'traceback': traceback.format_exc(),
                    'request_id': str(request_id) if request_id else None,
                    'status': 'error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Customize the response data
    custom_response_data = {
        'status': 'error',
        'error': response.data.get('detail', 'An error occurred'),
        'request_id': str(request_id) if request_id else None,
    }
    
    # In development, include more details
    if settings.DEBUG:
        custom_response_data['details'] = response.data
        if hasattr(exc, '__cause__') and exc.__cause__:
            custom_response_data['cause'] = str(exc.__cause__)
    
    response.data = custom_response_data
    
    return response

