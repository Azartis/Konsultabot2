# 🚀 Quick Fix Guide - Expo QR Code & Gemini Issues

## 📱 Issue 1: Expo QR Code Won't Open on Phone

### Quick Solution (TRY THIS FIRST):
```bash
# In the KonsultabotMobileNew folder:
npx expo start --tunnel
```

**What this does:** Uses Expo's tunnel service to bypass network issues.

### Why QR Code Doesn't Work:
- Your phone and computer might be on different networks
- Windows Firewall might be blocking connections
- Network configuration issues

### Step-by-Step Fix:

**Option A: Use Tunnel (Easiest)**
1. Open terminal in `KonsultabotMobileNew` folder
2. Run: `npx expo start --tunnel`
3. Wait for QR code to appear
4. Scan with **Expo Go app** (not camera app!)

**Option B: Same Network**
1. Connect phone and PC to SAME WiFi
2. Run: `npx expo start`
3. If still doesn't work, try tunnel mode

**Option C: Manual URL**
1. In Expo Go app, tap "Enter URL manually"
2. Type: `exp://192.168.1.17:8081`
3. Tap "Connect"

---

## 🤖 Issue 2: Gemini Can't Give Solutions

### The Problem:
Your Gemini API key returns 404 errors (this is a known issue with your specific API key).

### The Solution (Already Implemented!):
Your app now has a **3-tier fallback system**:

```
1. Gemini API (will fail - 404) 
   ↓
2. Django Backend (Gemini + Knowledge Base) ← SHOULD WORK!
   ↓
3. Local AI Responses ← WILL ALWAYS WORK!
```

### Why It Should Work Now:

I've already fixed the integration! The app now:
- ✅ Calls Django backend correctly (`/api/v1/chat/`)
- ✅ Uses proper field names (`query`, `message`, `confidence`)
- ✅ Falls back to Local AI if backend is down
- ✅ Has intelligent local responses built-in

### To Verify It's Working:

#### Step 1: Start Backend Server
```bash
# Open NEW terminal window
cd backend\django_konsultabot
python manage.py runserver 192.168.1.17:8000
```

Keep this terminal open! You should see:
```
Starting development server at http://192.168.1.17:8000/
```

#### Step 2: Start Mobile App
```bash
# In KonsultabotMobileNew folder
npx expo start --tunnel
```

#### Step 3: Test in App
Ask these questions:
- "My computer is slow"
- "How do I fix WiFi problems?"
- "Tell me about Mobile Legends"

#### Step 4: Check Console Logs
You should see:
```
🤖 Trying Gemini API...
❌ (404 error - expected)
🌐 Calling backend server with Gemini + KB hybrid...
✅ Backend response: {...}
```

If you see this, **IT'S WORKING!** ✅

---

## 🎯 What You Should See

### If Backend is Running:
- Responses from "knowledge_base" or "gemini"
- Detailed, helpful answers
- Fast response times

### If Backend is Down:
- Responses from "local_ai"
- Still helpful IT support answers
- Slower, more generic responses

### If Everything Fails:
- Basic fallback responses
- Generic IT help info

---

## 🔧 Quick Troubleshooting

### "Backend not responding"
```bash
# Test backend manually:
python TEST_BACKEND.py

# Or in browser:
http://192.168.1.17:8000/api/v1/chat/
```

### "Expo won't start"
```bash
# Clear cache and restart:
npx expo start -c --tunnel
```

### "Phone won't connect"
1. Check Expo Go app is installed
2. Make sure using tunnel mode
3. Try manual URL entry

---

## 📋 Easy Startup Scripts

I've created helper scripts for you:

### For Backend:
```
backend\django_konsultabot\START_BACKEND.bat
```
Double-click to start the backend server!

### For Mobile App:
```
KonsultabotMobileNew\START_MOBILE_APP.bat
```
Double-click to start Expo with tunnel!

### To Test Backend:
```
TEST_BACKEND.py
```
Run this to verify backend is working!

---

## ✅ Expected Behavior

### Current Setup:
1. ✅ Gemini API key configured (but returns 404 - known issue)
2. ✅ Backend has Gemini + Knowledge Base integrated
3. ✅ Frontend calls backend correctly
4. ✅ Local AI fallback working
5. ⚠️ Expo QR code needs tunnel mode

### When You Ask a Question:
```
User: "My computer is slow"
  ↓
App tries: Gemini API → Fails (404)
  ↓
App tries: Django Backend → Success! ✅
  ↓
Backend checks: Knowledge Base
  ↓
Response: "🖥️ Computer Slowness Troubleshooting..."
```

---

## 🆘 Still Not Working?

### Check This:
1. **Backend Running?**
   - Terminal should show server running on 8000
   - Don't close that terminal!

2. **Correct IP?**
   - Run `ipconfig` to check your PC's IP
   - Should be `192.168.1.17`
   - If different, update `app.json` line 29

3. **Firewall?**
   - Allow Python through Windows Firewall
   - Allow Node.js through Windows Firewall

4. **App Logs?**
   - Shake phone in Expo Go
   - Open "Debug JS Remotely"
   - Check browser console for errors

---

## 📞 Need Help?

If still having issues:
1. Run `TEST_BACKEND.py` and share the output
2. Share the Expo terminal output
3. Share any error messages from phone app
4. Tell me what you see in the console logs
