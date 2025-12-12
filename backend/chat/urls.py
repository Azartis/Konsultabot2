from django.urls import path
from . import views

urlpatterns = [
    path('', views.v1_chat_endpoint, name='v1_chat'),  # Root v1 chat endpoint
    path('send/', views.send_message, name='send_message'),
    path('history/', views.chat_history_view, name='v1_chat_history'),
    path('sessions/', views.chat_sessions, name='chat_sessions'),
    path('sessions/end/', views.end_session, name='end_session'),
    path('knowledge/', views.knowledge_base, name='knowledge_base'),
    path('campus-info/', views.campus_info, name='campus_info'),
    path('search/', views.search_knowledge, name='search_knowledge'),
    path('test-gemini/', views.test_gemini, name='test_gemini'),
    path('test-chat-gemini/', views.test_chat_gemini, name='test_chat_gemini'),
    path('simple-gemini/', views.simple_gemini_test, name='simple_gemini_test'),
    path('server-info/', views.server_info, name='server_info'),
    # Voice processing endpoints
    path('speech-to-text/', views.speech_to_text_view, name='speech_to_text'),
    path('transcribe/', views.transcribe_audio_view, name='transcribe_audio'),
    # User knowledge base endpoints
    path('user-kb/', views.user_knowledge_base_list, name='user_kb_list'),
    path('user-kb/create/', views.user_knowledge_base_create, name='user_kb_create'),
    path('user-kb/sync/', views.user_knowledge_base_sync, name='user_kb_sync'),
    path('user-kb/<int:entry_id>/', views.user_knowledge_base_detail, name='user_kb_detail'),
]
