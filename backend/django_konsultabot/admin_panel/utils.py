"""
Utility functions for Admin Panel
"""
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Count, Q, Avg
from .models import AdminActivity, Ticket
from chatbot_core.models import ConversationSession, ChatMessage
from analytics.models import QueryLog
from user_account.models import User


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
    total_tickets = Ticket.objects.count()
    open_tickets = Ticket.objects.filter(status__in=['open', 'in_progress']).count()
    resolved_tickets = Ticket.objects.filter(status='resolved').count()
    total_queries = QueryLog.objects.filter(created_at__gte=since).count()
    
    # Most common intents
    intent_counts = QueryLog.objects.filter(
        created_at__gte=since,
        intent_detected__isnull=False
    ).exclude(intent_detected='').values('intent_detected').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    most_common_intents = {item['intent_detected']: item['count'] for item in intent_counts}
    
    # Usage chart data (last 7 days)
    usage_data = {}
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        day_start = datetime.combine(date, datetime.min.time())
        day_start = timezone.make_aware(day_start)
        day_end = day_start + timedelta(days=1)
        
        day_queries = QueryLog.objects.filter(
            created_at__gte=day_start,
            created_at__lt=day_end
        ).count()
        
        usage_data[date.strftime('%Y-%m-%d')] = day_queries
    
    # Recent activities
    recent_activities = AdminActivity.objects.all()[:10]
    
    return {
        'total_users': total_users,
        'total_conversations': total_conversations,
        'total_tickets': total_tickets,
        'open_tickets': open_tickets,
        'resolved_tickets': resolved_tickets,
        'total_queries': total_queries,
        'most_common_intents': most_common_intents,
        'usage_chart_data': usage_data,
        'recent_activities': recent_activities
    }

