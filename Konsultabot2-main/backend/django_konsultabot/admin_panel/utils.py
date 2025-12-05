"""
Utility functions for Admin Panel
"""
import logging
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Count, Q, Avg
from .models import AdminActivity
from chatbot_core.models import ConversationSession, ChatMessage
from chatbot_core.knowledge_base import get_all_entries
from analytics.models import QueryLog
from user_account.models import User

logger = logging.getLogger('konsultabot.admin_panel')


def log_admin_activity(admin, action_type, resource_type, description, 
                      resource_id='', metadata=None, request=None):
    """Log an admin activity"""
    ip_address = None
    user_agent = ''
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    return AdminActivity.objects.create(
        admin=admin,
        action_type=action_type,
        resource_type=resource_type,
        resource_id=str(resource_id),
        description=description,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent
    )


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_dashboard_stats(days=30):
    """Get dashboard statistics"""
    since = timezone.now() - timedelta(days=days)
    
    # Basic counts
    total_users = User.objects.count()
    total_conversations = ConversationSession.objects.filter(created_at__gte=since).count()
    total_queries = QueryLog.objects.filter(created_at__gte=since).count()
    
    # Knowledge Base stats
    kb_entries = get_all_entries()
    total_kb_items = len(kb_entries)
    kb_views = sum(entry.get('view_count', 0) for entry in kb_entries if isinstance(entry, dict))
    
    # Most common intents
    intent_counts = QueryLog.objects.filter(
        created_at__gte=since,
        intent_detected__isnull=False
    ).exclude(intent_detected='').values('intent_detected').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    most_common_intents = {item['intent_detected']: item['count'] for item in intent_counts}
    
    # Usage chart data (dynamic based on days parameter)
    usage_data = {}
    chart_days = min(days, 30)  # Limit to 30 days for chart
    for i in range(chart_days):
        date = timezone.now().date() - timedelta(days=i)
        day_start = datetime.combine(date, datetime.min.time())
        day_start = timezone.make_aware(day_start)
        day_end = day_start + timedelta(days=1)
        
        day_queries = QueryLog.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end
        ).count()
        
        usage_data[date.strftime('%Y-%m-%d')] = day_queries
    
    # KB usage data (how many times KB was used)
    kb_usage_data = {}
    for i in range(chart_days):
        date = timezone.now().date() - timedelta(days=i)
        day_start = datetime.combine(date, datetime.min.time())
        day_start = timezone.make_aware(day_start)
        day_end = day_start + timedelta(days=1)
        
        # Count messages that came from knowledge base
        kb_usage = ChatMessage.objects.filter(
            timestamp__gte=day_start,
            timestamp__lt=day_end,
            response_source='knowledge_base'
        ).count()
        
        kb_usage_data[date.strftime('%Y-%m-%d')] = kb_usage
    
    # Growth rates (compare with previous period)
    prev_since = timezone.now() - timedelta(days=days * 2)
    prev_conversations = ConversationSession.objects.filter(
        created_at__gte=prev_since,
        created_at__lt=since
    ).count()
    prev_queries = QueryLog.objects.filter(
        created_at__gte=prev_since,
        created_at__lt=since
    ).count()
    
    conversation_growth_rate = (
        ((total_conversations - prev_conversations) / prev_conversations * 100)
        if prev_conversations > 0 else 0
    )
    query_growth_rate = (
        ((total_queries - prev_queries) / prev_queries * 100)
        if prev_queries > 0 else 0
    )
    
    # Recent activities - handle case where database doesn't have action_type column yet
    activities_list = []
    try:
        recent_activities = AdminActivity.objects.all()[:10]
        for activity in recent_activities:
            try:
                # Try to access action_type - may not exist in database yet
                action_type = getattr(activity, 'action_type', 'unknown')
                action_type_display = activity.get_action_type_display() if hasattr(activity, 'get_action_type_display') else action_type
            except (AttributeError, ValueError):
                # Fallback if action_type doesn't exist
                action_type = 'unknown'
                action_type_display = 'Unknown'
            
            activities_list.append({
                'id': activity.id,
                'admin_username': activity.admin.username if activity.admin else 'System',
                'action_type': action_type,
                'action_type_display': action_type_display,
                'resource_type': getattr(activity, 'resource_type', 'Unknown'),
                'description': getattr(activity, 'description', ''),
                'created_at': activity.created_at.isoformat() if hasattr(activity, 'created_at') else timezone.now().isoformat(),
            })
    except Exception as e:
        # If AdminActivity table doesn't exist or has schema issues, return empty list
        logger.warning(f"Could not fetch admin activities: {e}")
        activities_list = []
    
    return {
        'total_users': total_users,
        'total_conversations': total_conversations,
        'total_queries': total_queries,
        'total_kb_items': total_kb_items,
        'kb_views': kb_views,
        'most_common_intents': most_common_intents,
        'usage_chart_data': usage_data,
        'kb_usage_data': kb_usage_data,
        'conversation_growth_rate': round(conversation_growth_rate, 1),
        'query_growth_rate': round(query_growth_rate, 1),
        'recent_activities': activities_list
    }

