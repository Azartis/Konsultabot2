"""
URL configuration for KonsultaBot user authentication
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'user_account'

urlpatterns = [
    # Authentication endpoints
    path('login/', views.LoginView.as_view(), name='login'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # JWT token endpoints
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # User management (admin only)
    path('users/', views.UserManagementView.as_view(), name='user_list'),
    path('users/<int:user_id>/', views.UserManagementView.as_view(), name='user_detail'),
    path('users/stats/', views.UserStatsView.as_view(), name='user_stats'),
    
    # Utility endpoints
    path('permissions/', views.check_permissions, name='check_permissions'),
    path('check-username/', views.check_username_availability, name='check_username'),
]
