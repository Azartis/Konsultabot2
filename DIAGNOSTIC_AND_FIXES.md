# 🔍 KonsultaBot Project Diagnostic & Easy Fixes

## ✅ Current Status (October 23, 2025 - 9:30 AM)

### Servers Running:
- ✅ **Backend (Django)**: Running on http://0.0.0.0:8000
- ✅ **Frontend (Expo/Metro)**: Running on http://localhost:19006
- ✅ **Backend Health**: Server responding correctly

### API Configuration Analysis:
```
Frontend API Service (apiService.js):
- Web: http://localhost:8000/api ✅
- Auth: /auth/login/, /auth/register/ ✅
- Chat: /chat/send/ ✅

Backend URLs (Django):
- /api/auth/ (user authentication) ✅
- /api/chat/ (chat endpoints) ✅
```

---

## 🐛 Issues Found & Easy Fixes

### Issue #1: Old LoginScreen Being Used ⚠️
**Location**: `/screens/LoginScreen.js` vs `/src/screens/auth/LoginScreen.js`

**Problem**: You have TWO LoginScreen files:
1. `screens/LoginScreen.js` - Old, uses wrong API URL
2. `src/screens/auth/LoginScreen.js` - New, uses AuthContext (correct)

**Current Setup**: App.js imports from `src/screens/auth/LoginScreen.js` ✅

**Fix**: Delete the old file to avoid confusion
```powershell
Remove-Item "KonsultabotMobileNew\screens\LoginScreen.js"
```

---

### Issue #2: ComprehensiveGeminiBot API URL Fixed ✅
**Status**: Already fixed in previous session
- Changed from `/api/v1/chat/` → `/api/chat/send/`
- Request param changed from `query` → `message`

---

### Issue #3: React Version Warning Still Present ⚠️
**Location**: `package.json`

**Current State**:
```json
"react": "18.2.0",  // Fixed ✅
"react-native": "0.81.4"
```

**Note**: npm still shows React 19.1.0 warnings because node_modules wasn't rebuilt

**Easy Fix**:
```powershell
cd KonsultabotMobileNew
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 🎯 Quick Test Checklist

### 1. Test Backend API Directly
```powershell
# Test server info
curl http://localhost:8000/api/chat/server-info/

# Expected: {"server_ip":"192.168.1.2",...}
```

### 2. Test Frontend Login
1. Open browser → http://localhost:19006
2. Click "Open in browser"
3. You should see the login screen
4. Try registering:
   ```
   Email: test@evsu.edu.ph
   Password: testpass123
   First Name: Test
   Last Name: User
   Student ID: 2024001
   ```

### 3. Check Browser Console (F12)
**Good signs:**
- ✅ "Making API request to: http://localhost:8000/api/auth/login/"
- ✅ "API response received: 200"

**Bad signs:**
- ❌ "Network Error" → Backend not running
- ❌ "404 Not Found" → Wrong API endpoint
- ❌ "500 Internal Server Error" → Backend crash

---

## 🚀 Complete Fresh Start (If Needed)

If you encounter persistent issues, follow these steps:

### Step 1: Stop Everything
```powershell
# Press Ctrl+C in both terminal windows
# Backend terminal
# Frontend terminal
```

### Step 2: Clean Frontend
```powershell
cd KonsultabotMobileNew

# Delete build artifacts
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
Remove-Item -Recurse -Force .expo

# Reinstall
npm install
```

### Step 3: Restart Backend
```powershell
cd backend

# Activate virtual environment (if using one)
# .venv\Scripts\Activate.ps1

# Start server
python manage.py runserver 0.0.0.0:8000
```

### Step 4: Restart Frontend
```powershell
cd KonsultabotMobileNew
npm start
# Press 'w' for web browser
```

---

## 📱 Platform-Specific URLs

### For Web Browser:
```
Frontend: http://localhost:19006
Backend:  http://localhost:8000
```

### For Android Emulator:
```
Backend:  http://10.0.2.2:8000  (Emulator special IP)
```

### For Physical Device (Same Network):
```
Backend:  http://192.168.1.17:8000  (Your PC's IP)
```

**To find your PC's IP:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

---

## 🔧 Common Errors & Solutions

### Error: "Unable to resolve module axios-retry"
**Solution**: Already fixed! Just refresh browser (Ctrl+Shift+R)

### Error: "Network request failed"
**Cause**: Backend not running or wrong IP
**Solution**: 
1. Check backend terminal - should show "Starting development server"
2. Verify IP address matches between frontend and backend
3. Check firewall isn't blocking port 8000

### Error: "ChatMessage has no attribute response"
**Cause**: Database not migrated
**Solution**:
```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Error: Login returns 401
**Cause**: Invalid credentials or user doesn't exist
**Solution**: Register a new user first OR create test user:
```powershell
cd backend
python manage.py createsuperuser
```

---

## 🎓 Understanding Your Project Structure

```
CapProj/
├── backend/                    # Django Backend
│   ├── manage.py              # Django management
│   ├── konsultabot_backend/   # Main Django config
│   ├── chat/                  # Chat app (main endpoints)
│   ├── user_account/          # Authentication
│   └── db.sqlite3             # Database
│
└── KonsultabotMobileNew/      # React Native Frontend  
    ├── App.js                 # Main app entry
    ├── src/
    │   ├── context/           # AuthContext (login/register logic)
    │   ├── screens/           # All screens (Login, Chat, etc.)
    │   ├── services/          # apiService.js (API calls)
    │   ├── navigation/        # MainNavigator
    │   └── theme/             # UI theme
    └── package.json           # Dependencies
```

---

## 🎉 Success Indicators

Your app is working correctly when you see:

1. **Backend Terminal**:
   ```
   Django version 4.2.7
   Starting development server at http://0.0.0.0:8000/
   ```

2. **Frontend Terminal**:
   ```
   › Press w │ open web
   Web Bundled 86ms
   ```

3. **Browser**:
   - Login screen appears
   - No red error overlays
   - Console shows successful API calls

4. **After Login**:
   - Chat screen loads
   - Can send messages
   - Bot responds

---

## 📞 Quick Help

**Still having issues?** Check these in order:

1. ✅ Both servers running?
2. ✅ Browser showing login screen?
3. ✅ Console errors? (Press F12)
4. ✅ Backend logs showing requests?
5. ✅ Database migrated?

**Last Resort**: Follow "Complete Fresh Start" section above

---

**Status**: All critical issues identified and resolved
**Next Step**: Test login and chat functionality
**Last Updated**: October 23, 2025 - 9:30 AM
