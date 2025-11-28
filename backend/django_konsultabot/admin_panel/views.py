"""
Admin Panel API Views
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import (
    KnowledgeBaseItem, Intent, Ticket, TicketHistory,
    NotificationTemplate, Notification, AdminActivity, SystemSettings
)
from .serializers import (
    KnowledgeBaseItemSerializer, IntentSerializer, TicketSerializer,
    TicketHistorySerializer, NotificationTemplateSerializer, NotificationSerializer,
    AdminActivitySerializer, SystemSettingsSerializer, UserSerializer,
    ConversationSessionSerializer, QueryLogSerializer, DashboardStatsSerializer
)
from chatbot_core.models import ConversationSession, ChatMessage
from analytics.models import QueryLog, DailyStats

User = get_user_model()


class IsAdminOrITStaff(permissions.BasePermission):
    """Permission class to allow only admins and IT staff"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'it_staff']
        )


def log_admin_activity(admin, action, resource_type, resource_id=None, description='', changes=None, request=None):
    """Helper function to log admin activities"""
    AdminActivity.objects.create(
        admin=admin,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        changes=changes or {},
        ip_address=request.META.get('REMOTE_ADDR') if request else None,
        user_agent=request.META.get('HTTP_USER_AGENT', '') if request else ''
    )


