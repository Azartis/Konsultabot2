from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model with role-based access control for KonsultaBot
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('it_staff', 'IT Staff'),
        ('student', 'Student'),
    ]

    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='student',
        help_text='User role determines access permissions'
    )
    department = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text='User department (e.g., Computer Science, IT, etc.)'
    )
    student_id = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Student ID number for students'
    )
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text='Contact phone number'
    )
    
    # Profile fields
    profile_picture = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True, max_length=500)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin'
    
    @property
    def is_it_staff(self):
        """Check if user is IT staff"""
        return self.role == 'it_staff'
    
    @property
    def is_student(self):
        """Check if user is student"""
        return self.role == 'student'
    
    @property
    def can_access_dashboard(self):
        """Check if user can access admin dashboard"""
        return self.role in ['admin', 'it_staff']
    
    @property
    def can_edit_knowledge_base(self):
        """Check if user can edit knowledge base"""
        return self.role in ['admin', 'it_staff']
    
    @property
    def can_view_analytics(self):
        """Check if user can view analytics"""
        return self.role in ['admin', 'it_staff']
    
    def get_permissions(self):
        """Get user permissions based on role"""
        permissions = {
            'admin': [
                'view_dashboard',
                'edit_knowledge_base',
                'view_analytics',
                'manage_users',
                'system_settings',
                'export_data',
                'view_all_conversations'
            ],
            'it_staff': [
                'view_dashboard',
                'edit_knowledge_base',
                'view_analytics',
                'view_conversations'
            ],
            'student': [
                'use_chatbot',
                'view_own_conversations'
            ]
        }
        return permissions.get(self.role, [])
