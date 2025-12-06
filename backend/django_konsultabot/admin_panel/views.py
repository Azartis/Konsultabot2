"""
Admin Panel REST API Views
Comprehensive views for all admin panel features
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q, Count
from django.utils import timezone
from django.http import HttpResponse
import csv
import json

from .models import (
    Intent, Keyword, KnowledgeBaseItem,
    NotificationTemplate, Notification, ChatbotSettings, AdminActivity,
    AdminRole, AdminUserRole
)
from .serializers import (
    UserListSerializer, UserDetailSerializer, IntentSerializer, IntentCreateUpdateSerializer,
    KeywordSerializer, KnowledgeBaseItemSerializer, KnowledgeBaseItemCreateUpdateSerializer,
    NotificationTemplateSerializer, NotificationSerializer, ChatbotSettingsSerializer,
    AdminActivitySerializer, AdminRoleSerializer, DashboardStatsSerializer
)
from .permissions import IsAdminOrStaff, IsAdmin, IsAdminOrITStaff
from .utils import log_admin_activity, get_dashboard_stats
from user_account.models import User
from chatbot_core.models import ConversationSession, ChatMessage
from analytics.models import QueryLog


# ==================== Dashboard Views ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    """Get dashboard statistics"""
    days = int(request.query_params.get('days', 30))
    stats = get_dashboard_stats(days)
    
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


# ==================== User Management Views ====================

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user management"""
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserListSerializer
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-date_joined')
    
    @action(detail=True, methods=['get'])
    def conversations(self, request, pk=None):
        """Get user's conversation history"""
        user = self.get_object()
        conversations = ConversationSession.objects.filter(user=user).order_by('-last_activity')
        
        data = []
        for conv in conversations:
            data.append({
                'id': conv.id,
                'session_id': conv.session_id,
                'title': conv.title,
                'message_count': conv.message_count,
                'created_at': conv.created_at,
                'last_activity': conv.last_activity,
            })
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activate/deactivate user"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        log_admin_activity(
            request.user, 'update', 'User',
            f"{'Activated' if user.is_active else 'Deactivated'} user {user.username}",
            user.id, request=request
        )
        
        return Response({'is_active': user.is_active})


# ==================== Intent & Keyword Views ====================

class IntentViewSet(viewsets.ModelViewSet):
    """ViewSet for intent management"""
    permission_classes = [AllowAny]
    queryset = Intent.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return IntentCreateUpdateSerializer
        return IntentSerializer
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        log_admin_activity(
            self.request.user, 'create', 'Intent',
            f"Created intent: {instance.name}",
            instance.id, request=self.request
        )
    
    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_activity(
            self.request.user, 'update', 'Intent',
            f"Updated intent: {instance.name}",
            instance.id, request=self.request
        )
    
    def perform_destroy(self, instance):
        log_admin_activity(
            self.request.user, 'delete', 'Intent',
            f"Deleted intent: {instance.name}",
            instance.id, request=self.request
        )
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def add_keyword(self, request, pk=None):
        """Add keyword to intent"""
        intent = self.get_object()
        keyword_data = request.data
        
        keyword = Keyword.objects.create(
            intent=intent,
            keyword=keyword_data.get('keyword'),
            weight=keyword_data.get('weight', 1.0),
            exact_match=keyword_data.get('exact_match', False),
            case_sensitive=keyword_data.get('case_sensitive', False)
        )
        
        serializer = KeywordSerializer(keyword)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class KeywordViewSet(viewsets.ModelViewSet):
    """ViewSet for keyword management"""
    permission_classes = [AllowAny]
    queryset = Keyword.objects.all()
    serializer_class = KeywordSerializer
    
    def get_queryset(self):
        queryset = Keyword.objects.all()
        intent_id = self.request.query_params.get('intent', None)
        if intent_id:
            queryset = queryset.filter(intent_id=intent_id)
        return queryset


# ==================== Knowledge Base Views ====================

