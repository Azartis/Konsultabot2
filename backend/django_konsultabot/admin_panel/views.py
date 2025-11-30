"""
Admin Panel REST API Views
Comprehensive views for all admin panel features
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from django.http import HttpResponse
import csv
import json

from .models import (
    Intent, Keyword, KnowledgeBaseItem, Ticket, TicketNote, TicketHistory,
    NotificationTemplate, Notification, ChatbotSettings, AdminActivity,
    AdminRole, AdminUserRole
)
from .serializers import (
    UserListSerializer, UserDetailSerializer, IntentSerializer, IntentCreateUpdateSerializer,
    KeywordSerializer, KnowledgeBaseItemSerializer, KnowledgeBaseItemCreateUpdateSerializer,
    TicketSerializer, TicketCreateUpdateSerializer, TicketNoteSerializer, TicketHistorySerializer,
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
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def dashboard_stats(request):
    """Get dashboard statistics"""
    days = int(request.query_params.get('days', 30))
    stats = get_dashboard_stats(days)
    
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


# ==================== User Management Views ====================

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user management"""
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
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
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
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
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
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
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
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


# ==================== Ticket Views ====================

class TicketViewSet(viewsets.ModelViewSet):
    """ViewSet for ticket management"""
    permission_classes = [IsAuthenticated, IsAdminOrITStaff]
    queryset = Ticket.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TicketCreateUpdateSerializer
        return TicketSerializer
    
    def get_queryset(self):
        queryset = Ticket.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by assigned_to
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        # Filter by user
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        instance = serializer.save()
        TicketHistory.objects.create(
            ticket=instance,
            changed_by=self.request.user,
            action='created',
            notes=f"Ticket created by {self.request.user.username}"
        )
        log_admin_activity(
            self.request.user, 'create', 'Ticket',
            f"Created ticket: {instance.ticket_id}",
            instance.id, request=self.request
        )
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to admin"""
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if assigned_to_id:
            assigned_to = User.objects.get(id=assigned_to_id)
            ticket.assigned_to = assigned_to
            ticket.assigned_at = timezone.now()
            ticket.save()
            
            TicketHistory.objects.create(
                ticket=ticket,
                changed_by=request.user,
                action='assigned',
                new_value=assigned_to.username,
                notes=f"Ticket assigned to {assigned_to.username}"
            )
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add note to ticket"""
        ticket = self.get_object()
        note = TicketNote.objects.create(
            ticket=ticket,
            author=request.user,
            note=request.data.get('note', ''),
            is_internal=request.data.get('is_internal', True)
        )
        
        serializer = TicketNoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve ticket"""
        ticket = self.get_object()
        ticket.status = 'resolved'
        ticket.resolution = request.data.get('resolution', '')
        ticket.resolved_at = timezone.now()
        ticket.resolved_by = request.user
        ticket.save()
        
        TicketHistory.objects.create(
            ticket=ticket,
            changed_by=request.user,
            action='resolved',
            old_value='open',
            new_value='resolved',
            notes=request.data.get('notes', '')
        )
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export tickets to CSV"""
        tickets = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="tickets.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Ticket ID', 'Title', 'User', 'Status', 'Priority', 'Assigned To', 'Created At'])
        
        for ticket in tickets:
            writer.writerow([
                ticket.ticket_id,
                ticket.title,
                ticket.user.username,
                ticket.status,
                ticket.priority,
                ticket.assigned_to.username if ticket.assigned_to else '',
                ticket.created_at
            ])
        
        return response


# ==================== Notification Views ====================

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for notification template management"""
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
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
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
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
    permission_classes = [IsAuthenticated, IsAdmin]
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
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
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
@permission_classes([IsAuthenticated, IsAdminOrStaff])
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
        data.append({
            'id': conv.id,
            'session_id': conv.session_id,
            'user': {
                'id': conv.user.id if conv.user else None,
                'username': conv.user.username if conv.user else 'Anonymous',
                'email': conv.user.email if conv.user else ''
            },
            'title': conv.title,
            'message_count': conv.message_count,
            'created_at': conv.created_at,
            'last_activity': conv.last_activity,
        })
    
    return Response({
        'count': queryset.count(),
        'results': data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
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
@permission_classes([IsAuthenticated, IsAdminOrStaff])
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
