"""
Admin Panel URL Configuration for KonsultaBot Analytics
"""
from django.urls import path
from . import views

app_name = 'adminpanel'

urlpatterns = [
    # Main dashboard
    path('', views.dashboard_home, name='dashboard_home'),
    
    # Analytics API endpoints
    path('api/analytics/', views.analytics_api, name='analytics_api'),
    
    # Detailed views
    path('queries/', views.query_logs, name='query_logs'),
    path('feedback/', views.feedback_management, name='feedback_management'),
    path('system/', views.system_health, name='system_health'),
    
    # Actions
    path('feedback/<int:feedback_id>/resolve/', views.resolve_feedback, name='resolve_feedback'),
    path('export/', views.export_data, name='export_data'),
    path('generate-report/', views.generate_report, name='generate_report'),
]
