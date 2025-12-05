"""
Role-based access control decorators for KonsultaBot
"""
from functools import wraps
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('konsultabot.auth')


def role_required(*allowed_roles):
    """
    Decorator to restrict access based on user roles
    
    Usage:
        @role_required('admin', 'it_staff')
        def my_view(request):
            # Only admin and it_staff can access this view
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                logger.warning(f"Unauthenticated access attempt to {view_func.__name__}")
                return JsonResponse({
                    'error': 'Authentication required',
                    'code': 'AUTH_REQUIRED'
                }, status=401)
            
            # Check if user has required role
            if request.user.role not in allowed_roles:
                logger.warning(
                    f"Access denied for user {request.user.username} "
                    f"with role {request.user.role} to {view_func.__name__}. "
                    f"Required roles: {allowed_roles}"
                )
                return JsonResponse({
                    'error': 'Permission denied',
                    'code': 'PERMISSION_DENIED',
                    'required_roles': list(allowed_roles),
                    'user_role': request.user.role
                }, status=403)
            
            logger.info(
                f"Access granted to user {request.user.username} "
                f"with role {request.user.role} for {view_func.__name__}"
            )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def permission_required(*permissions):
    """
    Decorator to restrict access based on specific permissions
    
    Usage:
        @permission_required('view_analytics', 'edit_knowledge_base')
        def my_view(request):
            # Only users with these permissions can access
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({
                    'error': 'Authentication required',
                    'code': 'AUTH_REQUIRED'
                }, status=401)
            
            user_permissions = request.user.get_permissions()
            
            # Check if user has all required permissions
            missing_permissions = []
            for permission in permissions:
                if permission not in user_permissions:
                    missing_permissions.append(permission)
            
            if missing_permissions:
                logger.warning(
                    f"Permission denied for user {request.user.username}. "
                    f"Missing permissions: {missing_permissions}"
                )
                return JsonResponse({
                    'error': 'Insufficient permissions',
                    'code': 'INSUFFICIENT_PERMISSIONS',
                    'required_permissions': list(permissions),
                    'missing_permissions': missing_permissions,
                    'user_permissions': user_permissions
                }, status=403)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def admin_required(view_func):
    """
    Decorator to restrict access to admin users only
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        if not request.user.is_admin:
            logger.warning(
                f"Admin access denied for user {request.user.username} "
                f"with role {request.user.role}"
            )
            return JsonResponse({
                'error': 'Admin access required',
                'code': 'ADMIN_REQUIRED'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def staff_or_admin_required(view_func):
    """
    Decorator to restrict access to IT staff and admin users only
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        if not request.user.can_access_dashboard:
            logger.warning(
                f"Staff/Admin access denied for user {request.user.username} "
                f"with role {request.user.role}"
            )
            return JsonResponse({
                'error': 'Staff or admin access required',
                'code': 'STAFF_ADMIN_REQUIRED'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


# DRF (Django Rest Framework) decorators for API views
def api_role_required(*allowed_roles):
    """
    Decorator for DRF API views to restrict access based on user roles
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({
                    'error': 'Authentication required',
                    'code': 'AUTH_REQUIRED'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if request.user.role not in allowed_roles:
                return Response({
                    'error': 'Permission denied',
                    'code': 'PERMISSION_DENIED',
                    'required_roles': list(allowed_roles),
                    'user_role': request.user.role
                }, status=status.HTTP_403_FORBIDDEN)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def api_permission_required(*permissions):
    """
    Decorator for DRF API views to restrict access based on permissions
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({
                    'error': 'Authentication required',
                    'code': 'AUTH_REQUIRED'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            user_permissions = request.user.get_permissions()
            missing_permissions = [p for p in permissions if p not in user_permissions]
            
            if missing_permissions:
                return Response({
                    'error': 'Insufficient permissions',
                    'code': 'INSUFFICIENT_PERMISSIONS',
                    'required_permissions': list(permissions),
                    'missing_permissions': missing_permissions
                }, status=status.HTTP_403_FORBIDDEN)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
