# Quick Start Guide - Admin Panel

## 🚀 Get Started in 5 Minutes

### Step 1: Run Backend Migrations

```bash
cd backend/django_konsultabot
python manage.py migrate admin_panel
```

### Step 2: Start Django Backend

```bash
# In backend/django_konsultabot directory
python manage.py runserver
```

Backend will run on: `http://localhost:8000`

### Step 3: Setup Frontend

```bash
cd admin-panel-frontend
npm install
```

### Step 4: Configure Environment

Create `.env` file:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

### Step 5: Start React App

```bash
npm start
```

Frontend will run on: `http://localhost:3000`

### Step 6: Login

1. Open http://localhost:3000
2. Login with admin credentials
3. User must have `role='admin'` or `is_staff=True` in Django

---

## 🎯 What You Can Do

- **Dashboard**: View statistics and charts
- **Users**: Manage users, view conversations, activate/deactivate
- **Knowledge Base**: Add/edit FAQs, troubleshooting guides
- **Intents & Keywords**: Configure rule-based responses
- **Tickets**: Manage support tickets, assign, resolve
- **Conversations**: View all chat logs, export to CSV
- **Notifications**: Create and send announcements
- **Settings**: Configure chatbot behavior
- **Activities**: View admin action logs

---

## 📝 Creating Your First Admin User

If you don't have an admin user:

```bash
python manage.py createsuperuser
```

Then in Django admin (`/admin/`), edit the user and set:
- Role: `admin`
- Or check: `is_staff`

---

## ✅ That's It!

You're ready to manage KonsultaBot! 🎉

