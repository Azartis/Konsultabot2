"""
Admin Panel Models for KonsultaBot
Comprehensive models for managing chatbot content, users, tickets, and system configuration
"""
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


def generate_ticket_id():
    """Generate unique ticket ID"""
    return f"TKT-{uuid.uuid4().hex[:8].upper()}"


class Intent(models.Model):
    """Intent classification for chatbot responses"""
    
    INTENT_TYPE_CHOICES = [
        ('tech_support', 'Technical Support'),
        ('general', 'General Query'),
        ('chit_chat', 'Chit Chat'),
        ('greeting', 'Greeting'),
        ('goodbye', 'Goodbye'),
        ('unknown', 'Unknown'),
        ('out_of_scope', 'Out of Scope'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    intent_type = models.CharField(max_length=20, choices=INTENT_TYPE_CHOICES)
    description = models.TextField(blank=True)
    priority = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    is_active = models.BooleanField(default=True)
    
    # Response configuration
    default_response = models.TextField(blank=True, help_text="Default response for this intent")
    requires_clarification = models.BooleanField(default=False)
    clarification_prompt = models.TextField(blank=True)
    
    # Metadata
    usage_count = models.IntegerField(default=0)
    success_rate = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_intents')
    
    class Meta:
        ordering = ['-priority', 'name']
        indexes = [
            models.Index(fields=['intent_type', 'is_active']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_intent_type_display()})"


class Keyword(models.Model):
    """Keywords mapped to intents for rule-based matching"""
    
    intent = models.ForeignKey(Intent, on_delete=models.CASCADE, related_name='keywords')
    keyword = models.CharField(max_length=100, db_index=True)
    weight = models.FloatField(default=1.0, validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    is_active = models.BooleanField(default=True)
    
    # Matching options
    exact_match = models.BooleanField(default=False, help_text="Require exact match")
    case_sensitive = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['intent', 'keyword']
        ordering = ['-weight', 'keyword']
        indexes = [
            models.Index(fields=['keyword', 'is_active']),
            models.Index(fields=['intent', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.keyword} -> {self.intent.name}"


class KnowledgeBaseItem(models.Model):
    """Knowledge Base entries for FAQs, troubleshooting, and guides"""
    
    CATEGORY_CHOICES = [
        ('faq', 'FAQ'),
        ('troubleshooting', 'Troubleshooting'),
        ('device_guide', 'Device Guide'),
        ('software_guide', 'Software Guide'),
        ('network_guide', 'Network Guide'),
        ('general', 'General Information'),
    ]
    
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('tagalog', 'Tagalog'),
        ('bisaya', 'Bisaya'),
        ('waray', 'Waray'),
        ('spanish', 'Spanish'),
    ]
    
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='english')
    
    # Content
    question = models.TextField(help_text="Question or issue description")
    answer = models.TextField(help_text="Answer or solution")
    content = models.TextField(blank=True, help_text="Full markdown/rich text content")
    
    # Metadata
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    keywords = models.TextField(blank=True, help_text="Comma-separated keywords for search")
    priority = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    helpful_count = models.IntegerField(default=0)
    not_helpful_count = models.IntegerField(default=0)
    
    # Related items
    related_items = models.ManyToManyField('self', blank=True, symmetrical=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_kb_items')
    last_reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_kb_items')
    last_reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-priority', '-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['language', 'is_active']),
            models.Index(fields=['tags']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"
    
    def increment_view(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])


class Ticket(models.Model):
    """Support tickets for user-reported issues"""
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    ticket_id = models.CharField(max_length=20, unique=True, default=generate_ticket_id)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    
    # Ticket details
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, blank=True)
    
    # Status and priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    assigned_at = models.DateTimeField(null=True, blank=True)
    
    # Resolution
    resolution = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_tickets')
    
    # Metadata
    tags = models.CharField(max_length=500, blank=True)
    related_conversation = models.ForeignKey('chatbot_core.ConversationSession', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.ticket_id} - {self.title}"


class TicketNote(models.Model):
    """Internal notes for tickets"""
    
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ticket_notes')
    note = models.TextField()
    is_internal = models.BooleanField(default=True, help_text="Internal notes are not visible to users")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note on {self.ticket.ticket_id} by {self.author.username}"


class TicketHistory(models.Model):
    """History log for ticket status changes"""
    
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    old_value = models.CharField(max_length=200, blank=True)
    new_value = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.ticket.ticket_id} - {self.action}"


class NotificationTemplate(models.Model):
    """Notification templates for user announcements"""
    
    NOTIFICATION_TYPE_CHOICES = [
        ('announcement', 'Announcement'),
        ('maintenance', 'Maintenance'),
        ('update', 'Update'),
        ('alert', 'Alert'),
        ('promotion', 'Promotion'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    html_content = models.TextField(blank=True, help_text="HTML content for rich notifications")
    
    # Targeting
    target_audience = models.CharField(max_length=50, default='all', help_text="all, students, staff, admin")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_notification_type_display()})"


class Notification(models.Model):
    """Sent notifications to users"""
    
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    
    # Custom notification (if not using template)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    html_content = models.TextField(blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    
    # Delivery
    delivery_method = models.CharField(max_length=20, default='in_app', help_text="in_app, email, push")
    delivery_status = models.CharField(max_length=20, default='pending', help_text="pending, sent, failed")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['delivery_status']),
        ]
    
    def __str__(self):
        return f"Notification to {self.user.username if self.user else 'All Users'}"


class ChatbotSettings(models.Model):
    """System-wide chatbot configuration"""
    
    setting_key = models.CharField(max_length=100, unique=True)
    setting_value = models.TextField()
    setting_type = models.CharField(max_length=20, default='string', help_text="string, integer, boolean, json")
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, default='general', help_text="general, ai, ui, notifications")
    
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['category', 'setting_key']
        verbose_name = "Chatbot Setting"
        verbose_name_plural = "Chatbot Settings"
    
    def __str__(self):
        return f"{self.setting_key} = {self.setting_value[:50]}"


class AdminActivity(models.Model):
    """Log of admin activities for audit trail"""
    
    ACTION_TYPE_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('export', 'Export'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('settings_change', 'Settings Change'),
    ]
    
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='admin_activities')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPE_CHOICES)
    resource_type = models.CharField(max_length=50, help_text="Model name or resource type")
    resource_id = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', 'created_at']),
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['resource_type']),
        ]
    
    def __str__(self):
        return f"{self.admin.username} - {self.get_action_type_display()} - {self.resource_type}"


class AdminRole(models.Model):
    """Custom admin roles with permissions"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Permissions (stored as JSON)
    permissions = models.JSONField(default=dict, help_text="Dictionary of permissions")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class AdminUserRole(models.Model):
    """Many-to-many relationship between users and admin roles"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_roles')
    role = models.ForeignKey(AdminRole, on_delete=models.CASCADE, related_name='users')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='role_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'role']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.role.name}"
