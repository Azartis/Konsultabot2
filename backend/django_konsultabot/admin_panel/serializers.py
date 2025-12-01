"""
Serializers for Admin Panel REST API
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Intent, Keyword, KnowledgeBaseItem,
    NotificationTemplate, Notification, ChatbotSettings, AdminActivity,
    AdminRole, AdminUserRole
)
from chatbot_core.models import ConversationSession, ChatMessage
from analytics.models import QueryLog
from user_account.models import User

User = get_user_model()


# User Serializers
class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list view"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    conversation_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'role_display', 'department', 'student_id', 'is_active', 
                  'date_joined', 'last_login', 'conversation_count']
    
    def get_conversation_count(self, obj):
        return ConversationSession.objects.filter(user=obj).count()


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for user detail view"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    conversation_count = serializers.SerializerMethodField()
    total_messages = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'role_display', 'department', 'student_id', 'phone_number',
                  'profile_picture', 'bio', 'is_active', 'is_staff', 'is_superuser',
                  'date_joined', 'last_login', 'conversation_count', 'total_messages']
    
    def get_conversation_count(self, obj):
        return ConversationSession.objects.filter(user=obj).count()
    
    def get_total_messages(self, obj):
        return ChatMessage.objects.filter(session__user=obj).count()


# Intent & Keyword Serializers
class KeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Keyword
        fields = ['id', 'keyword', 'weight', 'is_active', 'exact_match', 
                  'case_sensitive', 'created_at', 'updated_at']


class IntentSerializer(serializers.ModelSerializer):
    keywords = KeywordSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Intent
        fields = ['id', 'name', 'intent_type', 'description', 'priority', 
                  'is_active', 'default_response', 'requires_clarification',
                  'clarification_prompt', 'usage_count', 'success_rate',
                  'keywords', 'created_by_username', 'created_at', 'updated_at']


class IntentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intent
        fields = ['name', 'intent_type', 'description', 'priority', 'is_active',
                  'default_response', 'requires_clarification', 'clarification_prompt']


# Knowledge Base Serializers
class KnowledgeBaseItemSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    last_reviewed_by_username = serializers.CharField(source='last_reviewed_by.username', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    
    class Meta:
        model = KnowledgeBaseItem
        fields = ['id', 'title', 'category', 'category_display', 'language', 
                  'language_display', 'question', 'answer', 'content', 'tags',
                  'keywords', 'priority', 'is_active', 'is_featured', 'view_count',
                  'helpful_count', 'not_helpful_count', 'related_items',
                  'created_by_username', 'last_reviewed_by_username',
                  'created_at', 'updated_at', 'last_reviewed_at']


class KnowledgeBaseItemCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseItem
        fields = ['title', 'category', 'language', 'question', 'answer', 'content',
                  'tags', 'keywords', 'priority', 'is_active', 'is_featured', 'related_items']


# Notification Serializers
class NotificationTemplateSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'name', 'notification_type', 'notification_type_display',
                  'subject', 'message', 'html_content', 'target_audience', 'is_active',
                  'created_by_username', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'template', 'user_username', 'user_email', 'subject',
                  'message', 'html_content', 'is_read', 'read_at', 'sent_at',
                  'delivery_method', 'delivery_status', 'created_at']


# Settings Serializers
class ChatbotSettingsSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = ChatbotSettings
        fields = ['id', 'setting_key', 'setting_value', 'setting_type', 'description',
                  'category', 'is_active', 'updated_by_username', 'updated_at']


# Activity Serializers
class AdminActivitySerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = AdminActivity
        fields = ['id', 'admin_username', 'action_type', 'action_type_display',
                  'resource_type', 'resource_id', 'description', 'metadata',
                  'ip_address', 'user_agent', 'created_at']


# Role Serializers
class AdminRoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminRole
        fields = ['id', 'name', 'description', 'permissions', 'is_active',
                  'user_count', 'created_at', 'updated_at']
    
    def get_user_count(self, obj):
        return obj.users.count()


# Dashboard Serializers
class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_users = serializers.IntegerField()
    total_conversations = serializers.IntegerField()
    total_queries = serializers.IntegerField()
    total_kb_items = serializers.IntegerField()
    kb_views = serializers.IntegerField()
    most_common_intents = serializers.DictField()
    usage_chart_data = serializers.DictField()
    kb_usage_data = serializers.DictField(required=False)
    conversation_growth_rate = serializers.FloatField(required=False)
    query_growth_rate = serializers.FloatField(required=False)
    recent_activities = serializers.ListField(required=False)

