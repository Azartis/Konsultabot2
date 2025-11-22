import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError

logger = logging.getLogger('konsultabot.auth')


def ensure_default_login_user():
    """
    Make sure a default login user exists for mobile testing/offline mode.
    The credentials come from settings.DEFAULT_LOGIN_USER / environment vars.
    """
    default_user = getattr(settings, 'DEFAULT_LOGIN_USER', None)
    if not default_user:
        return

    username = (default_user.get('username') or '').strip()
    password = default_user.get('password')

    if not username or not password:
        logger.debug('DEFAULT_LOGIN_USER is missing username or password. Skipping bootstrap user creation.')
        return

    User = get_user_model()

    try:
        user = (
            User.objects.filter(username__iexact=username).first()
            or User.objects.filter(email__iexact=default_user.get('email', '')).first()
        )

        if user:
            _update_user_if_needed(user, default_user, password)
        else:
            _create_default_user(User, default_user, password)
    except (OperationalError, ProgrammingError) as db_error:
        # Happens during migrations or when DB is not ready yet.
        logger.debug('Skipping default login user bootstrap (database not ready): %s', db_error)


def _update_user_if_needed(user, default_user, password):
    updated = False

    # Update profile fields if necessary
    fields_to_sync = ['email', 'first_name', 'last_name', 'role', 'department', 'student_id']
    for field in fields_to_sync:
        new_value = default_user.get(field)
        if new_value and getattr(user, field, None) != new_value:
            setattr(user, field, new_value)
            updated = True

    if not user.check_password(password):
        user.set_password(password)
        updated = True

    if not user.is_active:
        user.is_active = True
        updated = True

    if updated:
        user.save()
        logger.info('Default login user updated (%s)', user.username)


def _create_default_user(User, default_user, password):
    user = User.objects.create_user(
        username=default_user.get('username'),
        email=default_user.get('email') or default_user.get('username'),
        password=password,
        first_name=default_user.get('first_name', ''),
        last_name=default_user.get('last_name', ''),
        role=default_user.get('role', 'student'),
        department=default_user.get('department', ''),
        student_id=default_user.get('student_id', '')
    )
    logger.info('Default login user created (%s)', user.username)

