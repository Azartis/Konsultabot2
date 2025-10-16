"""
Chatbot Core Models - Session-based conversation management
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import uuid


class ConversationSession(models.Model):
    """Manages conversation sessions with memory context"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_sessions')
    session_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    title = models.CharField(max_length=200, blank=True)
    language = models.CharField(max_length=20, default='english')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Session metadata
    device_info = models.JSONField(default=dict, blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', '-last_activity']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Session {self.session_id[:8]} - {self.user.username}"
    
    @property
    def is_expired(self):
        """Check if session has expired (30 minutes of inactivity)"""
        from django.conf import settings
        timeout_minutes = getattr(settings, 'KONSULTABOT_SETTINGS', {}).get('SESSION_TIMEOUT_MINUTES', 30)
        return timezone.now() - self.last_activity > timedelta(minutes=timeout_minutes)
    
    @property
    def message_count(self):
        """Get total messages in this session"""
        return self.messages.count()
    
    def get_recent_context(self, limit=10):
        """Get recent conversation context for AI processing"""
        messages = self.messages.order_by('-timestamp')[:limit]
        context = []
        for msg in reversed(messages):
            context.append({
                'sender': msg.sender,
                'message': msg.message,
                'timestamp': msg.timestamp.isoformat()
            })
        return context
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])


class ChatMessage(models.Model):
    """Individual chat messages within a conversation session"""
    
    SENDER_CHOICES = [
        ('user', 'User'),
        ('bot', 'Bot'),
        ('system', 'System'),
    ]
    
    SOURCE_CHOICES = [
        ('gemini', 'Gemini AI'),
        ('knowledge_base', 'Knowledge Base'),
        ('local_intelligence', 'Local Intelligence'),
        ('hybrid', 'Hybrid Response'),
        ('system', 'System Message'),
    ]
    
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    message_type = models.CharField(max_length=20, default='text')  # text, voice, image, etc.
    
    # Response metadata
    response_source = models.CharField(max_length=20, choices=SOURCE_CHOICES, null=True, blank=True)
    response_time = models.FloatField(null=True, blank=True)  # Processing time in seconds
    confidence_score = models.FloatField(null=True, blank=True)  # AI confidence (0-1)
    
    # Message context
    intent_detected = models.CharField(max_length=50, blank=True)  # wifi, printer, computer, etc.
    entities_extracted = models.JSONField(default=dict, blank=True)  # NER results
    response = models.TextField(blank=True, null=True)  # Bot's response to the message
    
    # Feedback
    user_rating = models.IntegerField(null=True, blank=True)  # 1-5 rating
    user_feedback = models.TextField(blank=True)
    is_helpful = models.BooleanField(null=True, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['session', 'timestamp']),
            models.Index(fields=['sender', 'timestamp']),
            models.Index(fields=['response_source']),
        ]
    
    def __str__(self):
        return f"{self.sender}: {self.message[:50]}..."
    
    @property
    def is_user_message(self):
        return self.sender == 'user'
    
    @property
    def is_bot_message(self):
        return self.sender == 'bot'


class SessionContext(models.Model):
    """Stores additional context and state for conversation sessions"""
    
    session = models.OneToOneField(ConversationSession, on_delete=models.CASCADE, related_name='context')
    
    # User preferences
    preferred_language = models.CharField(max_length=20, default='english')
    voice_enabled = models.BooleanField(default=False)
    notification_preferences = models.JSONField(default=dict, blank=True)
    
    # Conversation state
    current_topic = models.CharField(max_length=100, blank=True)
    unresolved_issues = models.JSONField(default=list, blank=True)
    follow_up_needed = models.BooleanField(default=False)
    
    # Technical context
    user_device_type = models.CharField(max_length=50, blank=True)
    operating_system = models.CharField(max_length=50, blank=True)
    reported_issues = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Context for {self.session.session_id[:8]}"


class QuickAction(models.Model):
    """Predefined quick actions for common IT issues"""
    
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='help-circle')
    category = models.CharField(max_length=50)
    query_template = models.TextField()
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-usage_count', 'title']
    
    def __str__(self):
        return self.title
    
    def increment_usage(self):
        """Increment usage counter"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])
