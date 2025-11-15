"""
KonsultaBot Advanced AI Platform URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from .views import health_redirect, api_health

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Health check endpoints (must be before other routes)
    path('api/health/', api_health, name='api_health'),
    path('health/', health_redirect, name='health'),
    
    # Authentication endpoints (RBAC)
    path('api/auth/', include('user_account.urls')),
    
    # API endpoints
    path('api/v1/chat/', include('chatbot_core.urls')),
    path('api/v1/knowledge/', include('knowledgebase.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    
    # Admin dashboard
    path('dashboard/', include('adminpanel.urls')),
    
    # Root redirect to admin dashboard
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom admin site headers
admin.site.site_header = "KonsultaBot Advanced AI Platform"
admin.site.site_title = "KonsultaBot Admin"
admin.site.index_title = "Welcome to KonsultaBot Administration"
