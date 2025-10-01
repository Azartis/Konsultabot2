from django.urls import path
from . import views

urlpatterns = [
    path('send/', views.send_message, name='send_message'),
    path('history/', views.conversation_history, name='conversation_history'),
    path('sessions/', views.chat_sessions, name='chat_sessions'),
    path('sessions/end/', views.end_session, name='end_session'),
    path('knowledge/', views.knowledge_base, name='knowledge_base'),
    path('campus-info/', views.campus_info, name='campus_info'),
    path('search/', views.search_knowledge, name='search_knowledge'),
    path('test-gemini/', views.test_gemini, name='test_gemini'),
    path('test-chat-gemini/', views.test_chat_gemini, name='test_chat_gemini'),
    path('simple-gemini/', views.simple_gemini_test, name='simple_gemini_test'),
    path('server-info/', views.server_info, name='server_info'),
]
