# 🔧 APK + Ngrok Setup Guide

## ❌ Problem: Can't Login on Phone APK

When you run the APK on a **physical phone** (not emulator), the phone **cannot access**:
- `localhost` or `127.0.0.1`
- Local IP addresses like `192.168.x.x` (unless on same WiFi)

**Solution: Use Ngrok** to expose your local backend to the internet.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Start Your Backend
```powershell
cd backend/django_konsultabot
python manage.py runserver
```
Make sure it's running on `http://localhost:8000`

### Step 2: Start Ngrok
```powershell
cd KonsultabotMobileNew
.\start-ngrok.ps1
```

Or manually:
```bash
ngrok http 8000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Step 3: Update App Config

**Option A: For Development (Expo)**
1. Create `.env` file in `KonsultabotMobileNew/`:
   ```
   EXPO_PUBLIC_NGROK_URL=https://your-url.ngrok.io
   ```
2. Restart Expo: `npx expo start --clear`

**Option B: For APK (Production Build)**
1. Update `app.config.js`:
   ```javascript
   extra: {
     ngrokUrl: 'https://your-url.ngrok.io',
     apiUrl: 'https://your-url.ngrok.io/api',
   }
   ```
2. Rebuild APK: `eas build --platform android`

---

## 🔍 Check Ngrok Status

Run this to check if ngrok is working:
```powershell
.\check-ngrok.ps1
```

Or manually check:
1. Open: http://localhost:4040
2. Look for the HTTPS URL
3. Test: `https://your-url.ngrok.io/api/health/`

---

## ⚠️ Important Notes

1. **Ngrok URL Changes**: Free ngrok URLs change every time you restart ngrok
   - **Solution**: Use a static domain: `ngrok http 8000 --domain=your-domain.ngrok-free.app`

2. **Backend Must Be Running**: Ngrok only tunnels - your Django backend must be running

3. **For APK**: You need to rebuild the APK after updating the ngrok URL in `app.config.js`

4. **Same WiFi**: If phone and computer are on same WiFi, you can use local IP (but ngrok is more reliable)

---

## 🚀 Quick Start Commands

```powershell
# Terminal 1: Start Backend
cd backend/django_konsultabot
python manage.py runserver

# Terminal 2: Start Ngrok
cd KonsultabotMobileNew
.\start-ngrok.ps1

# Terminal 3: Update and Rebuild (if needed)
cd KonsultabotMobileNew
# Update app.config.js with ngrok URL
eas build --platform android
```

---

## 📱 Testing

1. Install APK on phone
2. Try to login
3. Check backend logs for requests
4. Check ngrok dashboard: http://localhost:4040

---

## 🆘 Troubleshooting

**"Can't connect to backend"**
- ✅ Backend running? Check: http://localhost:8000/api/health/
- ✅ Ngrok running? Check: http://localhost:4040
- ✅ Correct URL in app.config.js?

**"Ngrok URL not working"**
- ✅ Backend accessible locally?
- ✅ Ngrok tunnel active? (check http://localhost:4040)
- ✅ Updated app.config.js with new URL?

**"Still can't login"**
- ✅ Check backend logs for errors
- ✅ Check ngrok logs for connection attempts
- ✅ Verify CORS settings in Django (should allow ngrok.io)

---

## 💡 Pro Tip

For production, consider:
1. **Static Ngrok Domain** (paid plan)
2. **Deploy Backend** to a cloud service (Heroku, Railway, etc.)
3. **Use a VPS** with a static IP

