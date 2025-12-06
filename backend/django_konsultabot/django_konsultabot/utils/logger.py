"""
Structured Logging Utilities
"""
import logging
import uuid
from django.utils import timezone
from django.conf import settings

def get_logger(name: str = 'konsultabot') -> logging.Logger:
    """
    Get a configured logger with structured formatting
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO if not settings.DEBUG else logging.DEBUG)
    
    return logger

def log_request(request, logger: logging.Logger = None):
    """
    Log HTTP request details
    """
    if logger is None:
        logger = get_logger('konsultabot.requests')
    
    # Generate request ID if not present
    if not hasattr(request, 'id'):
        request.id = str(uuid.uuid4())[:8]
    
    logger.info(
        f"Request {request.method} {request.path}",
        extra={
            'request_id': request.id,
            'method': request.method,
            'path': request.path,
            'user': str(request.user) if hasattr(request, 'user') else 'anonymous',
            'ip': request.META.get('REMOTE_ADDR', 'unknown'),
            'timestamp': timezone.now().isoformat(),
        }
    )
    
    return request.id

