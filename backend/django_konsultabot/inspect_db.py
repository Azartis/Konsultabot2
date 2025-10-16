import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_konsultabot.settings')
django.setup()

from chatbot_core.models import ChatMessage
from django.db import connection

def inspect_db():
    # Get the table schema
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT sql 
            FROM sqlite_master 
            WHERE type='table' 
            AND name='chatbot_core_chatmessage';
        """)
        schema = cursor.fetchone()
        print("Schema:", schema[0] if schema else None)

    # Check model fields
    print("\nModel fields:", [f.name for f in ChatMessage._meta.get_fields()])

    # Try to get a message
    message = ChatMessage.objects.first()
    if message:
        print("\nMessage fields:", vars(message))

if __name__ == '__main__':
    inspect_db()