"""
Serializers for KonsultaBot user authentication and management
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information
    """
    permissions = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'department', 'student_id', 
            'phone_number', 'profile_picture', 'bio',
            'date_joined', 'last_login', 'permissions'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'permissions']
    
    def get_permissions(self, obj):
        """Get user permissions based on role"""
        return obj.get_permissions()


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Invalid credentials. Please check your username and password.',
                    code='invalid_credentials'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.',
                    code='account_disabled'
                )
            
            data['user'] = user
            return data
        else:
            raise serializers.ValidationError(
                'Both username and password are required.',
                code='missing_credentials'
            )


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'department', 'student_id',
            'phone_number'
        ]
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError(
                "Passwords don't match.",
                code='password_mismatch'
            )
        return data
    
    def create(self, validated_data):
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm', None)
        
        # Create user with default role 'student'
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            department=validated_data.get('department', ''),
            student_id=validated_data.get('student_id', ''),
            phone_number=validated_data.get('phone_number', ''),
            role='student'  # Default role for new registrations
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password
    """
    old_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                'Current password is incorrect.',
                code='invalid_password'
            )
        return value
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError(
                "New passwords don't match.",
                code='password_mismatch'
            )
        return data
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for admin user management
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'department', 'student_id',
            'phone_number', 'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']
    
    def validate_role(self, value):
        # Only admin can assign admin role
        request_user = self.context['request'].user
        if value == 'admin' and not request_user.is_admin:
            raise serializers.ValidationError(
                'Only administrators can assign admin role.',
                code='permission_denied'
            )
        return value


class UserStatsSerializer(serializers.Serializer):
    """
    Serializer for user statistics
    """
    total_users = serializers.IntegerField()
    admin_count = serializers.IntegerField()
    it_staff_count = serializers.IntegerField()
    student_count = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
