from django.apps import AppConfig


class UserAccountConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user_account'

    def ready(self):
        # Bootstrap default login user so that Expo/mobile builds always have valid credentials.
        from .bootstrap import ensure_default_login_user  # pylint: disable=import-outside-toplevel

        ensure_default_login_user()
