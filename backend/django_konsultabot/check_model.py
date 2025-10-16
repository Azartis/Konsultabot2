import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_konsultabot.settings')
django.setup()

from chatbot_core.models import ChatMessage
from django.db import connection

def check_model():
    try:
        print("Model fields:", [f.name for f in ChatMessage._meta.get_fields()])
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT sql 
                FROM sqlite_master 
                WHERE type='table' 
                AND name='chatbot_core_chatmessage';
            """)
            table_sql = cursor.fetchone()[0]
            print("\nTable SQL:", table_sql)
            
            # Check the latest migration that was applied
            cursor.execute("""
                SELECT name, applied 
                FROM django_migrations 
                WHERE app='chatbot_core' 
                ORDER BY applied DESC 
                LIMIT 1;
            """)
            latest_migration = cursor.fetchone()
            if latest_migration:
                print("\nLatest migration:", latest_migration)
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    check_model()