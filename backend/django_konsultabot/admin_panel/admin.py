from django.contrib import admin
from .models import (
    KnowledgeBaseItem, Intent, Ticket, TicketHistory,
    NotificationTemplate, Notification, AdminActivity, SystemSettings
)


@admin.register(KnowledgeBaseItem)
class KnowledgeBaseItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'priority', 'usage_count', 'created_at']
    list_filter = ['category', 'status', 'priority', 'created_at']
    search_fields = ['title', 'question', 'answer', 'tags']
    readonly_fields = ['usage_count', 'helpful_count', 'not_helpful_count', 'created_at', 'updated_at', 'published_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'category', 'question', 'answer', 'tags')
        }),
        ('Content', {
            'fields': ('content', 'steps')
        }),
        ('Status', {
            'fields': ('status', 'priority')
        }),
        ('Statistics', {
            'fields': ('usage_count', 'helpful_count', 'not_helpful_count')
        }),
        ('Metadata', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at', 'published_at')
        }),
    )


@admin.register(Intent)
class IntentAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'priority', 'is_active', 'usage_count']
    list_filter = ['is_active', 'priority', 'created_at']
    search_fields = ['name', 'display_name', 'description', 'keywords']
    filter_horizontal = ['mapped_kb_items']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'title', 'user', 'status', 'priority', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['ticket_number', 'title', 'description', 'user__username']
    readonly_fields = ['ticket_number', 'created_at', 'updated_at', 'resolved_at', 'closed_at']
    date_hierarchy = 'created_at'


@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'action', 'changed_by', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['created_at']


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'is_active', 'created_at']
    list_filter = ['template_type', 'is_active']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['subject', 'recipient', 'status', 'notification_type', 'created_at']
    list_filter = ['status', 'notification_type', 'created_at']
    readonly_fields = ['created_at', 'sent_at']


@admin.register(AdminActivity)
class AdminActivityAdmin(admin.ModelAdmin):
    list_display = ['admin', 'action', 'resource_type', 'created_at']
    list_filter = ['action', 'resource_type', 'created_at']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'category', 'value_type', 'is_public', 'updated_at']
    list_filter = ['category', 'value_type', 'is_public']
    search_fields = ['key', 'description']

