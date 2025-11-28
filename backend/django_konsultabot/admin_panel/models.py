"""
Admin Panel Models for KonsultaBot
Manages knowledge base, intents, tickets, notifications, and system settings
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class KnowledgeBaseItem(models.Model):
    """Knowledge Base entries for FAQs, troubleshooting steps, and device guides"""
    
    CATEGORY_CHOICES = [
        ('faq', 'FAQ'),
        ('troubleshooting', 'Troubleshooting Steps'),
        ('device_guide', 'Device Guide'),
        ('general', 'General Information'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    question = models.TextField(help_text="User question or issue description")
    answer = models.TextField(help_text="Detailed answer or solution")
    tags = models.JSONField(default=list, blank=True, help_text="List of tags for categorization")
    
    # Rich content
    content = models.TextField(blank=True, help_text="Markdown or rich text content")
    steps = models.JSONField(default=list, blank=True, help_text="Step-by-step instructions")
    
    # Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    usage_count = models.IntegerField(default=0, help_text="Number of times this KB item was used")
    helpful_count = models.IntegerField(default=0)
    not_helpful_count = models.IntegerField(default=0)
    
    # Relations
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='kb_items_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='kb_items_updated')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-priority', '-usage_count', 'title']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['status', 'priority']),
        ]
        verbose_name = 'Knowledge Base Item'
        verbose_name_plural = 'Knowledge Base Items'
    
    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"
    
    def publish(self):
        """Mark as published"""
        self.status = 'published'
        if not self.published_at:
            self.published_at = timezone.now()
        self.save()
    
    def increment_usage(self):
        """Increment usage counter"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class Intent(models.Model):
    """Intent definitions for chatbot intent classification"""
    
    name = models.CharField(max_length=100, unique=True, help_text="Intent name (e.g., wifi_issue, printer_problem)")
    display_name = models.CharField(max_length=200, help_text="Human-readable intent name")
    description = models.TextField(blank=True)
    
    # Keywords for matching
    keywords = models.JSONField(default=list, help_text="List of keywords that trigger this intent")
    patterns = models.JSONField(default=list, help_text="Regex patterns for matching")
    
    # Response configuration
    response_template = models.TextField(blank=True, help_text="Template for bot response")
    mapped_kb_items = models.ManyToManyField(KnowledgeBaseItem, blank=True, related_name='intents')
    
    # Priority and ordering
    priority = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    is_active = models.BooleanField(default=True)
    
    # Metadata
    usage_count = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='intents_created')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['priority', 'name']
        indexes = [
            models.Index(fields=['is_active', 'priority']),
        ]
    
    def __str__(self):
        return f"{self.display_name} ({self.name})"


class Ticket(models.Model):
    """Support tickets for reported issues"""
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('escalated', 'Escalated'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Status and priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Relations
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    related_conversation = models.ForeignKey('chatbot_core.ConversationSession', on_delete=models.SET_NULL, null=True, blank=True)
    related_kb_item = models.ForeignKey(KnowledgeBaseItem, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Internal notes
    internal_notes = models.TextField(blank=True, help_text="Internal notes visible only to admins")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]
    
    def __str__(self):
        return f"#{self.ticket_number} - {self.title}"
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def resolve(self):
        """Mark ticket as resolved"""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.save()
    
    def close(self):
        """Close the ticket"""
        self.status = 'closed'
        self.closed_at = timezone.now()
        self.save()


class TicketHistory(models.Model):
    """History timeline for ticket changes"""
    
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=100, help_text="Action taken (e.g., 'Status changed to Resolved')")
    description = models.TextField(blank=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changes = models.JSONField(default=dict, blank=True, help_text="JSON of field changes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.ticket.ticket_number} - {self.action}"


class NotificationTemplate(models.Model):
    """Notification templates for user announcements"""
    
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    template_type = models.CharField(max_length=50, default='email', help_text="email, push, sms")
    
    # Variables
    variables = models.JSONField(default=list, blank=True, help_text="Available template variables")
    
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.template_type})"


class Notification(models.Model):
    """User notifications and announcements"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    subject = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='email')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
        ]
    
    def __str__(self):
        return f"{self.subject} to {self.recipient.username}"


class AdminActivity(models.Model):
    """Log of admin activities for audit trail"""
    
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('publish', 'Publish'),
        ('unpublish', 'Unpublish'),
        ('assign', 'Assign'),
        ('resolve', 'Resolve'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='admin_activities')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=50, help_text="Model name (e.g., KnowledgeBaseItem, Ticket)")
    resource_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    
    # Changes
    changes = models.JSONField(default=dict, blank=True, help_text="JSON of what changed")
    
    # IP and user agent
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', 'created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]
    
    def __str__(self):
        return f"{self.admin} - {self.action} {self.resource_type}"


class SystemSettings(models.Model):
    """System-wide configuration settings"""
    
    SETTING_CATEGORY_CHOICES = [
        ('chatbot', 'Chatbot Settings'),
        ('ai', 'AI Configuration'),
        ('notifications', 'Notifications'),
        ('branding', 'Branding'),
        ('security', 'Security'),
        ('general', 'General'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=SETTING_CATEGORY_CHOICES)
    value = models.TextField(help_text="JSON-encoded value")
    value_type = models.CharField(max_length=20, default='string', help_text="string, number, boolean, json")
    description = models.TextField(blank=True)
    
    is_public = models.BooleanField(default=False, help_text="Can be accessed by frontend without auth")
    
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'key']
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
    
    def __str__(self):
        return f"{self.key} ({self.get_category_display()})"
    
    def get_value(self):
        """Get typed value"""
        import json
        if self.value_type == 'json':
            return json.loads(self.value)
        elif self.value_type == 'number':
            return float(self.value) if '.' in self.value else int(self.value)
        elif self.value_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes')
        return self.value
    
    def set_value(self, value):
        """Set typed value"""
        import json
        if self.value_type == 'json':
            self.value = json.dumps(value)
        else:
            self.value = str(value)
        self.save()

