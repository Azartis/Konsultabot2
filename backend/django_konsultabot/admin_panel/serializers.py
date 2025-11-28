"""
Serializers for Admin Panel API
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    KnowledgeBaseItem, Intent, Ticket, TicketHistory,
    NotificationTemplate, Notification, AdminActivity, SystemSettings
)
from chatbot_core.models import ConversationSession, ChatMessage
from analytics.models import QueryLog, DailyStats

User = get_user_model()


class KnowledgeBaseItemSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = KnowledgeBaseItem
        fields = '__all__'
        read_only_fields = ['usage_count', 'helpful_count', 'not_helpful_count', 'created_at', 'updated_at', 'published_at']


class IntentSerializer(serializers.ModelSerializer):
    mapped_kb_items_data = KnowledgeBaseItemSerializer(source='mapped_kb_items', many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Intent
        fields = '__all__'


class TicketHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = TicketHistory
        fields = '__all__'
        read_only_fields = ['created_at']


class TicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    history = TicketHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['ticket_number', 'created_at', 'updated_at', 'resolved_at', 'closed_at']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    recipient_email = serializers.CharField(source='recipient.email', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at', 'sent_at']


class AdminActivitySerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)
    
    class Meta:
        model = AdminActivity
        fields = '__all__'
        read_only_fields = ['created_at']


class SystemSettingsSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemSettings
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_typed_value(self, obj):
        return obj.get_value()


class UserSerializer(serializers.ModelSerializer):
    conversation_count = serializers.SerializerMethodField()
    ticket_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'middle_name',
            'role', 'department', 'student_id', 'phone_number', 'is_active',
            'date_joined', 'last_login', 'conversation_count', 'ticket_count'
        ]
        read_only_fields = ['date_joined', 'last_login']
    
    def get_conversation_count(self, obj):
        return ConversationSession.objects.filter(user=obj).count()
    
    def get_ticket_count(self, obj):
        return Ticket.objects.filter(user=obj).count()


class ConversationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'message', 'response', 'intent_detected', 
                 'response_source', 'confidence_score', 'timestamp']


class ConversationSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    messages = ConversationMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConversationSession
        fields = '__all__'


class QueryLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = QueryLog
        fields = '__all__'


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_users = serializers.IntegerField()
    total_conversations = serializers.IntegerField()
    total_tickets = serializers.IntegerField()
    total_kb_items = serializers.IntegerField()
    most_common_intents = serializers.DictField()
    usage_chart_data = serializers.DictField()
    recent_activities = AdminActivitySerializer(many=True)
    recent_tickets = TicketSerializer(many=True)

