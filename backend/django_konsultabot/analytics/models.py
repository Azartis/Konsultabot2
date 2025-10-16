"""
Analytics Models for KonsultaBot Advanced AI Platform
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Avg, Count, Q
from django.contrib.auth import get_user_model
from datetime import timedelta
import json

User = get_user_model()


class QueryLog(models.Model):
    """Log of all user queries and system responses"""
    
    RESPONSE_SOURCE_CHOICES = [
        ('gemini', 'Gemini AI'),
        ('gemini_enhanced', 'Gemini Enhanced'),
        ('knowledge_base', 'Knowledge Base'),
        ('local_intelligence', 'Local Intelligence'),
        ('offline_knowledge_base', 'Offline Knowledge Base'),
        ('generic_fallback', 'Generic Fallback'),
        ('error', 'Error Response'),
    ]
    
    RESPONSE_MODE_CHOICES = [
        ('online', 'Online Processing'),
        ('offline', 'Offline Processing'),
        ('offline_fallback', 'Offline Fallback'),
        ('hybrid', 'Hybrid Processing'),
        ('error', 'Error Mode'),
    ]
    
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('tagalog', 'Tagalog'),
        ('bisaya', 'Bisaya'),
        ('waray', 'Waray'),
        ('spanish', 'Spanish'),
    ]
    
    # Basic query information
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    query = models.TextField()
    response_text = models.TextField(blank=True)
    
    # Response metadata
    response_source = models.CharField(max_length=30, choices=RESPONSE_SOURCE_CHOICES)
    response_mode = models.CharField(max_length=20, choices=RESPONSE_MODE_CHOICES, default='online')
    processing_time = models.FloatField(default=0.0)  # in seconds
    confidence_score = models.FloatField(null=True, blank=True)
    
    # Language and translation
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='english')
    translation_used = models.BooleanField(default=False)
    
    # Intent and entities
    intent_detected = models.CharField(max_length=50, blank=True)
    entities_extracted = models.JSONField(default=dict, blank=True)
    
    # User feedback
    satisfaction_score = models.IntegerField(null=True, blank=True)  # 1-5 rating
    user_feedback = models.TextField(blank=True)
    is_helpful = models.BooleanField(null=True, blank=True)
    
    # System metadata
    fallback_used = models.BooleanField(default=False)
    session_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['response_source']),
            models.Index(fields=['language']),
            models.Index(fields=['intent_detected']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Query: {self.query[:50]}... ({self.response_source})"
    
    @classmethod
    def get_usage_stats(cls, days=30):
        """Get usage statistics for the last N days"""
        since = timezone.now() - timedelta(days=days)
        
        return {
            'total_queries': cls.objects.filter(created_at__gte=since).count(),
            'unique_users': cls.objects.filter(created_at__gte=since).values('user').distinct().count(),
            'avg_processing_time': cls.objects.filter(created_at__gte=since).aggregate(
                avg_time=Avg('processing_time')
            )['avg_time'] or 0,
            'source_breakdown': dict(
                cls.objects.filter(created_at__gte=since)
                .values('response_source')
                .annotate(count=Count('id'))
                .values_list('response_source', 'count')
            ),
            'language_breakdown': dict(
                cls.objects.filter(created_at__gte=since)
                .values('language')
                .annotate(count=Count('id'))
                .values_list('language', 'count')
            ),
            'intent_breakdown': dict(
                cls.objects.filter(created_at__gte=since, intent_detected__isnull=False)
                .exclude(intent_detected='')
                .values('intent_detected')
                .annotate(count=Count('id'))
                .values_list('intent_detected', 'count')
            )
        }


class SystemMetrics(models.Model):
    """System performance and health metrics"""
    
    METRIC_TYPE_CHOICES = [
        ('response_time', 'Response Time'),
        ('error_rate', 'Error Rate'),
        ('uptime', 'System Uptime'),
        ('memory_usage', 'Memory Usage'),
        ('cpu_usage', 'CPU Usage'),
        ('api_calls', 'API Calls'),
        ('gemini_availability', 'Gemini API Availability'),
    ]
    
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPE_CHOICES)
    value = models.FloatField()
    unit = models.CharField(max_length=20, default='')  # seconds, percent, count, etc.
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.metric_type}: {self.value} {self.unit}"
    
    @classmethod
    def record_metric(cls, metric_type, value, unit='', metadata=None):
        """Record a system metric"""
        return cls.objects.create(
            metric_type=metric_type,
            value=value,
            unit=unit,
            metadata=metadata or {}
        )


class UserSession(models.Model):
    """Track user sessions and engagement"""
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100, unique=True)
    
    # Session metadata
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    
    # Engagement metrics
    message_count = models.IntegerField(default=0)
    voice_messages = models.IntegerField(default=0)
    languages_used = models.JSONField(default=list, blank=True)
    
    # Technical metadata
    device_info = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['user', 'start_time']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Session {self.session_id[:8]} - {self.user}"
    
    def end_session(self):
        """Mark session as ended and calculate duration"""
        if not self.end_time:
            self.end_time = timezone.now()
            self.duration = self.end_time - self.start_time
            self.save()


class OfflineQuery(models.Model):
    """Queue for offline queries to be processed when connection returns"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    query = models.TextField()
    language = models.CharField(max_length=20, default='english')
    
    # Processing status
    is_processed = models.BooleanField(default=False)
    response = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['user', 'is_processed']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Offline Query: {self.query[:50]}..."
    
    def mark_processed(self, response=''):
        """Mark query as processed"""
        self.is_processed = True
        self.response = response
        self.processed_at = timezone.now()
        self.save()


