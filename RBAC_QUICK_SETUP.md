# 🔐 **KonsultaBot RBAC - Quick Setup Guide**

## 🚨 **Current Status**

The RBAC system has been created but needs to be integrated properly with your existing Django project. Here's the **quick setup** to get it working:

---

## ⚡ **Option 1: Use Your Existing Backend (Recommended)**

Since you already have a working Django backend at `konsultabot_backend`, let's integrate RBAC there:

### **Step 1: Copy RBAC Files**
```bash
# Navigate to your project
cd C:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj\backend

# Copy user_account app to existing backend
xcopy user_account konsultabot_backend\ /E /I /Y
```

### **Step 2: Update konsultabot_backend/settings.py**
Add these lines to your existing `konsultabot_backend/settings.py`:

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... existing apps ...
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'user_account',  # RBAC system
]

# Add JWT authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    # ... rest of your REST_FRAMEWORK config ...
}

# Custom user model
AUTH_USER_MODEL = 'user_account.User'

# JWT Configuration
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}
```

### **Step 3: Update konsultabot_backend/urls.py**
Add the authentication URLs:

```python
urlpatterns = [
    # ... existing URLs ...
    path('api/auth/', include('user_account.urls')),
]
```

### **Step 4: Install Dependencies & Migrate**
```bash
cd konsultabot_backend
pip install djangorestframework-simplejwt==5.3.0
python manage.py makemigrations user_account
python manage.py migrate
```

### **Step 5: Create Default Users**
```bash
python manage.py shell
```

Then in the Django shell:
```python
from user_account.models import User

# Create admin user
User.objects.create_superuser(
    username='admin',
    email='admin@evsu.edu.ph', 
    password='admin123',
    role='admin'
)

# Create IT staff user
User.objects.create_user(
    username='itstaff',
    email='itstaff@evsu.edu.ph',
    password='staff123', 
    role='it_staff'
)

# Create student user
User.objects.create_user(
    username='student',
    email='student@evsu.edu.ph',
    password='student123',
    role='student'
)
```

### **Step 6: Start Server & Test**
```bash
python manage.py runserver 0.0.0.0:8000
```

**Test the login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## ⚡ **Option 2: Use Advanced Django Project**

If you want to use the `django_konsultabot` project instead:

### **Step 1: Fix Missing Dependencies**
```bash
cd django_konsultabot
pip install djangorestframework-simplejwt==5.3.0 pydub textblob
```

### **Step 2: Create Missing App Files**
```bash
# Create missing __init__.py files
touch knowledgebase/__init__.py
touch knowledgebase/models.py
touch knowledgebase/views.py
touch knowledgebase/admin.py
touch knowledgebase/apps.py

touch analytics/__init__.py  
touch analytics/models.py
touch analytics/views.py
touch analytics/admin.py
touch analytics/apps.py
```

### **Step 3: Run Migrations**
```bash
python manage.py makemigrations user_account
python manage.py migrate
```

---

## 📱 **React Native Integration**

### **Update API URL in Mobile App**
In `KonsultabotMobileNew/screens/LoginScreen.js`, update:

```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.17:8000/api/auth'  // Your Django server
  : 'https://your-production-domain.com/api/auth';
```

### **Add Login Screen to Navigation**
In your main `App.js`:

```javascript
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import { getInitialRoute } from './utils/authUtils';

// Use role-based navigation
const [initialRoute, setInitialRoute] = useState('LoginScreen');

useEffect(() => {
  getInitialRoute().then(setInitialRoute);
}, []);
```

---

## 🧪 **Testing the System**

### **1. Test Login API**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### **2. Test Mobile App**
1. Start Expo: `npx expo start`
2. Open LoginScreen
3. Login with:
   - **Admin**: admin/admin123 → Should go to AdminDashboard
   - **Student**: student/student123 → Should go to ChatScreen

### **3. Test Role-Based Access**
```bash
# Get token from login response
TOKEN="your_access_token_here"

# Test protected endpoint
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 **What You Get**

✅ **JWT Authentication** with access/refresh tokens  
✅ **Role-Based Access Control** (admin, it_staff, student)  
✅ **Mobile Login Screen** with registration  
✅ **Admin Dashboard** for admin/staff users  
✅ **Automatic Role Navigation** in React Native  
✅ **Secure API Endpoints** with permission checking  

---

## 🔧 **Quick Troubleshooting**

### **Migration Issues**
```bash
# Reset migrations if needed
python manage.py migrate user_account zero
rm user_account/migrations/0*.py
python manage.py makemigrations user_account
python manage.py migrate
```

### **JWT Token Issues**
```bash
# Clear tokens in React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

### **Permission Errors**
```bash
# Check user role in Django shell
python manage.py shell
>>> from user_account.models import User
>>> user = User.objects.get(username='admin')
>>> print(user.role, user.get_permissions())
```

---

## 🎉 **Result**

Your KonsultaBot will have:
- **🔐 Secure authentication** with JWT tokens
- **👥 Role-based access control** for different user types  
- **📱 Mobile-ready login** system
- **🛡️ Protected API endpoints**
- **👑 Admin dashboard** for user management

**Choose Option 1 (existing backend) for the quickest setup!**
