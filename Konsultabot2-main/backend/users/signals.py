"""
Handle user profile creation signal
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile when a new user is created"""
    if created:
        UserProfile.objects.create(user=instance)