class FeedbackReport(models.Model):
    """User feedback and satisfaction reports"""
    
    FEEDBACK_TYPE_CHOICES = [
        ('rating', 'Star Rating'),
        ('thumbs', 'Thumbs Up/Down'),
        ('comment', 'Text Comment'),
        ('bug_report', 'Bug Report'),
        ('feature_request', 'Feature Request'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    query_log = models.ForeignKey(QueryLog, on_delete=models.CASCADE, null=True, blank=True)
    
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPE_CHOICES)
    rating = models.IntegerField(null=True, blank=True)  # 1-5 stars
    is_positive = models.BooleanField(null=True, blank=True)  # thumbs up/down
    comment = models.TextField(blank=True)
    
    # Categorization
    category = models.CharField(max_length=50, blank=True)  # auto-categorized
    priority = models.CharField(max_length=20, default='medium')
    
    # Status
    is_resolved = models.BooleanField(default=False)
    admin_response = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['feedback_type', 'created_at']),
            models.Index(fields=['is_resolved']),
        ]
    
    def __str__(self):
        return f"Feedback: {self.feedback_type} - {self.rating or self.is_positive}"


class APIUsageLog(models.Model):
    """Track external API usage (Gemini, Google Cloud, etc.)"""
    
    API_SERVICE_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('google_speech', 'Google Cloud Speech'),
        ('google_translate', 'Google Cloud Translate'),
        ('google_tts', 'Google Cloud Text-to-Speech'),
    ]
    
    service = models.CharField(max_length=30, choices=API_SERVICE_CHOICES)
    endpoint = models.CharField(max_length=100, blank=True)
    
    # Request details
    request_size = models.IntegerField(default=0)  # bytes
    response_size = models.IntegerField(default=0)  # bytes
    response_time = models.FloatField(default=0.0)  # seconds
    
    # Status
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    http_status = models.IntegerField(null=True, blank=True)
    
    # Cost tracking (if applicable)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['service', 'timestamp']),
            models.Index(fields=['success']),
        ]
    
    def __str__(self):
        return f"{self.service} - {'Success' if self.success else 'Failed'}"
    
    @classmethod
    def log_api_call(cls, service, success=True, response_time=0.0, 
                    request_size=0, response_size=0, error_message='', 
                    http_status=None, estimated_cost=None):
        """Log an API call"""
        return cls.objects.create(
            service=service,
            success=success,
            response_time=response_time,
            request_size=request_size,
            response_size=response_size,
            error_message=error_message,
            http_status=http_status,
            estimated_cost=estimated_cost
        )


