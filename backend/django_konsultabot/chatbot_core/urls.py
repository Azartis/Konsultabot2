"""
KonsultaBot Chatbot Core URL Configuration
"""
from django.urls import path, include
from . import views

app_name = 'chatbot_core'

urlpatterns = [
    # Main chat endpoint
    path('', views.chat_endpoint, name='chat'),
    
    # Voice processing endpoints
    path('speech-to-text/', views.speech_to_text_endpoint, name='speech_to_text'),
    path('text-to-speech/', views.text_to_speech_endpoint, name='text_to_speech'),
    
    # Translation endpoint
    path('translate/', views.translate_endpoint, name='translate'),
    
    # Feedback and interaction
    path('feedback/', views.feedback_endpoint, name='feedback'),
    
    # Session management
    path('sessions/<str:session_id>/history/', views.session_history, name='session_history'),
    
    # System endpoints
    path('health/', views.health_check, name='health_check'),
    path('languages/', views.supported_languages, name='supported_languages'),
]
