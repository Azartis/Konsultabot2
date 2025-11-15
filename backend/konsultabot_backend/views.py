"""
Authentication and user management views for KonsultaBot
"""
from django.shortcuts import render
from django.contrib.auth import login, logout
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination

from user_account.models import User
from .serializers import (
    UserSerializer, LoginSerializer, RegisterSerializer,
    ChangePasswordSerializer, UserManagementSerializer, UserStatsSerializer
)
from .decorators import role_required, admin_required
import logging

logger = logging.getLogger('konsultabot.auth')


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that includes user data and permissions
    """
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Update last login IP
        user.last_login_ip = self.get_client_ip(request)
        user.save(update_fields=['last_login_ip'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Log successful login
        logger.info(f"User {user.username} logged in successfully")
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class LoginView(APIView):
    """
    User login view
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        logger.info(f"Login attempt received: {request.data}")
        
        # Handle both JSON and form data
        data = request.data
        if not data:
            return Response({
                'error': 'Username and password are required',
                'detail': 'Please provide username and password in the request body'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = LoginSerializer(data=data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            logger.info(f"Login validation successful for user: {user.username}")
        except Exception as e:
            logger.error(f"Login validation failed: {str(e)}")
            # Return user-friendly error message
            error_message = str(e)
            if hasattr(e, 'detail'):
                if isinstance(e.detail, dict):
                    # Extract first error message
                    for field, errors in e.detail.items():
                        if isinstance(errors, list) and len(errors) > 0:
                            error_message = errors[0]
                            break
                        elif isinstance(errors, str):
                            error_message = errors
                            break
                elif isinstance(e.detail, list) and len(e.detail) > 0:
                    error_message = e.detail[0]
                elif isinstance(e.detail, str):
                    error_message = e.detail
            
            return Response({
                'error': error_message,
                'detail': error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update last login IP
        try:
            user.last_login_ip = self.get_client_ip(request)
            user.save(update_fields=['last_login_ip'])
        except Exception as e:
            logger.warning(f"Failed to update last login IP: {str(e)}")
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Log successful login
        logger.info(f"User {user.username} logged in successfully")
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RegisterView(APIView):
    """
    User registration view
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        # Log successful registration
        logger.info(f"New user registered: {user.username}")
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)


class ProfileView(APIView):
    """
    User profile view
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update user profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        logger.info(f"User {request.user.username} updated profile")
        
        return Response({
            'user': serializer.data,
            'message': 'Profile updated successfully'
        })


class ChangePasswordView(APIView):
    """
    Change user password view
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        logger.info(f"User {request.user.username} changed password")
        
        return Response({
            'message': 'Password changed successfully'
        })


class LogoutView(APIView):
    """
    User logout view
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            logger.info(f"User {request.user.username} logged out")
            
            return Response({
                'message': 'Logout successful'
            })
        except Exception as e:
            logger.error(f"Logout error for user {request.user.username}: {e}")
            return Response({
                'message': 'Logout successful'
            })


class UserManagementView(APIView):
    """
    User management view for admins
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of users (admin only)"""
        if not request.user.is_admin:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all().order_by('-date_joined')
        
        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        paginated_users = paginator.paginate_queryset(users, request)
        
        serializer = UserManagementSerializer(paginated_users, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def put(self, request, user_id):
        """Update user (admin only)"""
        if not request.user.is_admin:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserManagementSerializer(
            user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        logger.info(f"Admin {request.user.username} updated user {user.username}")
        
        return Response({
            'user': serializer.data,
            'message': 'User updated successfully'
        })


class UserStatsView(APIView):
    """
    User statistics view for admins
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user statistics (admin/staff only)"""
        if not request.user.can_view_analytics:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Calculate statistics
        total_users = User.objects.count()
        admin_count = User.objects.filter(role='admin').count()
        it_staff_count = User.objects.filter(role='it_staff').count()
        student_count = User.objects.filter(role='student').count()
        active_users = User.objects.filter(is_active=True).count()
        
        # New users this month
        this_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = User.objects.filter(date_joined__gte=this_month).count()
        
        stats = {
            'total_users': total_users,
            'admin_count': admin_count,
            'it_staff_count': it_staff_count,
            'student_count': student_count,
            'active_users': active_users,
            'new_users_this_month': new_users_this_month
        }
        
        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_permissions(request):
    """
    Check user permissions
    """
    return Response({
        'user': UserSerializer(request.user).data,
        'permissions': request.user.get_permissions(),
        'can_access_dashboard': request.user.can_access_dashboard,
        'can_edit_knowledge_base': request.user.can_edit_knowledge_base,
        'can_view_analytics': request.user.can_view_analytics
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def check_username_availability(request):
    """
    Check if username is available
    """
    username = request.data.get('username', '').strip()
    
    if not username:
        return Response({
            'error': 'Username is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    is_available = not User.objects.filter(username=username).exists()
    
    return Response({
        'username': username,
        'available': is_available
    })
