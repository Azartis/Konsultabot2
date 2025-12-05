"""
Admin Panel Views for KonsultaBot Analytics Dashboard
"""
import json
from datetime import datetime, timedelta
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Count, Avg, Q, Sum
from django.core.paginator import Paginator

from analytics.models import (
    QueryLog, SystemMetrics, UserSession, FeedbackReport, 
    APIUsageLog, DailyStats
)
from chatbot_core.models import ConversationSession, ChatMessage
from django.contrib.auth.models import User


def is_admin_user(user):
    """Check if user is admin or staff"""
    return user.is_authenticated and (user.is_staff or user.is_superuser)


@login_required
@user_passes_test(is_admin_user)
def dashboard_home(request):
    """Main analytics dashboard"""
    
    # Get date range from request (default: last 30 days)
    days = int(request.GET.get('days', 30))
    since = timezone.now() - timedelta(days=days)
    
    # Basic statistics
    total_queries = QueryLog.objects.filter(created_at__gte=since).count()
    unique_users = QueryLog.objects.filter(created_at__gte=since).values('user').distinct().count()
    active_sessions = ConversationSession.objects.filter(last_activity__gte=since).count()
    
    # Response source breakdown
    source_stats = QueryLog.objects.filter(created_at__gte=since).values('response_source').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Language usage
    language_stats = QueryLog.objects.filter(created_at__gte=since).values('language').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Intent analysis
    intent_stats = QueryLog.objects.filter(
        created_at__gte=since,
        intent_detected__isnull=False
    ).exclude(intent_detected='').values('intent_detected').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Performance metrics
    avg_response_time = QueryLog.objects.filter(created_at__gte=since).aggregate(
        avg_time=Avg('processing_time')
    )['avg_time'] or 0
    
    # Satisfaction metrics
    satisfaction_stats = QueryLog.objects.filter(
        created_at__gte=since,
        satisfaction_score__isnull=False
    ).aggregate(
        avg_satisfaction=Avg('satisfaction_score'),
        total_ratings=Count('satisfaction_score')
    )
    
    # API usage and costs
    api_stats = APIUsageLog.objects.filter(timestamp__gte=since).aggregate(
        total_calls=Count('id'),
        success_rate=Avg('success'),
        avg_response_time=Avg('response_time'),
        total_cost=Sum('estimated_cost')
    )
    
    # Recent feedback
    recent_feedback = FeedbackReport.objects.filter(
        created_at__gte=since
    ).order_by('-created_at')[:5]
    
    # System health
    gemini_availability = APIUsageLog.objects.filter(
        service='gemini',
        timestamp__gte=since
    ).aggregate(
        success_rate=Avg('success')
    )['success_rate'] or 0
    
    context = {
        'days': days,
        'total_queries': total_queries,
        'unique_users': unique_users,
        'active_sessions': active_sessions,
        'source_stats': list(source_stats),
        'language_stats': list(language_stats),
        'intent_stats': list(intent_stats),
        'avg_response_time': round(avg_response_time, 2),
        'satisfaction_stats': satisfaction_stats,
        'api_stats': api_stats,
        'recent_feedback': recent_feedback,
        'gemini_availability': round(gemini_availability * 100, 1) if gemini_availability else 0,
    }
    
    return render(request, 'adminpanel/dashboard.html', context)


