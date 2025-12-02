#!/usr/bin/env python
"""
Test database connection script
Usage: python test_database_connection.py
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_konsultabot.settings')
django.setup()

from django.db import connections
from django.conf import settings

def test_connection():
    """Test database connection"""
    print("=" * 60)
    print("🔌 Testing Database Connection")
    print("=" * 60)
    print()
    
    db_config = settings.DATABASES['default']
    engine = db_config['ENGINE']
    
    print(f"Database Engine: {engine}")
    
    if 'postgresql' in engine:
        print("✅ Using PostgreSQL")
        print(f"   Host: {db_config.get('HOST', 'N/A')}")
        print(f"   Port: {db_config.get('PORT', 'N/A')}")
        print(f"   Name: {db_config.get('NAME', 'N/A')}")
        print(f"   User: {db_config.get('USER', 'N/A')}")
    else:
        print("✅ Using SQLite")
        print(f"   File: {db_config.get('NAME', 'N/A')}")
    
    print()
    print("Testing connection...")
    
    try:
        db_conn = connections['default']
        db_conn.ensure_connection()
        print("✅ Connection successful!")
        
        # Test query (only for PostgreSQL)
        if 'postgresql' in engine:
            with db_conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                if version:
                    print(f"✅ Database version: {version[0][:50]}...")
        
        # Check tables
        print()
        print("Checking tables...")
        with db_conn.cursor() as cursor:
            if 'postgresql' in engine:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """)
            else:
                cursor.execute("""
                    SELECT name 
                    FROM sqlite_master 
                    WHERE type='table'
                    ORDER BY name;
                """)
            tables = cursor.fetchall()
            print(f"✅ Found {len(tables)} tables")
            if tables:
                print("   Sample tables:", ", ".join([t[0] for t in tables[:5]]))
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print()
        print("💡 Troubleshooting:")
        print("   1. Check DATABASE_URL in .env file")
        print("   2. Verify database credentials")
        print("   3. Ensure database allows external connections")
        print("   4. Check firewall settings")
        return False

if __name__ == '__main__':
    success = test_connection()
    sys.exit(0 if success else 1)

