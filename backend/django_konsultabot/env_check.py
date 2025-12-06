"""
Environment Variable Validation for KonsultaBot Backend
Validates required environment variables before Django startup
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(str(env_path))
else:
    # Try parent directory
    parent_env = BASE_DIR.parent / '.env'
    if parent_env.exists():
        load_dotenv(str(parent_env))

# Required environment variables
REQUIRED_VARS = {
    'DJANGO_SECRET_KEY': {
        'required': True,
        'description': 'Django secret key for cryptographic signing',
        'default': None,
        'validate': lambda x: len(x) >= 50 if x else False,
    },
    'APP_ENV': {
        'required': True,
        'description': 'Application environment (development, staging, production)',
        'default': 'development',
        'validate': lambda x: x in ['development', 'staging', 'production'],
    },
}

# Optional but recommended
RECOMMENDED_VARS = {
    'DATABASE_URL': {
        'description': 'Database connection URL',
        'fallback': 'sqlite:///konsultabot_advanced.db',
    },
    'GEMINI_API_KEY': {
        'description': 'Google Gemini API key for AI features',
        'fallback': None,
    },
}

def validate_environment():
    """
    Validate environment variables and abort if critical ones are missing
    """
    errors = []
    warnings = []
    
    # Check required variables
    for var_name, config in REQUIRED_VARS.items():
        value = os.getenv(var_name, config.get('default'))
        
        if config['required'] and not value:
            errors.append(f"❌ {var_name}: {config['description']} (REQUIRED)")
        elif value and config.get('validate'):
            if not config['validate'](value):
                errors.append(f"❌ {var_name}: Invalid value (validation failed)")
        elif value:
            # Check if using default in production
            if os.getenv('APP_ENV') == 'production' and config.get('default') == value:
                warnings.append(f"⚠️  {var_name}: Using default value in production (not recommended)")
    
    # Check recommended variables
    for var_name, config in RECOMMENDED_VARS.items():
        value = os.getenv(var_name)
        if not value:
            if config.get('fallback'):
                warnings.append(f"⚠️  {var_name}: Not set, using fallback: {config['fallback']}")
            else:
                warnings.append(f"⚠️  {var_name}: Not set - {config['description']}")
    
    # Special checks
    secret_key = os.getenv('DJANGO_SECRET_KEY', '')
    if secret_key and secret_key == 'django-insecure-konsultabot-dev-key-change-in-production':
        if os.getenv('APP_ENV') == 'production':
            errors.append("❌ DJANGO_SECRET_KEY: Using insecure default key in production!")
        else:
            warnings.append("⚠️  DJANGO_SECRET_KEY: Using insecure default key (change for production)")
    
    debug = os.getenv('DEBUG', 'True').lower()
    if debug == 'true' and os.getenv('APP_ENV') == 'production':
        warnings.append("⚠️  DEBUG: Enabled in production (security risk)")
    
    # Database URL validation
    database_url = os.getenv('DATABASE_URL', '')
    if database_url and '[YOUR_PASSWORD]' in database_url:
        errors.append("❌ DATABASE_URL: Contains placeholder [YOUR_PASSWORD] - replace with actual password")
    
    # Print results
    if errors:
        print("\n" + "="*60)
        print("❌ ENVIRONMENT VALIDATION FAILED")
        print("="*60)
        for error in errors:
            print(error)
        print("\n💡 Fix the errors above before starting the server.")
        print("="*60 + "\n")
        return False
    
    if warnings:
        print("\n" + "="*60)
        print("⚠️  ENVIRONMENT WARNINGS")
        print("="*60)
        for warning in warnings:
            print(warning)
        print("\n💡 Review warnings above for production deployment.")
        print("="*60 + "\n")
    
    return True

def get_env_summary():
    """Get a summary of environment configuration"""
    app_env = os.getenv('APP_ENV', 'development')
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    has_db_url = bool(os.getenv('DATABASE_URL'))
    has_gemini = bool(os.getenv('GEMINI_API_KEY'))
    
    return {
        'environment': app_env,
        'debug': debug,
        'has_database_url': has_db_url,
        'has_gemini_key': has_gemini,
    }

if __name__ == '__main__':
    # Run validation when called directly
    if not validate_environment():
        sys.exit(1)
    else:
        print("✅ Environment validation passed")
        summary = get_env_summary()
        print(f"   Environment: {summary['environment']}")
        print(f"   Debug: {summary['debug']}")
        print(f"   Database: {'Configured' if summary['has_database_url'] else 'Using SQLite'}")
        print(f"   Gemini API: {'Configured' if summary['has_gemini_key'] else 'Not configured'}")

