"""
KonsultaBot Chatbot Core URL Configuration
"""
from django.urls import path, include
from . import views
from . import views_test
from . import gemini_views as views_gemini

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
    path('history/', views.chat_history, name='chat_history'),
    
    # Gemini endpoints
    path('gemini/', include([
        path('', views_gemini.gemini_chat, name='gemini_chat'),
        path('translate/', views_gemini.gemini_translate, name='gemini_translate'),
        path('image/', views.gemini_image_gen, name='gemini_image_gen'),
    ])),
    
    # System endpoints
    path('health/', views.health_check, name='health_check'),
    path('languages/', views.supported_languages, name='supported_languages'),
    
    # Test endpoints
    path('ping/', views_test.test_ping, name='test_ping'),
    path('test-simple/', views_test.test_simple, name='test_simple'),
    path('test-gemini/', views_test.test_gemini, name='test_gemini'),
]
