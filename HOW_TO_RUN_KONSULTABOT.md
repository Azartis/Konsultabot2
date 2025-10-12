# 🚀 **How to Run KonsultaBot with RBAC System**

## 📋 **Prerequisites**

Make sure you have:
- ✅ **Python 3.8+** installed
- ✅ **Node.js & npm** installed  
- ✅ **Expo CLI** installed (`npm install -g @expo/cli`)
- ✅ **Virtual environment** activated

---

## 🔧 **Step-by-Step Setup**

### **Step 1: Activate Virtual Environment**
```powershell
# Navigate to project root
cd C:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj

# Activate virtual environment
& ".venv/Scripts/Activate.ps1"
```

### **Step 2: Install Python Dependencies**
```powershell
# Install Flask authentication dependencies
pip install flask pyjwt werkzeug requests

# Install Django dependencies (if needed)
pip install django djangorestframework django-cors-headers python-dotenv
```

### **Step 3: Start Authentication Server**
```powershell
# Navigate to backend
cd backend

# Start Flask authentication server
python simple_auth_api.py
```

**✅ Authentication server will start on**: `http://localhost:5000`

**Default users created:**
- 👑 **Admin**: `admin` / `admin123`
- 🔧 **IT Staff**: `itstaff` / `staff123`  
- 🎓 **Student**: `student` / `student123`

### **Step 4: Start Django Chatbot Server (Optional)**
```powershell
# Open new terminal/PowerShell window
cd C:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj

# Activate virtual environment
& ".venv/Scripts/Activate.ps1"

# Navigate to backend
cd backend

# Start Django server
python manage.py runserver 0.0.0.0:8000
```

**✅ Django server will start on**: `http://localhost:8000`

### **Step 5: Start React Native Mobile App**
```powershell
# Open new terminal/PowerShell window
cd C:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj

# Navigate to mobile app
cd KonsultabotMobileNew

# Install dependencies (first time only)
npm install

# Start Expo development server
npx expo start
```

**✅ Expo will start and show QR code for mobile testing**

---

## 🧪 **Testing Your Setup**

### **Test 1: Authentication API**
```powershell
# In backend directory
python test_auth.py
```

### **Test 2: Manual API Test**
Open browser and go to: `http://localhost:5000/health`

Should show:
```json
{
  "status": "healthy",
  "service": "KonsultaBot Auth API", 
  "version": "1.0.0"
}
```

### **Test 3: Mobile App Login**
1. **Open Expo app** on your phone or use web browser
2. **Scan QR code** from Expo CLI
3. **Try logging in** with different users:
   - **Admin**: admin/admin123 → Should go to AdminDashboard
   - **Student**: student/student123 → Should go to ChatScreen

---

## 🌐 **System Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Native   │    │   Flask Auth     │    │  Django Chat    │
│   Mobile App    │◄──►│     Server       │◄──►│     Server      │
│  (Expo/Metro)   │    │   (Port 5000)    │    │   (Port 8000)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🔍 **Troubleshooting**

### **Problem: "No module named 'flask'"**
**Solution:**
```powershell
# Make sure virtual environment is activated
& ".venv/Scripts/Activate.ps1"

# Install Flask
pip install flask pyjwt werkzeug
```

### **Problem: "Port already in use"**
**Solution:**
```powershell
# Kill processes on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or use different port
python simple_auth_api.py --port 5001
```

### **Problem: Mobile app can't connect**
**Solution:**
1. **Check your IP address**: `ipconfig`
2. **Update IP in mobile app files**:
   - `KonsultabotMobileNew/screens/LoginScreen.js`
   - `KonsultabotMobileNew/utils/authUtils.js`
3. **Replace** `192.168.1.17` with your actual IP

### **Problem: Django server won't start**
**Solution:**
```powershell
# Run migrations first
python manage.py migrate

# Then start server
python manage.py runserver 0.0.0.0:8000
```

---

## 📱 **Mobile App Features**

### **LoginScreen**
- ✅ **Beautiful UI** with gradient design
- ✅ **Login & Registration** forms
- ✅ **Role-based navigation** after login
- ✅ **Error handling** with user messages

### **AdminDashboard** (Admin/IT Staff only)
- ✅ **User statistics** display
- ✅ **System health** monitoring  
- ✅ **Quick action buttons**
- ✅ **Professional interface**

### **Role-Based Navigation**
- **Admin/IT Staff** → AdminDashboard
- **Students** → AdvancedChatScreen (your existing chat)

---

## 🔐 **API Endpoints**

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/api/auth/login` | POST | User login | `{"username": "admin", "password": "admin123"}` |
| `/api/auth/register` | POST | User registration | `{"username": "newuser", "email": "user@evsu.edu.ph", "password": "pass123"}` |
| `/api/auth/profile` | GET | Get user profile | Requires `Authorization: Bearer <token>` |
| `/api/auth/permissions` | GET | Get user permissions | Requires `Authorization: Bearer <token>` |
| `/health` | GET | Server health check | No auth required |

---

## 🎯 **Quick Start Commands**

### **Terminal 1: Authentication Server**
```powershell
cd C:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj
& ".venv/Scripts/Activate.ps1"
cd backend
python simple_auth_api.py
```

### **Terminal 2: Django Server (Optional)**
```powershell
cd C:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj
& ".venv/Scripts/Activate.ps1"
cd backend
python manage.py runserver 0.0.0.0:8000
```

### **Terminal 3: Mobile App**
```powershell
cd C:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj\KonsultabotMobileNew
npx expo start
```

---

## 🎉 **What You'll See**

### **Authentication Server Console**
```
============================================================
🔐 KonsultaBot Authentication API Starting...
============================================================
📊 Default Users Created:
   👑 Admin: admin/admin123 (Full system access)
   🔧 IT Staff: itstaff/staff123 (Dashboard + KB editing)
   🎓 Student: student/student123 (Chatbot access only)

🌐 Server running on http://localhost:5000
📱 For React Native, use: http://YOUR_IP:5000/api/auth
============================================================
```

### **Mobile App**
- **LoginScreen** with beautiful gradient design
- **Role-based navigation** after successful login
- **AdminDashboard** for admin/staff users
- **Automatic token management**

---

## 🏆 **Success Indicators**

✅ **Authentication server** running on port 5000  
✅ **Mobile app** connecting and showing login screen  
✅ **Different user roles** navigating to correct screens  
✅ **JWT tokens** being generated and validated  
✅ **API endpoints** responding correctly  

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check virtual environment** is activated
2. **Verify all dependencies** are installed
3. **Check port availability** (5000, 8000)
4. **Update IP addresses** in mobile app files
5. **Run test scripts** to verify functionality

**Your KonsultaBot RBAC system is ready to run! 🚀**