class KnowledgeBaseViewSet(viewsets.ModelViewSet):
    """ViewSet for knowledge base management"""
    permission_classes = [AllowAny]
    queryset = KnowledgeBaseItem.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return KnowledgeBaseItemCreateUpdateSerializer
        return KnowledgeBaseItemSerializer
    
    def get_queryset(self):
        queryset = KnowledgeBaseItem.objects.all()
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(question__icontains=search) |
                Q(answer__icontains=search) |
                Q(tags__icontains=search) |
                Q(keywords__icontains=search)
            )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by language
        language = self.request.query_params.get('language', None)
        if language:
            queryset = queryset.filter(language=language)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        log_admin_activity(
            self.request.user, 'create', 'KnowledgeBaseItem',
            f"Created KB item: {instance.title}",
            instance.id, request=self.request
        )
    
    def perform_update(self, serializer):
        instance = serializer.save(last_reviewed_by=self.request.user, last_reviewed_at=timezone.now())
        log_admin_activity(
            self.request.user, 'update', 'KnowledgeBaseItem',
            f"Updated KB item: {instance.title}",
            instance.id, request=self.request
        )
    
    def perform_destroy(self, instance):
        log_admin_activity(
            self.request.user, 'delete', 'KnowledgeBaseItem',
            f"Deleted KB item: {instance.title}",
            instance.id, request=self.request
        )
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def sync_offline_kb(self, request):
        """Sync offline Knowledge Base (JSON file) with admin panel"""
        try:
            from chatbot_core.knowledge_base import get_all_entries
            kb_entries = get_all_entries()
            
            # Return offline KB entries
            return Response({
                'count': len(kb_entries),
                'entries': kb_entries
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def offline_kb(self, request):
        """Get offline Knowledge Base entries from JSON file"""
        try:
            from chatbot_core.knowledge_base import get_all_entries
            kb_entries = get_all_entries()
            
            # Format for admin panel
            formatted_entries = []
            for entry in kb_entries:
                formatted_entries.append({
                    'id': entry.get('id'),
                    'title': entry.get('title'),
                    'question_pattern': entry.get('question_pattern'),
                    'answer': entry.get('answer'),
                    'tags': entry.get('tags', []),
                    'source': entry.get('source', 'kb'),
                    'created_at': entry.get('created_at'),
                    'updated_at': entry.get('updated_at'),
                    'view_count': entry.get('view_count', 0),
                })
            
            return Response({
                'count': len(formatted_entries),
                'results': formatted_entries
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== Notification Views ====================

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for notification template management"""
    permission_classes = [AllowAny]
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        log_admin_activity(
            self.request.user, 'create', 'NotificationTemplate',
            f"Created notification template: {instance.name}",
            instance.id, request=self.request
        )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for notification management"""
    permission_classes = [AllowAny]
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    
    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        """Send notifications to multiple users"""
        template_id = request.data.get('template_id')
        user_ids = request.data.get('user_ids', [])
        
        if not template_id:
            return Response({'error': 'template_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        template = NotificationTemplate.objects.get(id=template_id)
        notifications = []
        
        for user_id in user_ids:
            user = User.objects.get(id=user_id)
            notification = Notification.objects.create(
                template=template,
                user=user,
                subject=template.subject,
                message=template.message,
                html_content=template.html_content
            )
            notifications.append(notification)
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ==================== Settings Views ====================

class ChatbotSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for chatbot settings management"""
    permission_classes = [AllowAny]
    queryset = ChatbotSettings.objects.all()
    serializer_class = ChatbotSettingsSerializer
    
    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        log_admin_activity(
            self.request.user, 'settings_change', 'ChatbotSettings',
            f"Updated setting: {instance.setting_key}",
            instance.id, request=self.request
        )


# ==================== Activity Log Views ====================

class AdminActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for admin activity logs"""
    permission_classes = [AllowAny]
    queryset = AdminActivity.objects.all()
    serializer_class = AdminActivitySerializer
    
    def get_queryset(self):
        queryset = AdminActivity.objects.all()
        
        # Filter by admin
        admin_id = self.request.query_params.get('admin', None)
        if admin_id:
            queryset = queryset.filter(admin_id=admin_id)
        
        # Filter by action type
        action_type = self.request.query_params.get('action_type', None)
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filter by resource type
        resource_type = self.request.query_params.get('resource_type', None)
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        return queryset.order_by('-created_at')


# ==================== Conversation Logs Views ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def conversation_logs(request):
    """Get conversation logs with filtering"""
    queryset = ConversationSession.objects.all()
    
    # Filter by user
    user_id = request.query_params.get('user', None)
    if user_id:
        queryset = queryset.filter(user_id=user_id)
    
    # Filter by date range
    date_from = request.query_params.get('date_from', None)
    date_to = request.query_params.get('date_to', None)
    if date_from:
        queryset = queryset.filter(created_at__gte=date_from)
    if date_to:
        queryset = queryset.filter(created_at__lte=date_to)
    
    # Pagination
    page_size = int(request.query_params.get('page_size', 20))
    page = int(request.query_params.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    
    conversations = queryset[start:end]
    
    data = []
    for conv in conversations:
        # Try to get user info, if not available, try to get from first message
        user_info = {
            'id': None,
            'username': 'Anonymous',
            'email': ''
        }
        
        if conv.user:
            user_info = {
                'id': conv.user.id,
                'username': conv.user.username or conv.user.email or 'Anonymous',
                'email': conv.user.email or ''
            }
        else:
            # Try to get user from first message in the conversation
            first_message = ChatMessage.objects.filter(session=conv).order_by('timestamp').first()
            if first_message and hasattr(first_message, 'user') and first_message.user:
                user_info = {
                    'id': first_message.user.id,
                    'username': first_message.user.username or first_message.user.email or 'Anonymous',
                    'email': first_message.user.email or ''
                }
        
        data.append({
            'id': conv.id,
            'session_id': conv.session_id,
            'user': user_info,
            'title': conv.title or f'Conversation {conv.session_id[:8]}',
            'message_count': conv.message_count,
            'created_at': conv.created_at,
            'last_activity': conv.last_activity,
        })
    
    return Response({
        'count': queryset.count(),
        'results': data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def conversation_detail(request, session_id):
    """Get detailed conversation with messages"""
    try:
        session = ConversationSession.objects.get(session_id=session_id)
        messages = ChatMessage.objects.filter(session=session).order_by('timestamp')
        
        data = {
            'session': {
                'id': session.id,
                'session_id': session.session_id,
                'user': {
                    'id': session.user.id if session.user else None,
                    'username': session.user.username if session.user else 'Anonymous',
                },
                'title': session.title,
                'created_at': session.created_at,
                'last_activity': session.last_activity,
            },
            'messages': []
        }
        
        for msg in messages:
            data['messages'].append({
                'id': msg.id,
                'sender': msg.sender,
                'message': msg.message,
                'response_source': msg.response_source,
                'intent_detected': msg.intent_detected,
                'confidence_score': msg.confidence_score,
                'timestamp': msg.timestamp,
            })
        
        return Response(data)
    except ConversationSession.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def export_conversations_csv(request):
    """Export conversations to CSV"""
    queryset = ConversationSession.objects.all()
    
    # Apply filters
    user_id = request.query_params.get('user', None)
    if user_id:
        queryset = queryset.filter(user_id=user_id)
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="conversations.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Session ID', 'User', 'Title', 'Message Count', 'Created At', 'Last Activity'])
    
    for conv in queryset:
        writer.writerow([
            conv.session_id,
            conv.user.username if conv.user else 'Anonymous',
            conv.title,
            conv.message_count,
            conv.created_at,
            conv.last_activity
        ])
    
    return response
