"""
Admin Panel URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    dashboard_stats,
    UserViewSet, IntentViewSet, KeywordViewSet, KnowledgeBaseViewSet,
    NotificationTemplateViewSet, NotificationViewSet,
    ChatbotSettingsViewSet, AdminActivityViewSet,
    conversation_logs, conversation_detail, export_conversations_csv
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'intents', IntentViewSet, basename='intent')
router.register(r'keywords', KeywordViewSet, basename='keyword')
router.register(r'knowledge-base', KnowledgeBaseViewSet, basename='knowledgebase')
router.register(r'notification-templates', NotificationTemplateViewSet, basename='notification-template')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'settings', ChatbotSettingsViewSet, basename='settings')
router.register(r'activities', AdminActivityViewSet, basename='activity')

urlpatterns = [
    # Dashboard
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    
    # Conversation logs
    path('conversations/', conversation_logs, name='conversation-logs'),
    path('conversations/<str:session_id>/', conversation_detail, name='conversation-detail'),
    path('conversations/export/csv/', export_conversations_csv, name='export-conversations-csv'),
    
    # API routes
    path('api/', include(router.urls)),
]

