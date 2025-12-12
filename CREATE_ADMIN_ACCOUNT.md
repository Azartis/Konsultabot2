# Create Admin Account for Admin Panel

## Quick Method: Using Management Command

### Option 1: Interactive (Recommended)

```bash
cd backend/django_konsultabot
python manage.py create_admin
```

This will prompt you for:
- Username (default: `admin`)
- Email (default: `admin@evsu.edu.ph`)
- Password (will prompt securely)
- First Name (default: `Admin`)
- Last Name (default: `User`)
- Department (default: `IT Department`)

### Option 2: With Arguments

```bash
python manage.py create_admin \
    --username admin \
    --email admin@evsu.edu.ph \
    --password your_secure_password \
    --first-name "System" \
    --last-name "Administrator" \
    --department "IT Department"
```

### Option 3: Create as Django Superuser

```bash
python manage.py create_admin \
    --username admin \
    --email admin@evsu.edu.ph \
    --password admin123 \
    --superuser
```

### Option 4: Overwrite Existing User

If the username already exists, use `--force`:

```bash
python manage.py create_admin \
    --username admin \
    --email newemail@evsu.edu.ph \
    --password newpassword \
    --force
```

---

## Alternative Methods

### Method 1: Using Django Admin Interface

1. Start Django server:
   ```bash
   cd backend/django_konsultabot
   python manage.py runserver
   ```

2. Open Django Admin: http://localhost:8000/admin

3. Login with superuser (or create one with `python manage.py createsuperuser`)

4. Go to **Users** → **Add User**

5. Fill in:
   - Username
   - Email
   - Password (set twice)
   - Check: **Staff status**
   - Check: **Active**
   - Role: **Administrator**

6. Save

### Method 2: Using Django Shell

```bash
cd backend/django_konsultabot
python manage.py shell
```

Then run:
```python
from user_account.models import User

# Create admin user
admin = User.objects.create_user(
    username='admin',
    email='admin@evsu.edu.ph',
    password='your_password_here',
    first_name='Admin',
    last_name='User',
    role='admin',
    department='IT Department',
    is_staff=True,
    is_active=True
)

print(f"Admin user created: {admin.username}")
```

### Method 3: Using Python Script

Create a file `create_admin_script.py`:

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_konsultabot.settings')
django.setup()

from user_account.models import User

# Create admin user
admin = User.objects.create_user(
    username='admin',
    email='admin@evsu.edu.ph',
    password='admin123',
    first_name='Admin',
    last_name='User',
    role='admin',
    department='IT Department',
    is_staff=True,
    is_active=True
)

print(f"✅ Admin user created: {admin.username}")
print(f"   Email: {admin.email}")
print(f"   Role: {admin.role}")
```

Run it:
```bash
cd backend/django_konsultabot
python create_admin_script.py
```

---

## Login to Admin Panel

After creating the admin account:

1. Start the React frontend:
   ```bash
   cd admin-panel-frontend
   npm start
   ```

2. Open: http://localhost:3000/login

3. Login with:
   - **Email**: The email you set (e.g., `admin@evsu.edu.ph`)
   - **Password**: The password you set

---

## Requirements for Admin Access

For a user to access the Admin Panel, they must have:

- ✅ `role='admin'` OR `is_staff=True`
- ✅ `is_active=True`

The management command automatically sets these fields.

---

## Example: Quick Setup

```bash
# Navigate to Django directory
cd backend/django_konsultabot

# Create admin user with defaults
python manage.py create_admin --username admin --password admin123

# Start Django server
python manage.py runserver

# In another terminal, start React frontend
cd ../../admin-panel-frontend
npm start

# Login at http://localhost:3000/login
# Email: admin@evsu.edu.ph
# Password: admin123
```

---

## Troubleshooting

### "User already exists"
Use `--force` flag to update existing user:
```bash
python manage.py create_admin --username admin --password newpassword --force
```

### "Cannot access admin panel"
Check:
- User has `role='admin'` or `is_staff=True`
- User has `is_active=True`
- Django backend is running on port 8000
- React frontend is running on port 3000

### "Authentication failed"
- Verify password is correct
- Check if user is active: `User.objects.get(username='admin').is_active`
- Check if user has admin role: `User.objects.get(username='admin').role`

---

**Created by**: Admin Panel Setup Script
**Last Updated**: Admin Account Creation Command

