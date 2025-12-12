"""
Django Admin registration for Admin Panel models
"""
from django.contrib import admin
from .models import (
    Intent, Keyword, KnowledgeBaseItem, Ticket, TicketNote, TicketHistory,
    NotificationTemplate, Notification, ChatbotSettings, AdminActivity,
    AdminRole, AdminUserRole
)


@admin.register(Intent)
class IntentAdmin(admin.ModelAdmin):
    list_display = ['name', 'intent_type', 'priority', 'is_active', 'usage_count', 'created_at']
    list_filter = ['intent_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-priority', 'name']


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ['keyword', 'intent', 'weight', 'is_active', 'exact_match']
    list_filter = ['intent', 'is_active', 'exact_match']
    search_fields = ['keyword', 'intent__name']


@admin.register(KnowledgeBaseItem)
class KnowledgeBaseItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'language', 'is_active', 'is_featured', 'view_count', 'created_at']
    list_filter = ['category', 'language', 'is_active', 'is_featured', 'created_at']
    search_fields = ['title', 'question', 'answer', 'tags', 'keywords']
    filter_horizontal = ['related_items']
    ordering = ['-priority', '-is_featured', '-created_at']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_id', 'title', 'user', 'status', 'priority', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'assigned_to', 'created_at']
    search_fields = ['ticket_id', 'title', 'description', 'user__username', 'user__email']
    readonly_fields = ['ticket_id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(TicketNote)
class TicketNoteAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'author', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['ticket__ticket_id', 'author__username', 'note']


@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'action', 'changed_by', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['ticket__ticket_id', 'action', 'notes']
    readonly_fields = ['created_at']


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'notification_type', 'target_audience', 'is_active', 'created_at']
    list_filter = ['notification_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject', 'message']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['subject', 'user', 'is_read', 'delivery_status', 'sent_at']
    list_filter = ['is_read', 'delivery_status', 'delivery_method', 'sent_at']
    search_fields = ['subject', 'message', 'user__username', 'user__email']
    readonly_fields = ['sent_at', 'created_at']


@admin.register(ChatbotSettings)
class ChatbotSettingsAdmin(admin.ModelAdmin):
    list_display = ['setting_key', 'setting_value', 'category', 'is_active', 'updated_at']
    list_filter = ['category', 'is_active', 'setting_type']
    search_fields = ['setting_key', 'description']
    readonly_fields = ['updated_at']


@admin.register(AdminActivity)
class AdminActivityAdmin(admin.ModelAdmin):
    list_display = ['admin', 'action_type', 'resource_type', 'created_at']
    list_filter = ['action_type', 'resource_type', 'created_at']
    search_fields = ['admin__username', 'description', 'resource_type']
    readonly_fields = ['created_at']


@admin.register(AdminRole)
class AdminRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']


@admin.register(AdminUserRole)
class AdminUserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'assigned_by', 'assigned_at']
    list_filter = ['role', 'assigned_at']
    search_fields = ['user__username', 'role__name']
