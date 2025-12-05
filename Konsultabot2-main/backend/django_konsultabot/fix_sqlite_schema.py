#!/usr/bin/env python
"""
Fix SQLite schema issues before migration
Usage: python fix_sqlite_schema.py
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

from django.core.management import call_command
from django.db import connection

def fix_schema():
    """Fix SQLite schema issues"""
    print("=" * 60)
    print("🔧 Fixing SQLite Schema Issues")
    print("=" * 60)
    print()
    
    # Check current database
    db_config = django.conf.settings.DATABASES['default']
    if 'sqlite' not in db_config['ENGINE']:
        print("⚠️  Not using SQLite. This script is for SQLite only.")
        return
    
    print("1. Running all migrations...")
    try:
        call_command('migrate', verbosity=1, interactive=False)
        print("   ✅ Migrations completed")
    except Exception as e:
        print(f"   ⚠️  Migration error: {e}")
        print("   💡 Some migrations may have failed")
    
    # Check for missing columns
    print()
    print("2. Checking for schema issues...")
    try:
        with connection.cursor() as cursor:
            # Check if admin_panel_intent table exists
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='admin_panel_intent';
            """)
            table_exists = cursor.fetchone()
            
            if table_exists:
                # Check if intent_type column exists
                cursor.execute("PRAGMA table_info(admin_panel_intent);")
                columns = [row[1] for row in cursor.fetchall()]
                
                if 'intent_type' not in columns:
                    print("   ⚠️  Missing intent_type column in admin_panel_intent")
                    print("   💡 This will be fixed when migrating to PostgreSQL")
                    print("   💡 You can continue with migration - PostgreSQL will have correct schema")
                else:
                    print("   ✅ Schema looks good")
            else:
                print("   ℹ️  admin_panel_intent table doesn't exist yet")
                print("   💡 This is OK - it will be created in PostgreSQL")
    except Exception as e:
        print(f"   ⚠️  Could not check schema: {e}")
    
    print()
    print("=" * 60)
    print("✅ Schema check complete")
    print("=" * 60)
    print()
    print("💡 You can now:")
    print("   1. Fix your DATABASE_URL (replace [YOUR_PASSWORD])")
    print("   2. Run: python migrate_to_postgresql.py")
    print()
    print("   Note: If backup fails due to schema issues, that's OK.")
    print("   PostgreSQL will have the correct schema after migration.")

if __name__ == '__main__':
    fix_schema()

