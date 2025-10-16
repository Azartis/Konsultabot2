"""
URL configuration for KonsultaBot backend
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('user_account.urls')),  # User auth endpoints
    path('api/', include('api.urls')),  # API endpoints
    path('api/chat/', include('chat.urls')),  # Chat endpoints
]
