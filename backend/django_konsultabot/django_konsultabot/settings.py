"""
Django settings for KonsultaBot Advanced AI Platform
"""

import os
import json
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from parent directory's .env
env_path = BASE_DIR.parent / '.env'
if env_path.exists():
    load_dotenv(str(env_path))

# KonsultaBot Settings
KONSULTABOT_SETTINGS = {
    'OFFLINE_MODE': os.getenv('KONSULTABOT_OFFLINE_MODE', 'false').lower() == 'true',
    'ENABLE_VOICE': os.getenv('KONSULTABOT_ENABLE_VOICE', 'true').lower() == 'true',
    'GOOGLE_API_KEY': os.getenv('GOOGLE_API_KEY', 'AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U'),
    'AI_MODEL': os.getenv('KONSULTABOT_AI_MODEL', 'gemini-1.5-flash'),
    'SESSION_TIMEOUT_MINUTES': 30,
    'GEMINI_CONFIG': {
        'HISTORY_ENABLED': True,
        'MAX_OUTPUT_TOKENS': 2048,
        'TEMPERATURE': 0.7,
        'TOP_P': 0.8,
        'TOP_K': 40,
        'CANDIDATE_COUNT': 1,
    }
}

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-konsultabot-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# Load Google API Key (for backward compatibility)
GOOGLE_API_KEY = KONSULTABOT_SETTINGS['GOOGLE_API_KEY']

# In development, allow all hosts. In production, this should be restricted.
ALLOWED_HOSTS = [
    '*',  # Allow all hosts in development
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.0.2.2',  # Android emulator
    '10.143.17.242',  # Current WiFi IP
    '10.143.17.1',
    '10.143.17.100',
    '192.168.1.17',
    '192.168.0.17',
    '192.168.100.17',
    '10.0.0.17',
    '172.20.10.2',  # Mobile hotspot
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    
    # KonsultaBot apps
    'chatbot_core',
    'knowledgebase',
    'analytics',
    'adminpanel',
    'user_account',  # RBAC system
]

# Simplified settings for development
CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins in development
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CSRF_TRUSTED_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://0.0.0.0:8000',
    'http://10.0.2.2:8000',  # Android emulator
]
USE_X_FORWARDED_HOST = False
SECURE_PROXY_SSL_HEADER = None

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {
        'chat': '100/hour',
        'voice': '50/hour',
    }
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'django_konsultabot.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_konsultabot.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'konsultabot_advanced.db',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Manila'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model for RBAC
AUTH_USER_MODEL = 'user_account.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    
    'JTI_CLAIM': 'jti',
    
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=60),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# CORS settings for React Native
CORS_ALLOWED_ORIGINS = [
    "http://localhost:19006",  # Expo web
    "http://127.0.0.1:19006",
    "http://192.168.1.17:19006",
    "http://localhost:8081",   # Expo web dev server
    "http://127.0.0.1:8081",
    "http://192.168.1.17:8081",
    "exp://192.168.1.14:8081", # Expo Go app
]

# CORS is already set above, this is redundant but kept for compatibility
# CORS_ALLOW_ALL_ORIGINS = True  # Already set above

# KonsultaBot specific settings
KONSULTABOT_SETTINGS = {
    'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY'),
    'SESSION_TIMEOUT_MINUTES': int(os.getenv('KONSULTABOT_SESSION_TIMEOUT', '30')),
    'MAX_CONVERSATION_HISTORY': int(os.getenv('KONSULTABOT_MAX_HISTORY', '10')),
    'ENABLE_VOICE_FEATURES': os.getenv('KONSULTABOT_ENABLE_VOICE', 'true').lower() == 'true',
    'ENABLE_ANALYTICS': os.getenv('KONSULTABOT_ENABLE_ANALYTICS', 'true').lower() == 'true',
    'DEFAULT_LANGUAGE': 'english',
    'SUPPORTED_LANGUAGES': ['english', 'bisaya', 'waray', 'tagalog'],
    'OFFLINE_MODE': False,  # Set to True to disable online features
    'AI_MODEL': os.getenv('KONSULTABOT_AI_MODEL', 'gemini-1.5-flash'),
    'SYSTEM_PROMPT': """
You are KonsultaBot — an AI assistant for EVSU Dulag IT students.
Be friendly, concise, and technical when needed.
Provide clear, step-by-step solutions to IT-related problems.
Focus on campus-specific solutions when relevant.
Be encouraging and supportive.
Keep responses practical and actionable.
Use simple language and numbered steps for complex procedures.
Suggest when to contact IT support for advanced issues.
Only provide IT-related assistance and academic guidance.
"""
}

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'konsultabot.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'konsultabot': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Security settings for production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_REDIRECT_EXEMPT = []
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
