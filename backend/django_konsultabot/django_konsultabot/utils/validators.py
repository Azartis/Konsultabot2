"""
Input Validation and Sanitization Utilities
"""
import re
from typing import Any, Dict, List, Optional
from django.core.exceptions import ValidationError
from rest_framework import serializers

def sanitize_input(value: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize user input by removing potentially dangerous characters
    """
    if not isinstance(value, str):
        return value
    
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Trim whitespace
    value = value.strip()
    
    # Limit length if specified
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value

def validate_input(
    data: Dict[str, Any],
    required_fields: List[str],
    field_validators: Optional[Dict[str, callable]] = None
) -> Dict[str, Any]:
    """
    Validate input data with required fields and custom validators
    
    Args:
        data: Input data dictionary
        required_fields: List of required field names
        field_validators: Dictionary mapping field names to validator functions
    
    Returns:
        Validated and sanitized data dictionary
    
    Raises:
        ValidationError: If validation fails
    """
    field_validators = field_validators or {}
    validated_data = {}
    
    # Check required fields
    for field in required_fields:
        if field not in data or not data[field]:
            raise ValidationError(f"Field '{field}' is required")
        validated_data[field] = data[field]
    
    # Apply custom validators
    for field, validator in field_validators.items():
        if field in data:
            try:
                validated_data[field] = validator(data[field])
            except Exception as e:
                raise ValidationError(f"Validation failed for '{field}': {str(e)}")
    
    # Sanitize string fields
    for key, value in validated_data.items():
        if isinstance(value, str):
            validated_data[key] = sanitize_input(value)
    
    return validated_data

def validate_email(email: str) -> str:
    """Validate email format"""
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        raise ValidationError("Invalid email format")
    return email.lower()

def validate_username(username: str) -> str:
    """Validate username format"""
    if not username:
        raise ValidationError("Username cannot be empty")
    if len(username) < 3:
        raise ValidationError("Username must be at least 3 characters")
    if len(username) > 30:
        raise ValidationError("Username must be less than 30 characters")
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValidationError("Username can only contain letters, numbers, and underscores")
    return username

def validate_password_strength(password: str) -> str:
    """Validate password strength"""
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters")
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least one number")
    return password

def validate_sql_injection_safe(value: str) -> str:
    """
    Basic check for SQL injection patterns
    Note: Django ORM already protects against SQL injection,
    but this provides an additional layer for raw queries
    """
    dangerous_patterns = [
        r'(\bUNION\b.*\bSELECT\b)',
        r'(\bDROP\b.*\bTABLE\b)',
        r'(\bDELETE\b.*\bFROM\b)',
        r'(\bINSERT\b.*\bINTO\b)',
        r'(\bUPDATE\b.*\bSET\b)',
        r'(\bEXEC\b|\bEXECUTE\b)',
        r'(\bSCRIPT\b)',
        r'(;\s*--)',
        r'(/\*.*\*/)',
    ]
    
    value_upper = value.upper()
    for pattern in dangerous_patterns:
        if re.search(pattern, value_upper, re.IGNORECASE):
            raise ValidationError("Invalid input detected")
    
    return value

