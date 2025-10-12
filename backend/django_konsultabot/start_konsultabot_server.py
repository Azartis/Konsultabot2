#!/usr/bin/env python
"""
KonsultaBot Advanced AI Platform - Server Startup Script
Comprehensive server initialization with health checks and monitoring
"""
import os
import sys
import subprocess
import time
import requests
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_konsultabot.settings')

def print_banner():
    """Print startup banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║    🤖 KonsultaBot Advanced AI Platform                       ║
    ║    Intelligent IT Support Assistant for EVSU Dulag Campus   ║
    ║                                                              ║
    ║    Features:                                                 ║
    ║    • 🎙️  Voice-enabled multilingual chat                    ║
    ║    • 🧠 Hybrid Gemini + Knowledge Base AI                   ║
    ║    • 📴 Comprehensive offline functionality                  ║
    ║    • 📊 Real-time analytics dashboard                       ║
    ║    • 🌐 Multi-language support (EN/TL/Bisaya/Waray)        ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_requirements():
    """Check if all required packages are installed"""
    print("🔍 Checking requirements...")
    
    required_packages = [
        'django', 'djangorestframework', 'django-cors-headers',
        'google-generativeai', 'requests', 'python-dotenv'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"  ✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"  ❌ {package} - MISSING")
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("📦 Installing missing packages...")
        
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install'
            ] + missing_packages)
            print("✅ All packages installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install packages. Please install manually:")
            print(f"   pip install {' '.join(missing_packages)}")
            return False
    
    return True

def check_environment():
    """Check environment configuration"""
    print("\n🔧 Checking environment configuration...")
    
    env_file = project_dir / '.env'
    env_example = project_dir / 'env_example.txt'
    
    if not env_file.exists():
        print("⚠️  .env file not found!")
        if env_example.exists():
            print("📋 Creating .env from example...")
            try:
                with open(env_example, 'r') as src, open(env_file, 'w') as dst:
                    dst.write(src.read())
                print("✅ .env file created. Please edit it with your actual values.")
            except Exception as e:
                print(f"❌ Failed to create .env file: {e}")
                return False
        else:
            print("❌ No env_example.txt found. Please create .env manually.")
            return False
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print("✅ Environment variables loaded")
    except Exception as e:
        print(f"⚠️  Warning: Could not load .env file: {e}")
    
    # Check critical environment variables
    critical_vars = ['DJANGO_SECRET_KEY']
    missing_vars = []
    
    for var in critical_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing critical environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file")
    
    return True

def setup_database():
    """Setup and migrate database"""
    print("\n🗄️  Setting up database...")
    
    try:
        # Import Django and setup
        import django
        django.setup()
        
        from django.core.management import execute_from_command_line
        
        # Run migrations
        print("  📝 Running database migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        # Create superuser if needed
        from django.contrib.auth.models import User
        if not User.objects.filter(is_superuser=True).exists():
            print("  👤 Creating admin user...")
            print("     Username: admin")
            print("     Password: admin123")
            print("     ⚠️  Please change this password in production!")
            
            User.objects.create_superuser(
                username='admin',
                email='admin@evsu.edu.ph',
                password='admin123'
            )
        
        print("✅ Database setup complete!")
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def collect_static():
    """Collect static files"""
    print("\n📁 Collecting static files...")
    
    try:
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
        print("✅ Static files collected!")
        return True
    except Exception as e:
        print(f"⚠️  Static files collection failed: {e}")
        return True  # Non-critical error

def test_ai_services():
    """Test AI services availability"""
    print("\n🧠 Testing AI services...")
    
    try:
        # Test Gemini API
        google_api_key = os.getenv('GOOGLE_API_KEY')
        if google_api_key:
            print("  🔍 Testing Gemini API...")
            try:
                import google.generativeai as genai
                genai.configure(api_key=google_api_key)
                
                # Try to list models to test API access
                models = list(genai.list_models())
                if models:
                    print("  ✅ Gemini API accessible")
                else:
                    print("  ⚠️  Gemini API key valid but no models available")
            except Exception as e:
                print(f"  ❌ Gemini API test failed: {e}")
                print("  📝 Will use intelligent local responses as fallback")
        else:
            print("  ⚠️  No Gemini API key found - using local responses only")
        
        # Test knowledge base
        print("  📚 Testing knowledge base...")
        try:
            from knowledgebase.utils import knowledge_base_processor
            stats = knowledge_base_processor.get_statistics()
            print(f"  ✅ Knowledge base ready ({stats['total_categories']} categories)")
        except Exception as e:
            print(f"  ❌ Knowledge base test failed: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI services test failed: {e}")
        return True  # Non-critical for startup

def start_server():
    """Start the Django development server"""
    print("\n🚀 Starting KonsultaBot server...")
    
    try:
        from django.core.management import execute_from_command_line
        
        # Get host and port from environment or use defaults
        host = os.getenv('DJANGO_HOST', '0.0.0.0')
        port = os.getenv('DJANGO_PORT', '8000')
        
        print(f"🌐 Server will be available at:")
        print(f"   • Local: http://localhost:{port}")
        print(f"   • Network: http://{host}:{port}")
        print(f"   • Admin: http://localhost:{port}/admin")
        print(f"   • Dashboard: http://localhost:{port}/dashboard")
        print(f"   • API: http://localhost:{port}/api/v1/chat")
        print()
        print("📱 For React Native development, use:")
        print(f"   API_BASE_URL = 'http://192.168.1.17:{port}/api/v1/chat'")
        print()
        print("🛑 Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Start server
        execute_from_command_line(['manage.py', 'runserver', f'{host}:{port}'])
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server startup failed: {e}")
        return False
    
    return True

def health_check():
    """Perform a health check on the running server"""
    print("\n🏥 Performing health check...")
    
    try:
        # Wait a moment for server to start
        time.sleep(2)
        
        # Test health endpoint
        response = requests.get('http://localhost:8000/api/v1/chat/health/', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Server health check passed!")
            print(f"   Database: {'✅' if data.get('database', {}).get('connected') else '❌'}")
            print(f"   Network: {'✅' if data.get('network', {}).get('connected') else '❌'}")
            print(f"   Gemini: {'✅' if data.get('ai_services', {}).get('gemini_available') else '❌'}")
            return True
        else:
            print(f"⚠️  Health check returned status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Health check failed: {e}")
        return False

def main():
    """Main startup function"""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Requirements check failed. Please install missing packages.")
        return False
    
    # Check environment
    if not check_environment():
        print("\n❌ Environment check failed. Please configure .env file.")
        return False
    
    # Setup database
    if not setup_database():
        print("\n❌ Database setup failed.")
        return False
    
    # Collect static files
    collect_static()
    
    # Test AI services
    test_ai_services()
    
    print("\n" + "=" * 60)
    print("🎉 KonsultaBot Advanced AI Platform is ready!")
    print("=" * 60)
    
    # Start server
    return start_server()

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)
