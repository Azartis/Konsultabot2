# 📱 Expo Mobile Setup Guide

## Issue 1: QR Code Won't Open on Phone

### Problem
When you scan the Expo QR code with your phone, the app won't open.

### Solutions (Try in order):

#### Solution 1: Use Tunnel Connection (RECOMMENDED)
```bash
# Stop current Expo server (Ctrl+C)
# Then run with tunnel:
npx expo start --tunnel
```

**Why this works:** Tunnel bypasses network/firewall issues by using Expo's cloud service.

#### Solution 2: Check Network Connection
- Make sure your **phone and computer are on the SAME WiFi network**
- Disable VPN on both devices
- Check Windows Firewall isn't blocking port 8081

#### Solution 3: Use Expo Go App Correctly
1. **Install Expo Go** on your phone:
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Open Expo Go FIRST** before scanning
3. Scan QR code from WITHIN the Expo Go app
4. Wait for bundle to download

#### Solution 4: Manual Connection
If QR code doesn't work:
1. In Expo Go app, tap "Enter URL manually"
2. Type: `exp://192.168.1.17:8081` (use your computer's IP)
3. Press Connect

#### Solution 5: Use Development Build (Advanced)
```bash
# For Android phone:
npx expo run:android

# This builds directly to your phone via USB
```

---

## Issue 2: Gemini Can't Give Solutions

### Problem
The chatbot isn't providing proper responses.

### Root Cause
Your Gemini API key returns 404 errors (checked in previous fixes). The system SHOULD fall back to:
1. Django Backend (Gemini + Knowledge Base hybrid)
2. Local AI responses
3. Basic fallback responses

### Verification Steps:

#### Step 1: Check Backend Server is Running
```bash
cd backend/django_konsultabot
python manage.py runserver 192.168.1.17:8000
```

You should see:
```
Starting development server at http://192.168.1.17:8000/
```

#### Step 2: Test Backend API Manually
Open browser and go to:
```
http://192.168.1.17:8000/api/v1/chat/
```

You should see an API interface or error page (not a "page not found").

#### Step 3: Check Network Connectivity
In your mobile app console, look for these messages:
```
🤖 Trying Gemini API...
❌ Gemini API failed (EXPECTED - 404 error)
🌐 Calling backend server with Gemini + KB hybrid...
✅ Backend response: [response data]
```

If you see "Backend response" - it's working! ✅

#### Step 4: Test a Question
Try asking:
- "How do I fix slow computer?"
- "Tell me about WiFi problems"
- "My printer won't work"

You should get detailed responses from either:
- Backend Knowledge Base
- Backend Gemini (if working)
- Local AI fallback

---

## Quick Troubleshooting Commands

### For Expo Mobile Issues:
```bash
# Clear cache and restart
npx expo start -c --tunnel

# If that doesn't work, rebuild
rm -rf node_modules
npm install
npx expo start --tunnel
```

### For Backend Issues:
```bash
# Start backend server
cd backend/django_konsultabot
python manage.py runserver 192.168.1.17:8000

# In another terminal, test it:
curl http://192.168.1.17:8000/api/v1/chat/
```

---

## Expected Flow

### When Everything Works:
```
1. User asks question in mobile app
   ↓
2. Try Gemini API directly → 404 (expected)
   ↓
3. Try Django Backend → SUCCESS!
   ├─ Check Knowledge Base first
   ├─ Try Gemini if KB confidence low
   └─ Return intelligent response
   ↓
4. Display response to user ✅
```

### Current Status:
- ✅ Frontend fixed to call correct backend URL
- ✅ Backend has Gemini + Knowledge Base working
- ✅ Local AI fallback implemented
- ⚠️ Expo QR code issue (network/setup)

---

## Still Not Working?

### Check These:

1. **Backend Running?**
   ```bash
   # Should show this running:
   python manage.py runserver 192.168.1.17:8000
   ```

2. **Correct IP Address?**
   - Find your PC's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update in `app.json` line 29 if different from `192.168.1.17`

3. **Firewall Blocking?**
   - Allow Python and Node.js through Windows Firewall
   - Allow ports: 8000 (Django) and 8081 (Expo)

4. **Phone App Logs?**
   - Shake phone → Open developer menu
   - Enable "Debug JS Remotely"
   - Check console in browser for errors

---

## Contact Support

If issues persist:
1. Share console logs from phone app
2. Share backend terminal output
3. Share error messages you see