@login_required
@user_passes_test(is_admin_user)
def analytics_api(request):
    """API endpoint for dashboard charts and real-time data"""
    
    chart_type = request.GET.get('type', 'usage_over_time')
    days = int(request.GET.get('days', 30))
    since = timezone.now() - timedelta(days=days)
    
    if chart_type == 'usage_over_time':
        # Daily usage chart
        daily_stats = DailyStats.objects.filter(
            date__gte=since.date()
        ).order_by('date').values('date', 'total_queries', 'unique_users')
        
        data = {
            'labels': [stat['date'].strftime('%Y-%m-%d') for stat in daily_stats],
            'datasets': [
                {
                    'label': 'Total Queries',
                    'data': [stat['total_queries'] for stat in daily_stats],
                    'borderColor': '#4C9EF6',
                    'backgroundColor': 'rgba(76, 158, 246, 0.1)',
                },
                {
                    'label': 'Unique Users',
                    'data': [stat['unique_users'] for stat in daily_stats],
                    'borderColor': '#10B981',
                    'backgroundColor': 'rgba(16, 185, 129, 0.1)',
                }
            ]
        }
    
    elif chart_type == 'source_breakdown':
        # Response source pie chart
        source_stats = QueryLog.objects.filter(created_at__gte=since).values('response_source').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Map source names to display names
        source_names = {
            'gemini': 'Gemini AI',
            'gemini_enhanced': 'Gemini Enhanced',
            'knowledge_base': 'Knowledge Base',
            'local_intelligence': 'Local Intelligence',
            'offline_knowledge_base': 'Offline KB',
            'generic_fallback': 'Generic Response',
            'error': 'Error Response'
        }
        
        data = {
            'labels': [source_names.get(stat['response_source'], stat['response_source']) for stat in source_stats],
            'datasets': [{
                'data': [stat['count'] for stat in source_stats],
                'backgroundColor': [
                    '#4C9EF6', '#10B981', '#F59E0B', '#EF4444', 
                    '#8B5CF6', '#F97316', '#6B7280'
                ]
            }]
        }
    
    elif chart_type == 'language_usage':
        # Language usage chart
        language_stats = QueryLog.objects.filter(created_at__gte=since).values('language').annotate(
            count=Count('id')
        ).order_by('-count')
        
        language_names = {
            'english': 'English',
            'tagalog': 'Tagalog',
            'bisaya': 'Bisaya',
            'waray': 'Waray',
            'spanish': 'Spanish'
        }
        
        data = {
            'labels': [language_names.get(stat['language'], stat['language']) for stat in language_stats],
            'datasets': [{
                'label': 'Queries by Language',
                'data': [stat['count'] for stat in language_stats],
                'backgroundColor': ['#4C9EF6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            }]
        }
    
    elif chart_type == 'response_times':
        # Response time distribution
        time_ranges = [
            ('0-1s', 0, 1),
            ('1-2s', 1, 2),
            ('2-5s', 2, 5),
            ('5-10s', 5, 10),
            ('10s+', 10, float('inf'))
        ]
        
        data = {'labels': [], 'datasets': [{'data': [], 'backgroundColor': '#4C9EF6'}]}
        
        for label, min_time, max_time in time_ranges:
            if max_time == float('inf'):
                count = QueryLog.objects.filter(
                    created_at__gte=since,
                    processing_time__gte=min_time
                ).count()
            else:
                count = QueryLog.objects.filter(
                    created_at__gte=since,
                    processing_time__gte=min_time,
                    processing_time__lt=max_time
                ).count()
            
            data['labels'].append(label)
            data['datasets'][0]['data'].append(count)
    
    elif chart_type == 'satisfaction_trends':
        # Satisfaction over time
        daily_satisfaction = DailyStats.objects.filter(
            date__gte=since.date(),
            avg_satisfaction__isnull=False
        ).order_by('date').values('date', 'avg_satisfaction', 'positive_feedback', 'negative_feedback')
        
        data = {
            'labels': [stat['date'].strftime('%Y-%m-%d') for stat in daily_satisfaction],
            'datasets': [
                {
                    'label': 'Average Satisfaction',
                    'data': [stat['avg_satisfaction'] for stat in daily_satisfaction],
                    'borderColor': '#10B981',
                    'backgroundColor': 'rgba(16, 185, 129, 0.1)',
                    'yAxisID': 'y'
                },
                {
                    'label': 'Positive Feedback',
                    'data': [stat['positive_feedback'] for stat in daily_satisfaction],
                    'borderColor': '#4C9EF6',
                    'backgroundColor': 'rgba(76, 158, 246, 0.1)',
                    'yAxisID': 'y1'
                }
            ]
        }
    
    elif chart_type == 'real_time_stats':
        # Real-time statistics
        now = timezone.now()
        last_hour = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)
        
        data = {
            'queries_last_hour': QueryLog.objects.filter(created_at__gte=last_hour).count(),
            'queries_last_24h': QueryLog.objects.filter(created_at__gte=last_24h).count(),
            'active_sessions': ConversationSession.objects.filter(
                last_activity__gte=last_hour
            ).count(),
            'gemini_success_rate': APIUsageLog.objects.filter(
                service='gemini',
                timestamp__gte=last_24h
            ).aggregate(success_rate=Avg('success'))['success_rate'] or 0,
            'avg_response_time_1h': QueryLog.objects.filter(
                created_at__gte=last_hour
            ).aggregate(avg=Avg('processing_time'))['avg'] or 0,
        }
    
    else:
        data = {'error': 'Unknown chart type'}
    
    return JsonResponse(data)


@login_required
@user_passes_test(is_admin_user)
def query_logs(request):
    """View detailed query logs"""
    
    # Filters
    source_filter = request.GET.get('source', '')
    language_filter = request.GET.get('language', '')
    intent_filter = request.GET.get('intent', '')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    # Base queryset
    queryset = QueryLog.objects.all().order_by('-created_at')
    
    # Apply filters
    if source_filter:
        queryset = queryset.filter(response_source=source_filter)
    
    if language_filter:
        queryset = queryset.filter(language=language_filter)
    
    if intent_filter:
        queryset = queryset.filter(intent_detected=intent_filter)
    
    if date_from:
        queryset = queryset.filter(created_at__gte=date_from)
    
    if date_to:
        queryset = queryset.filter(created_at__lte=date_to)
    
    # Pagination
    paginator = Paginator(queryset, 50)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get filter options
    sources = QueryLog.objects.values_list('response_source', flat=True).distinct()
    languages = QueryLog.objects.values_list('language', flat=True).distinct()
    intents = QueryLog.objects.exclude(intent_detected='').values_list('intent_detected', flat=True).distinct()
    
    context = {
        'page_obj': page_obj,
        'sources': sources,
        'languages': languages,
        'intents': intents,
        'current_filters': {
            'source': source_filter,
            'language': language_filter,
            'intent': intent_filter,
            'date_from': date_from,
            'date_to': date_to,
        }
    }
    
    return render(request, 'adminpanel/query_logs.html', context)


@login_required
@user_passes_test(is_admin_user)
def feedback_management(request):
    """Manage user feedback and reports"""
    
    # Filter options
    feedback_type = request.GET.get('type', '')
    is_resolved = request.GET.get('resolved', '')
    
    queryset = FeedbackReport.objects.all().order_by('-created_at')
    
    if feedback_type:
        queryset = queryset.filter(feedback_type=feedback_type)
    
    if is_resolved:
        queryset = queryset.filter(is_resolved=is_resolved.lower() == 'true')
    
    # Pagination
    paginator = Paginator(queryset, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistics
    feedback_stats = {
        'total': FeedbackReport.objects.count(),
        'unresolved': FeedbackReport.objects.filter(is_resolved=False).count(),
        'avg_rating': FeedbackReport.objects.filter(
            rating__isnull=False
        ).aggregate(avg=Avg('rating'))['avg'] or 0,
        'positive_ratio': FeedbackReport.objects.filter(
            is_positive=True
        ).count() / max(FeedbackReport.objects.filter(
            is_positive__isnull=False
        ).count(), 1) * 100
    }
    
    context = {
        'page_obj': page_obj,
        'feedback_stats': feedback_stats,
        'current_filters': {
            'type': feedback_type,
            'resolved': is_resolved,
        }
    }
    
    return render(request, 'adminpanel/feedback.html', context)


@login_required
@user_passes_test(is_admin_user)
def system_health(request):
    """System health and performance monitoring"""
    
    # Recent system metrics
    recent_metrics = SystemMetrics.objects.filter(
        timestamp__gte=timezone.now() - timedelta(hours=24)
    ).order_by('-timestamp')[:100]
    
    # API health
    api_health = {}
    for service in ['gemini', 'google_speech', 'google_translate', 'google_tts']:
        recent_calls = APIUsageLog.objects.filter(
            service=service,
            timestamp__gte=timezone.now() - timedelta(hours=24)
        )
        
        if recent_calls.exists():
            api_health[service] = {
                'total_calls': recent_calls.count(),
                'success_rate': recent_calls.filter(success=True).count() / recent_calls.count() * 100,
                'avg_response_time': recent_calls.aggregate(avg=Avg('response_time'))['avg'] or 0,
                'total_cost': recent_calls.aggregate(sum=Sum('estimated_cost'))['sum'] or 0,
            }
        else:
            api_health[service] = {
                'total_calls': 0,
                'success_rate': 0,
                'avg_response_time': 0,
                'total_cost': 0,
            }
    
    # Database statistics
    db_stats = {
        'total_queries': QueryLog.objects.count(),
        'total_sessions': ConversationSession.objects.count(),
        'total_messages': ChatMessage.objects.count(),
        'total_users': User.objects.count(),
    }
    
    context = {
        'recent_metrics': recent_metrics,
        'api_health': api_health,
        'db_stats': db_stats,
    }
    
    return render(request, 'adminpanel/system_health.html', context)


@login_required
@user_passes_test(is_admin_user)
@require_http_methods(["POST"])
def resolve_feedback(request, feedback_id):
    """Mark feedback as resolved with admin response"""
    
    try:
        feedback = FeedbackReport.objects.get(id=feedback_id)
        admin_response = request.POST.get('admin_response', '')
        
        feedback.is_resolved = True
        feedback.admin_response = admin_response
        feedback.save()
        
        return JsonResponse({'success': True, 'message': 'Feedback resolved successfully'})
        
    except FeedbackReport.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Feedback not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@user_passes_test(is_admin_user)
def export_data(request):
    """Export analytics data in various formats"""
    
    export_type = request.GET.get('type', 'queries')
    format_type = request.GET.get('format', 'csv')
    days = int(request.GET.get('days', 30))
    
    since = timezone.now() - timedelta(days=days)
    
    if export_type == 'queries':
        queryset = QueryLog.objects.filter(created_at__gte=since)
        
        if format_type == 'csv':
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="query_logs_{since.date()}_to_{timezone.now().date()}.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Date', 'User', 'Query', 'Response Source', 'Language', 
                'Intent', 'Processing Time', 'Confidence', 'Satisfaction'
            ])
            
            for query in queryset:
                writer.writerow([
                    query.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    query.user.username if query.user else 'Anonymous',
                    query.query,
                    query.response_source,
                    query.language,
                    query.intent_detected,
                    query.processing_time,
                    query.confidence_score,
                    query.satisfaction_score,
                ])
            
            return response
    
    # Add more export types as needed
    return JsonResponse({'error': 'Export type not supported'})


@login_required
@user_passes_test(is_admin_user)
def generate_report(request):
    """Generate comprehensive analytics report"""
    
    days = int(request.GET.get('days', 30))
    since = timezone.now() - timedelta(days=days)
    
    # Generate daily stats for the period
    current_date = since.date()
    end_date = timezone.now().date()
    
    while current_date <= end_date:
        DailyStats.generate_daily_stats(current_date)
        current_date += timedelta(days=1)
    
    return JsonResponse({
        'success': True,
        'message': f'Report generated for {days} days',
        'period': f'{since.date()} to {end_date}'
    })