class DailyStats(models.Model):
    """Daily aggregated statistics for dashboard"""
    
    date = models.DateField(unique=True)
    
    # Query statistics
    total_queries = models.IntegerField(default=0)
    unique_users = models.IntegerField(default=0)
    avg_response_time = models.FloatField(default=0.0)
    
    # Source breakdown
    gemini_queries = models.IntegerField(default=0)
    kb_queries = models.IntegerField(default=0)
    offline_queries = models.IntegerField(default=0)
    error_queries = models.IntegerField(default=0)
    
    # Language breakdown
    english_queries = models.IntegerField(default=0)
    tagalog_queries = models.IntegerField(default=0)
    bisaya_queries = models.IntegerField(default=0)
    waray_queries = models.IntegerField(default=0)
    spanish_queries = models.IntegerField(default=0)
    
    # Satisfaction metrics
    avg_satisfaction = models.FloatField(null=True, blank=True)
    positive_feedback = models.IntegerField(default=0)
    negative_feedback = models.IntegerField(default=0)
    
    # System metrics
    uptime_percentage = models.FloatField(default=100.0)
    api_success_rate = models.FloatField(default=100.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"Stats for {self.date}"
    
    @classmethod
    def generate_daily_stats(cls, date=None):
        """Generate daily statistics for a given date"""
        if date is None:
            date = timezone.now().date()
        
        # Get existing or create new
        stats, created = cls.objects.get_or_create(date=date)
        
        # Calculate statistics for the day
        day_start = timezone.datetime.combine(date, timezone.datetime.min.time())
        day_end = day_start + timedelta(days=1)
        
        queries = QueryLog.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end
        )
        
        # Basic stats
        stats.total_queries = queries.count()
        stats.unique_users = queries.values('user').distinct().count()
        stats.avg_response_time = queries.aggregate(
            avg=Avg('processing_time')
        )['avg'] or 0.0
        
        # Source breakdown
        source_counts = queries.values('response_source').annotate(count=Count('id'))
        for item in source_counts:
            source = item['response_source']
            count = item['count']
            
            if 'gemini' in source:
                stats.gemini_queries += count
            elif 'knowledge_base' in source:
                stats.kb_queries += count
            elif 'offline' in source:
                stats.offline_queries += count
            elif 'error' in source:
                stats.error_queries += count
        
        # Language breakdown
        lang_counts = queries.values('language').annotate(count=Count('id'))
        for item in lang_counts:
            lang = item['language']
            count = item['count']
            
            if lang == 'english':
                stats.english_queries = count
            elif lang == 'tagalog':
                stats.tagalog_queries = count
            elif lang == 'bisaya':
                stats.bisaya_queries = count
            elif lang == 'waray':
                stats.waray_queries = count
            elif lang == 'spanish':
                stats.spanish_queries = count
        
        # Satisfaction metrics
        satisfaction_avg = queries.filter(
            satisfaction_score__isnull=False
        ).aggregate(avg=Avg('satisfaction_score'))['avg']
        
        if satisfaction_avg:
            stats.avg_satisfaction = satisfaction_avg
        
        stats.positive_feedback = queries.filter(is_helpful=True).count()
        stats.negative_feedback = queries.filter(is_helpful=False).count()
        
        # API success rate
        api_calls = APIUsageLog.objects.filter(
            timestamp__gte=day_start,
            timestamp__lt=day_end
        )
        
        if api_calls.exists():
            success_rate = api_calls.filter(success=True).count() / api_calls.count() * 100
            stats.api_success_rate = success_rate
        
        stats.save()
        return stats
