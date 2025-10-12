"""
Knowledge Base URL Configuration
"""
from django.urls import path
from django.http import JsonResponse

def placeholder_view(request):
    return JsonResponse({'message': 'Knowledge Base API - Coming Soon'})

app_name = 'knowledgebase'

urlpatterns = [
    path('', placeholder_view, name='placeholder'),
]
