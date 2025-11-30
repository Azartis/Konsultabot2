from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot_core', '0003_alter_response_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='sessioncontext',
            name='conversation_state',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]

