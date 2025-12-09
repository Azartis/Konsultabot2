# 🚀 KonsultaBot Startup Guide

## Quick Answer: How to Start the App

### **✅ RECOMMENDED: Automated Startup (Easiest)**

```bash
cd KonsultabotMobileNew
npm run start:full
```

This starts **both** backend and frontend automatically!

---

## 📋 **Detailed Startup Options**

### **Option 1: Full Automated Startup (Recommended)**

**Command:**
```bash
cd KonsultabotMobileNew
npm run start:full
```

**What it does:**
1. ✅ Checks Python & Node.js
2. ✅ Verifies/installs dependencies
3. ✅ Starts Django backend (port 8000)
4. ✅ Starts Expo frontend
5. ✅ Loads .env files automatically

**Time:** ~30-60 seconds

---

### **Option 2: Manual Startup (Step-by-Step)**

#### **Terminal 1: Start Backend**
```bash
# Navigate to backend
cd backend/django_konsultabot

# Activate virtual environment (if you have one)
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Mac/Linux

# Start Django server
python manage.py runserver 0.0.0.0:8000
```

**Expected Output:**
```
Starting development server at http://0.0.0.0:8000/
```

#### **Terminal 2: Start Frontend**
```bash
# Navigate to frontend
cd KonsultabotMobileNew

# Start Expo (optimized - no rebuild)
npm start
# or
npm run dev:build
```

**Expected Output:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

### **Option 3: Frontend Only (Backend Already Running)**

If backend is already running:

```bash
cd KonsultabotMobileNew
npm start
```

---

## 🎯 **What Changed from Before?**

### **Before:**
```bash
# Had to manually:
cd backend/django_konsultabot
python manage.py runserver 0.0.0.0:8000

# Then in another terminal:
cd KonsultabotMobileNew
npx expo start
```

### **Now:**
```bash
# One command does everything:
cd KonsultabotMobileNew
npm run start:full
```

**OR** still use the manual way if you prefer!

---

## 🎤 **Voice Recognition Status**

### **Current Behavior:**

| Platform | Voice Works? | How to Test |
|----------|--------------|-------------|
| **Web Browser** | ✅ Yes | `npm start` → Press `w` |
| **Expo Go (Mobile)** | ❌ No | Native module limitation |
| **Dev Build (Mobile)** | ✅ Yes | After `npm run native:build` |

### **Quick Test Voice in Web:**
```bash
npm start
# Press 'w' to open in browser
# Click microphone button - voice works!
```

### **Enable Voice on Mobile:**
```bash
# Build development build (one-time, ~10-15 min)
npm run native:build

# Then use the installed app (NOT Expo Go)
# Voice recognition will work!
```

---

## 🔧 **Troubleshooting**

### **Backend Won't Start?**

1. **Check Python:**
   ```bash
   python --version  # Should be 3.8+
   ```

2. **Install Dependencies:**
   ```bash
   cd backend/django_konsultabot
   pip install -r requirements.txt
   ```

3. **Check Port 8000:**
   ```bash
   # Windows
   netstat -ano | findstr :8000
   
   # If port in use, kill process or use different port
   python manage.py runserver 0.0.0.0:8001
   ```

### **Frontend Won't Start?**

1. **Install Dependencies:**
   ```bash
   cd KonsultabotMobileNew
   npm install
   ```

2. **Clear Cache:**
   ```bash
   npx expo start --clear
   ```

3. **Check Node.js:**
   ```bash
   node --version  # Should be 16+
   ```

### **Voice Recognition Errors?**

**If using Expo Go:**
- ✅ **Expected** - Voice doesn't work in Expo Go
- ✅ **Solution:** Use web version (`npm start` → `w`) or build dev build

**If using Dev Build:**
- Check microphone permissions
- Verify `npm run native:build` completed successfully
- Check AndroidManifest.xml has RECORD_AUDIO permission

---

## 📊 **Startup Time Comparison**

| Method | Time | Notes |
|--------|------|-------|
| `npm run start:full` | ~30-60s | Automated, checks everything |
| Manual (both terminals) | ~20-40s | Faster if already set up |
| `npm start` (frontend only) | ~10-30s | Fastest (if backend running) |

---

## 🎯 **Recommended Daily Workflow**

### **Morning Startup:**
```bash
# Option A: Automated (easiest)
cd KonsultabotMobileNew
npm run start:full

# Option B: Manual (if you prefer)
# Terminal 1: Backend
cd backend/django_konsultabot
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Frontend
cd KonsultabotMobileNew
npm start
```

### **During Development:**
- Frontend auto-reloads on code changes
- Backend auto-reloads on Python changes
- No need to restart unless dependencies change

### **Evening Shutdown:**
- Press `Ctrl+C` in both terminals
- Or just close terminals

---

## ✅ **Quick Reference**

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run start:full` | Start everything | First time, or when both needed |
| `npm start` | Start frontend only | When backend already running |
| `npm run dev:build` | Dev build with .env | When using environment variables |
| `npm run native:build` | Rebuild native code | When native modules change |

---

## 🎉 **You're Ready!**

The app is optimized and ready to go. Use `npm run start:full` for the easiest experience, or use the manual method if you prefer more control.

**Happy coding!** 🚀

