# 👥 How to View Registered Users in KonsultaBot

## Method 1: Django Admin Panel (Easiest) ⭐

### Step 1: Access Admin Panel
1. Make sure your Django server is running:
   ```bash
   cd backend/django_konsultabot
   python manage.py runserver
   ```

2. Open your browser and go to:
   ```
   http://localhost:8000/admin/
   ```
   Or if using ngrok:
   ```
   https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/admin/
   ```

### Step 2: Login to Admin
- If you haven't created a superuser yet, create one:
  ```bash
  python manage.py createsuperuser
  ```
  Follow the prompts to create an admin account.

- Login with your superuser credentials

### Step 3: View Users
- Click on **"Users"** in the admin panel
- You'll see all registered users with:
  - Username
  - Email
  - First Name / Last Name
  - Role (with colored badges)
  - Department
  - Active Status
  - Date Joined

### Features Available:
- ✅ Search users by username, email, name, or student ID
- ✅ Filter by role, active status, department
- ✅ Edit user details
- ✅ Activate/Deactivate users
- ✅ Promote/Demote users
- ✅ View user profiles

---

## Method 2: Django Shell (Command Line)

### Access Django Shell:
```bash
cd backend/django_konsultabot
python manage.py shell
```

### View All Users:
```python
from django.contrib.auth import get_user_model
User = get_user_model()

# Get all users
users = User.objects.all()
for user in users:
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Name: {user.first_name} {user.last_name}")
    print(f"Role: {user.role}")
    print(f"Active: {user.is_active}")
    print(f"Date Joined: {user.date_joined}")
    print("-" * 40)

# Count total users
print(f"\nTotal Users: {User.objects.count()}")

# Get active users only
active_users = User.objects.filter(is_active=True)
print(f"Active Users: {active_users.count()}")

# Get users by role
students = User.objects.filter(role='student')
print(f"Students: {students.count()}")

# Get recent registrations (last 10)
recent = User.objects.order_by('-date_joined')[:10]
for user in recent:
    print(f"{user.username} - {user.date_joined}")
```

---

## Method 3: Direct Database Access (SQLite)

### Find Database Location:
The database file is located at:
```
backend/django_konsultabot/konsultabot_advanced.db
```

### Option A: Using DB Browser for SQLite (GUI)
1. Download DB Browser for SQLite: https://sqlitebrowser.org/
2. Open the database file: `konsultabot_advanced.db`
3. Go to **Browse Data** tab
4. Select table: `user_account_user`
5. View all user records

### Option B: Using SQLite Command Line
```bash
cd backend/django_konsultabot
sqlite3 konsultabot_advanced.db

# View all users
SELECT id, username, email, first_name, last_name, role, is_active, date_joined 
FROM user_account_user;

# Count users
SELECT COUNT(*) FROM user_account_user;

# View specific user
SELECT * FROM user_account_user WHERE username = 'your_username';

# Exit
.quit
```

---

## Method 4: API Endpoint (Programmatic Access)

### Get Users via API:
```bash
# Get all users (requires admin authentication)
curl -X GET "http://localhost:8000/api/v1/admin/api/users/" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Using Python:
```python
import requests

url = "http://localhost:8000/api/v1/admin/api/users/"
headers = {
    "Authorization": "Bearer YOUR_ADMIN_TOKEN"
}

response = requests.get(url, headers=headers)
users = response.json()
print(users)
```

---

## Method 5: Create a Management Command

Create a custom command to list users:

```bash
# Create command file
mkdir -p backend/django_konsultabot/user_account/management/commands
touch backend/django_konsultabot/user_account/management/commands/list_users.py
```

Then add this code to `list_users.py`:

```python
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'List all registered users'

    def handle(self, *args, **options):
        users = User.objects.all().order_by('-date_joined')
        
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"Total Users: {users.count()}")
        self.stdout.write(f"{'='*60}\n")
        
        for user in users:
            self.stdout.write(f"Username: {user.username}")
            self.stdout.write(f"Email: {user.email}")
            self.stdout.write(f"Name: {user.get_full_name()}")
            self.stdout.write(f"Role: {user.get_role_display()}")
            self.stdout.write(f"Active: {'Yes' if user.is_active else 'No'}")
            self.stdout.write(f"Date Joined: {user.date_joined}")
            self.stdout.write("-" * 60)
```

Run it:
```bash
python manage.py list_users
```

---

## Quick Reference

### Database File Location:
- **SQLite**: `backend/django_konsultabot/konsultabot_advanced.db`
- **PostgreSQL**: Check your `DATABASE_URL` in `.env` file

### Admin URL:
- **Local**: `http://localhost:8000/admin/`
- **Ngrok**: `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/admin/`

### User Model:
- **App**: `user_account`
- **Model**: `User`
- **Table**: `user_account_user`

### Create Superuser:
```bash
cd backend/django_konsultabot
python manage.py createsuperuser
```

---

## Troubleshooting

### "No such table: user_account_user"
Run migrations:
```bash
python manage.py migrate
```

### "Admin panel shows no users"
Check if users exist:
```bash
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.count()
```

### "Can't access admin panel"
1. Make sure server is running: `python manage.py runserver`
2. Check if superuser exists: `python manage.py createsuperuser`
3. Verify admin is enabled in `urls.py`

