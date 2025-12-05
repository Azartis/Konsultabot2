"""
Django admin configuration for KonsultaBot user management
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for User model
    """
    list_display = [
        'username', 'email', 'first_name', 'last_name', 
        'role_badge', 'department', 'is_active', 'date_joined'
    ]
    list_filter = ['role', 'is_active', 'is_staff', 'department', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    ordering = ['-date_joined']
    
    # Custom fieldsets for the edit form
    fieldsets = BaseUserAdmin.fieldsets + (
        ('KonsultaBot Profile', {
            'fields': (
                'role', 'department', 'student_id', 'phone_number',
                'profile_picture', 'bio'
            )
        }),
        ('Login Information', {
            'fields': ('last_login_ip',),
            'classes': ('collapse',)
        }),
    )
    
    # Fields to show when adding a new user
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('KonsultaBot Profile', {
            'fields': (
                'role', 'department', 'student_id', 'phone_number',
                'email', 'first_name', 'last_name'
            )
        }),
    )
    
    def role_badge(self, obj):
        """Display role as a colored badge"""
        colors = {
            'admin': '#dc3545',      # Red
            'it_staff': '#28a745',   # Green
            'student': '#007bff'     # Blue
        }
        color = colors.get(obj.role, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_role_display()
        )
    role_badge.short_description = 'Role'
    role_badge.admin_order_field = 'role'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related()
    
    def save_model(self, request, obj, form, change):
        """Custom save logic"""
        if not change:  # Creating new user
            # Set default role if not specified
            if not obj.role:
                obj.role = 'student'
        
        super().save_model(request, obj, form, change)
    
    actions = ['make_active', 'make_inactive', 'promote_to_staff', 'demote_to_student']
    
    def make_active(self, request, queryset):
        """Activate selected users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users were successfully activated.')
    make_active.short_description = 'Activate selected users'
    
    def make_inactive(self, request, queryset):
        """Deactivate selected users"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users were successfully deactivated.')
    make_inactive.short_description = 'Deactivate selected users'
    
    def promote_to_staff(self, request, queryset):
        """Promote selected users to IT staff"""
        updated = queryset.update(role='it_staff')
        self.message_user(request, f'{updated} users were promoted to IT staff.')
    promote_to_staff.short_description = 'Promote to IT staff'
    
    def demote_to_student(self, request, queryset):
        """Demote selected users to student"""
        updated = queryset.update(role='student')
        self.message_user(request, f'{updated} users were demoted to student.')
    demote_to_student.short_description = 'Demote to student'