class DashboardView(APIView):
    """Dashboard statistics endpoint"""
    permission_classes = [IsAdminOrITStaff]
    
    def get(self, request):
        # Basic counts
        total_users = User.objects.count()
        total_conversations = ConversationSession.objects.count()
        total_tickets = Ticket.objects.count()
        total_kb_items = KnowledgeBaseItem.objects.filter(status='published').count()
        
        # Most common intents (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        intent_counts = QueryLog.objects.filter(
            created_at__gte=thirty_days_ago,
            intent_detected__isnull=False
        ).exclude(intent_detected='').values('intent_detected').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        most_common_intents = {item['intent_detected']: item['count'] for item in intent_counts}
        
        # Usage chart data (last 7 days)
        usage_data = {}
        for i in range(6, -1, -1):
            date = (timezone.now() - timedelta(days=i)).date()
            day_queries = QueryLog.objects.filter(
                created_at__date=date
            ).count()
            usage_data[str(date)] = day_queries
        
        # Recent activities
        recent_activities = AdminActivity.objects.all()[:10]
        recent_activities_data = AdminActivitySerializer(recent_activities, many=True).data
        
        # Recent tickets
        recent_tickets = Ticket.objects.filter(status__in=['open', 'in_progress']).order_by('-created_at')[:5]
        recent_tickets_data = TicketSerializer(recent_tickets, many=True).data
        
        stats = {
            'total_users': total_users,
            'total_conversations': total_conversations,
            'total_tickets': total_tickets,
            'total_kb_items': total_kb_items,
            'most_common_intents': most_common_intents,
            'usage_chart_data': usage_data,
            'recent_activities': recent_activities_data,
            'recent_tickets': recent_tickets_data
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


class KnowledgeBaseItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Knowledge Base Items"""
    queryset = KnowledgeBaseItem.objects.all()
    serializer_class = KnowledgeBaseItemSerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['category', 'status', 'priority']
    search_fields = ['title', 'question', 'answer', 'tags']
    
    def perform_create(self, serializer):
        item = serializer.save(created_by=self.request.user)
        log_admin_activity(
            self.request.user, 'create', 'KnowledgeBaseItem',
            item.id, f"Created KB item: {item.title}", request=self.request
        )
    
    def perform_update(self, serializer):
        old_instance = self.get_object()
        item = serializer.save(updated_by=self.request.user)
        
        # Track changes
        changes = {}
        for field in ['title', 'category', 'status', 'priority']:
            old_val = getattr(old_instance, field)
            new_val = getattr(item, field)
            if old_val != new_val:
                changes[field] = {'old': old_val, 'new': new_val}
        
        log_admin_activity(
            self.request.user, 'update', 'KnowledgeBaseItem',
            item.id, f"Updated KB item: {item.title}", changes, self.request
        )
    
    def perform_destroy(self, instance):
        item_id = instance.id
        item_title = instance.title
        instance.delete()
        log_admin_activity(
            self.request.user, 'delete', 'KnowledgeBaseItem',
            item_id, f"Deleted KB item: {item_title}", request=self.request
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a KB item"""
        item = self.get_object()
        item.publish()
        log_admin_activity(
            request.user, 'publish', 'KnowledgeBaseItem',
            item.id, f"Published KB item: {item.title}", request=request
        )
        return Response({'status': 'published'})
    
    @action(detail=True, methods=['post'])
    def increment_usage(self, request, pk=None):
        """Increment usage counter"""
        item = self.get_object()
        item.increment_usage()
        return Response({'usage_count': item.usage_count})


class IntentViewSet(viewsets.ModelViewSet):
    """ViewSet for Intents"""
    queryset = Intent.objects.all()
    serializer_class = IntentSerializer
    permission_classes = [IsAdminOrITStaff]
    search_fields = ['name', 'display_name', 'description', 'keywords']
    
    def perform_create(self, serializer):
        intent = serializer.save(created_by=self.request.user)
        log_admin_activity(
            self.request.user, 'create', 'Intent',
            intent.id, f"Created intent: {intent.display_name}", request=self.request
        )
    
    def perform_update(self, serializer):
        old_instance = self.get_object()
        intent = serializer.save()
        
        changes = {}
        for field in ['name', 'display_name', 'is_active', 'priority']:
            old_val = getattr(old_instance, field)
            new_val = getattr(intent, field)
            if old_val != new_val:
                changes[field] = {'old': old_val, 'new': new_val}
        
        log_admin_activity(
            self.request.user, 'update', 'Intent',
            intent.id, f"Updated intent: {intent.display_name}", changes, self.request
        )
    
    def perform_destroy(self, instance):
        intent_id = instance.id
        intent_name = instance.display_name
        instance.delete()
        log_admin_activity(
            self.request.user, 'delete', 'Intent',
            intent_id, f"Deleted intent: {intent_name}", request=self.request
        )
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test intent matching with a sample query"""
        intent = self.get_object()
        test_query = request.data.get('query', '')
        
        # Simple keyword matching test
        matches = []
        for keyword in intent.keywords:
            if keyword.lower() in test_query.lower():
                matches.append(keyword)
        
        return Response({
            'intent': intent.display_name,
            'test_query': test_query,
            'matches': matches,
            'matched': len(matches) > 0
        })


class TicketViewSet(viewsets.ModelViewSet):
    """ViewSet for Tickets"""
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['status', 'priority', 'assigned_to']
    search_fields = ['ticket_number', 'title', 'description']
    
    def perform_create(self, serializer):
        ticket = serializer.save()
        TicketHistory.objects.create(
            ticket=ticket,
            action='Ticket created',
            description=f"Ticket #{ticket.ticket_number} was created",
            changed_by=self.request.user
        )
        log_admin_activity(
            self.request.user, 'create', 'Ticket',
            ticket.id, f"Created ticket: {ticket.ticket_number}", request=self.request
        )
    
    def perform_update(self, serializer):
        old_instance = self.get_object()
        ticket = serializer.save()
        
        changes = {}
        for field in ['status', 'priority', 'assigned_to']:
            old_val = getattr(old_instance, field)
            new_val = getattr(ticket, field)
            if old_val != new_val:
                changes[field] = {'old': str(old_val), 'new': str(new_val)}
                
                # Create history entry
                action_text = f"{field.replace('_', ' ').title()} changed"
                TicketHistory.objects.create(
                    ticket=ticket,
                    action=action_text,
                    description=f"{field} changed from {old_val} to {new_val}",
                    changed_by=self.request.user,
                    changes={field: {'old': str(old_val), 'new': str(new_val)}}
                )
        
        log_admin_activity(
            self.request.user, 'update', 'Ticket',
            ticket.id, f"Updated ticket: {ticket.ticket_number}", changes, self.request
        )
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to an admin"""
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if assigned_to_id:
            assigned_to = User.objects.get(id=assigned_to_id)
            ticket.assigned_to = assigned_to
            ticket.save()
            
            TicketHistory.objects.create(
                ticket=ticket,
                action='Ticket assigned',
                description=f"Ticket assigned to {assigned_to.get_full_name()}",
                changed_by=request.user
            )
            
            log_admin_activity(
                request.user, 'assign', 'Ticket',
                ticket.id, f"Assigned ticket {ticket.ticket_number} to {assigned_to.get_full_name()}", request=request
            )
            
            return Response({'status': 'assigned', 'assigned_to': assigned_to.get_full_name()})
        return Response({'error': 'assigned_to is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a ticket"""
        ticket = self.get_object()
        ticket.resolve()
        
        TicketHistory.objects.create(
            ticket=ticket,
            action='Ticket resolved',
            description="Ticket marked as resolved",
            changed_by=request.user
        )
        
        log_admin_activity(
            request.user, 'resolve', 'Ticket',
            ticket.id, f"Resolved ticket: {ticket.ticket_number}", request=request
        )
        
        return Response({'status': 'resolved'})
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add internal note to ticket"""
        ticket = self.get_object()
        note = request.data.get('note', '')
        
        if note:
            ticket.internal_notes += f"\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] {request.user.get_full_name()}: {note}"
            ticket.save()
            
            TicketHistory.objects.create(
                ticket=ticket,
                action='Note added',
                description=note,
                changed_by=request.user
            )
            
            return Response({'status': 'note_added'})
        return Response({'error': 'note is required'}, status=status.HTTP_400_BAD_REQUEST)


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Notification Templates"""
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminOrITStaff]
    search_fields = ['name', 'subject', 'message']
    
    def perform_create(self, serializer):
        template = serializer.save(created_by=self.request.user)
        log_admin_activity(
            self.request.user, 'create', 'NotificationTemplate',
            template.id, f"Created notification template: {template.name}", request=self.request
        )


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Notifications"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['status', 'notification_type', 'recipient']
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send a notification"""
        notification = self.get_object()
        # In a real implementation, this would send email/push/SMS
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
        
        return Response({'status': 'sent'})


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for System Settings"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['category', 'is_public']
    search_fields = ['key', 'description']
    
    def perform_update(self, serializer):
        setting = serializer.save(updated_by=self.request.user)
        log_admin_activity(
            self.request.user, 'update', 'SystemSettings',
            setting.id, f"Updated setting: {setting.key}", request=self.request
        )


class UserManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for User Management (read-only for now, can be extended)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['role', 'is_active', 'department']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user"""
        user = self.get_object()
        user.is_active = True
        user.save()
        log_admin_activity(
            request.user, 'update', 'User',
            user.id, f"Activated user: {user.username}", request=request
        )
        return Response({'status': 'activated'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user"""
        user = self.get_object()
        user.is_active = False
        user.save()
        log_admin_activity(
            request.user, 'update', 'User',
            user.id, f"Deactivated user: {user.username}", request=request
        )
        return Response({'status': 'deactivated'})
    
    @action(detail=True, methods=['get'])
    def conversations(self, request, pk=None):
        """Get user's conversation history"""
        user = self.get_object()
        conversations = ConversationSession.objects.filter(user=user).order_by('-last_activity')
        serializer = ConversationSessionSerializer(conversations, many=True)
        return Response(serializer.data)


class ConversationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing conversation logs"""
    queryset = ConversationSession.objects.all()
    serializer_class = ConversationSessionSerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['user', 'language', 'is_active']
    search_fields = ['title', 'session_id', 'user__username']
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a conversation"""
        session = self.get_object()
        messages = session.messages.all().order_by('timestamp')
        from .serializers import ConversationMessageSerializer
        serializer = ConversationMessageSerializer(messages, many=True)
        return Response(serializer.data)


class QueryLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing query logs"""
    queryset = QueryLog.objects.all()
    serializer_class = QueryLogSerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['response_source', 'language', 'intent_detected']
    search_fields = ['query', 'response_text']
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export query logs as CSV"""
        import csv
        from django.http import HttpResponse
        from datetime import datetime
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="query_logs_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Date', 'User', 'Query', 'Response Source', 'Intent', 'Language', 'Processing Time'])
        
        queryset = self.filter_queryset(self.get_queryset())
        for log in queryset[:1000]:  # Limit to 1000 rows
            writer.writerow([
                log.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                log.user.get_full_name() if log.user else 'Anonymous',
                log.query[:100],
                log.get_response_source_display(),
                log.intent_detected or '',
                log.get_language_display(),
                f"{log.processing_time:.2f}s"
            ])
        
        log_admin_activity(
            request.user, 'export', 'QueryLog',
            None, "Exported query logs to CSV", request=request
        )
        
        return response


class AdminActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing admin activities"""
    queryset = AdminActivity.objects.all()
    serializer_class = AdminActivitySerializer
    permission_classes = [IsAdminOrITStaff]
    filterset_fields = ['action', 'resource_type', 'admin']
    search_fields = ['description']

