"""
Request Logging Middleware for Django
Logs all incoming requests for debugging ngrok connectivity
"""
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('konsultabot.requests')

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Logs all incoming requests with host, origin, and path
    Helps debug CORS and ngrok connectivity issues
    """
    def process_request(self, request):
        """Log request details"""
        try:
            host = request.META.get('HTTP_HOST', 'unknown')
            origin = request.META.get('HTTP_ORIGIN', 'N/A')
            path = request.path
            method = request.method
            remote_addr = request.META.get('REMOTE_ADDR', 'unknown')
            
            logger.info(
                f"Request: {method} {path} | Host: {host} | Origin: {origin} | IP: {remote_addr}",
                extra={
                    'method': method,
                    'path': path,
                    'host': host,
                    'origin': origin,
                    'remote_addr': remote_addr,
                }
            )
        except Exception as e:
            logger.error(f"Error in request logging: {str(e)}")
        
        return None
    
    def process_response(self, request, response):
        """Log response status"""
        try:
            if response.status_code >= 400:
                logger.warning(
                    f"Error response: {response.status_code} for {request.method} {request.path}",
                    extra={
                        'status_code': response.status_code,
                        'method': request.method,
                        'path': request.path,
                    }
                )
        except Exception as e:
            logger.error(f"Error in response logging: {str(e)}")
        
        return response

