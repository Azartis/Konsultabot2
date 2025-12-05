"""
Django management command to create an admin user for the Admin Panel.

Usage:
    python manage.py create_admin
    python manage.py create_admin --username admin --email admin@example.com --password admin123
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from user_account.models import User


class Command(BaseCommand):
    help = 'Create an admin user for the Admin Panel'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username for the admin account',
            default='admin'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the admin account',
            default='admin@evsu.edu.ph'
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the admin account (will prompt if not provided)',
            default=None
        )
        parser.add_argument(
            '--first-name',
            type=str,
            help='First name',
            default='Admin'
        )
        parser.add_argument(
            '--last-name',
            type=str,
            help='Last name',
            default='User'
        )
        parser.add_argument(
            '--department',
            type=str,
            help='Department',
            default='IT Department'
        )
        parser.add_argument(
            '--superuser',
            action='store_true',
            help='Create as Django superuser (is_staff=True, is_superuser=True)',
            default=False
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite existing user if username already exists',
            default=False
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        department = options['department']
        is_superuser = options['superuser']
        force = options['force']

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            if not force:
                raise CommandError(
                    f'User "{username}" already exists. Use --force to overwrite.'
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User "{username}" already exists. Updating...')
                )
                user = User.objects.get(username=username)
                user.email = email
                user.first_name = first_name
                user.last_name = last_name
                user.department = department
                user.role = 'admin'
                user.is_staff = True
                user.is_superuser = is_superuser
                user.is_active = True
                if password:
                    user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'[SUCCESS] Successfully updated admin user: {username}\n'
                        f'   Email: {email}\n'
                        f'   Role: admin\n'
                        f'   Is Staff: {user.is_staff}\n'
                        f'   Is Superuser: {user.is_superuser}'
                    )
                )
                return

        # Prompt for password if not provided
        if not password:
            import getpass
            password = getpass.getpass('Password: ')
            password_confirm = getpass.getpass('Password (again): ')
            if password != password_confirm:
                raise CommandError('Passwords do not match!')
            if len(password) < 8:
                self.stdout.write(
                    self.style.WARNING(
                        'Warning: Password is less than 8 characters. '
                        'Consider using a stronger password.'
                    )
                )

        # Create the admin user
        try:
            with transaction.atomic():
                if is_superuser:
                    # Create as Django superuser
                    user = User.objects.create_superuser(
                        username=username,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        role='admin',
                        department=department
                    )
                else:
                    # Create as regular admin user
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        role='admin',
                        department=department,
                        is_staff=True,  # Required for admin panel access
                        is_active=True
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n[SUCCESS] Successfully created admin user!\n'
                        f'\n'
                        f'   Username: {username}\n'
                        f'   Email: {email}\n'
                        f'   Name: {first_name} {last_name}\n'
                        f'   Department: {department}\n'
                        f'   Role: admin\n'
                        f'   Is Staff: {user.is_staff}\n'
                        f'   Is Superuser: {user.is_superuser}\n'
                        f'\n'
                        f'   You can now login to the Admin Panel at:\n'
                        f'   http://localhost:3000/login\n'
                    )
                )
        except Exception as e:
            raise CommandError(f'Error creating admin user: {str(e)}')

