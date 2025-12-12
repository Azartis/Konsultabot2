"""
Analytics URL Configuration
"""
from django.urls import path
from django.http import JsonResponse

def placeholder_view(request):
    return JsonResponse({'message': 'Analytics API - Coming Soon'})

app_name = 'analytics'

urlpatterns = [
    path('', placeholder_view, name='placeholder'),
]
