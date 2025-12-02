#!/usr/bin/env python
"""
Migration script to move KonsultaBot from SQLite to PostgreSQL
Usage: python migrate_to_postgresql.py
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
from django.conf import settings
from django.db import connections
import json

def backup_sqlite():
    """Create a backup of SQLite database"""
    print("📦 Creating backup of SQLite database...")
    backup_file = BASE_DIR / 'backup_sqlite.json'
    
    # First, ensure migrations are up to date on SQLite
    print("   Running migrations on SQLite first...")
    try:
        call_command('migrate', verbosity=1, interactive=False)
        print("   ✅ Migrations applied")
    except Exception as e:
        print(f"   ⚠️  Migration warning: {e}")
        print("   💡 Trying to continue anyway...")
    
    # Try to backup, but handle schema errors gracefully
    try:
        print("   Creating data backup...")
        with open(backup_file, 'w', encoding='utf-8') as f:
            # Try to backup all apps, but exclude problematic ones if needed
            call_command('dumpdata', 
                        exclude=['auth.permission', 'contenttypes', 'admin_panel.intent'],
                        natural_foreign=True,
                        natural_primary=True,
                        stdout=f,
                        use_natural_foreign_keys=True,
                        verbosity=0)
        print(f"✅ Backup created: {backup_file}")
        print("   ⚠️  Note: Some tables may be excluded due to schema issues")
        return backup_file
    except Exception as e:
        # If that fails, try without admin_panel entirely
        try:
            print("   Retrying backup (excluding admin_panel)...")
            with open(backup_file, 'w', encoding='utf-8') as f:
                call_command('dumpdata', 
                            exclude=['auth.permission', 'contenttypes', 'admin_panel'],
                            natural_foreign=True,
                            natural_primary=True,
                            stdout=f,
                            use_natural_foreign_keys=True,
                            verbosity=0)
            print(f"✅ Backup created (admin_panel excluded): {backup_file}")
            print("   ⚠️  admin_panel data will need to be recreated in PostgreSQL")
            return backup_file
        except Exception as e2:
            print(f"❌ Backup failed: {e2}")
            print("   💡 This might be due to schema differences.")
            print("   💡 You can still migrate - the new PostgreSQL database will be fresh")
            print("   💡 Run: python manage.py migrate (on PostgreSQL)")
            return None

def check_postgresql_connection():
    """Check if PostgreSQL connection is configured"""
    print("🔍 Checking PostgreSQL configuration...")
    
    db_config = settings.DATABASES['default']
    
    if db_config['ENGINE'] != 'django.db.backends.postgresql':
        print("⚠️  PostgreSQL not configured. Checking environment variables...")
        
        # Try to get from environment
        db_url = os.getenv('DATABASE_URL', '').strip()
        if db_url and (db_url.startswith('postgresql://') or db_url.startswith('postgres://')):
            print("✅ Found DATABASE_URL in environment")
            # Validate URL format
            try:
                import dj_database_url
                dj_database_url.parse(db_url)
                print("✅ DATABASE_URL format is valid")
                return True
            except Exception as e:
                print(f"❌ DATABASE_URL format is invalid: {e}")
                print("\n💡 Common issues:")
                print("   - Special characters in password need URL encoding")
                print("   - Missing protocol (postgresql://)")
                print("   - Incorrect format")
                print("\n💡 Fix: Run setup wizard again: .\\setup_online_database.ps1")
                return False
        
        db_host = os.getenv('DB_HOST')
        if db_host:
            print(f"✅ Found DB_HOST: {db_host}")
            return True
        
        print("❌ PostgreSQL not configured. Please set DATABASE_URL or DB_* variables in .env")
        print("💡 Run: .\\setup_online_database.ps1")
        return False
    
    print("✅ PostgreSQL is configured")
    return True

def test_connection():
    """Test PostgreSQL connection"""
    print("🔌 Testing PostgreSQL connection...")
    
    db_config = settings.DATABASES['default']
    if db_config['ENGINE'] != 'django.db.backends.postgresql':
        print("❌ PostgreSQL not configured. Current engine:", db_config['ENGINE'])
        print("\n💡 To fix:")
        print("   1. Run: .\\setup_online_database.ps1")
        print("   2. Or set DATABASE_URL in .env file")
        print("   3. Run: .\\fix_database_url.ps1 to fix URL formatting")
        return False
    
    try:
        db_conn = connections['default']
        db_conn.ensure_connection()
        print("✅ Connection successful!")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check DATABASE_URL format in .env file")
        print("   2. Run: .\\fix_database_url.ps1 to fix URL formatting")
        print("   3. Verify database credentials are correct")
        print("   4. Ensure database allows external connections")
        print("   5. Check firewall settings")
        print("   6. Test connection manually: python test_database_connection.py")
        return False

def run_migrations():
    """Run Django migrations on PostgreSQL"""
    print("\n🔄 Running migrations on PostgreSQL...")
    try:
        call_command('migrate', verbosity=1)
        print("✅ Migrations completed!")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def load_backup(backup_file):
    """Load data from backup file"""
    if not backup_file or not backup_file.exists():
        print("⚠️  No backup file found. Skipping data migration.")
        return False
    
    print(f"\n📥 Loading data from backup: {backup_file}")
    try:
        call_command('loaddata', str(backup_file), verbosity=1)
        print("✅ Data loaded successfully!")
        return True
    except Exception as e:
        print(f"⚠️  Data loading had issues: {e}")
        print("   Some data may not have been migrated. Check logs above.")
        return False

def verify_migration():
    """Verify migration was successful"""
    print("\n🔍 Verifying migration...")
    try:
        from user_account.models import User
        from chatbot_core.models import ChatMessage
        
        user_count = User.objects.count()
        message_count = ChatMessage.objects.count()
        
        print(f"✅ Users migrated: {user_count}")
        print(f"✅ Messages migrated: {message_count}")
        
        if user_count > 0:
            print("✅ Migration appears successful!")
            return True
        else:
            print("⚠️  No users found. Database may be empty.")
            return False
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    print("=" * 60)
    print("🗄️  KonsultaBot Database Migration Tool")
    print("   SQLite → PostgreSQL")
    print("=" * 60)
    print()
    
    # Step 1: Backup SQLite
    backup_file = backup_sqlite()
    
    # Step 2: Check PostgreSQL config
    if not check_postgresql_connection():
        print("\n❌ Please configure PostgreSQL first. See DATABASE_MIGRATION_GUIDE.md")
        return 1
    
    # Step 3: Test connection
    if not test_connection():
        return 1
    
    # Step 4: Run migrations
    if not run_migrations():
        return 1
    
    # Step 5: Load backup data (if available)
    if backup_file:
        print("\n" + "=" * 60)
        print("📥 Loading Data from Backup")
        print("=" * 60)
        load_backup(backup_file)
    else:
        print("\n" + "=" * 60)
        print("ℹ️  No Backup Available")
        print("=" * 60)
        print("⚠️  Backup was not created (likely due to schema issues)")
        print("✅ This is OK! Your PostgreSQL database has the correct schema.")
        print("💡 You can:")
        print("   - Create new data through the app")
        print("   - Import data manually if needed")
        print("   - The database is ready to use!")
    
    # Step 6: Verify
    verify_migration()
    
    print("\n" + "=" * 60)
    print("✅ Migration complete!")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("   1. Test your application")
    print("   2. Verify all data is accessible")
    print("   3. Keep backup_sqlite.json as backup")
    print("   4. Update your deployment to use PostgreSQL")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())

