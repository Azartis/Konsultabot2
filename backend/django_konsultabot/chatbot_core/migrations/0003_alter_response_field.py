from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('chatbot_core', '0002_chatmessage_response'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatmessage',
            name='response',
            field=models.TextField(blank=True, null=True),
        ),
    ]