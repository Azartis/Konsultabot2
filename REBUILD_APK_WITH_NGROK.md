# 🔧 Rebuild APK with Ngrok - Step by Step

## ✅ Current Status
- ✅ You're in the correct directory: `KonsultabotMobileNew`
- ✅ Code updated to recognize `ngrok-free.dev` domains
- ⚠️ Need to ensure Ngrok is running and rebuild APK

---

## 📋 Step-by-Step Instructions

### Step 1: Start Your Django Backend
```powershell
# Open Terminal 1
cd backend/django_konsultabot
python manage.py runserver
```
**Wait until you see:** `Starting development server at http://127.0.0.1:8000/`

### Step 2: Start Ngrok
```powershell
# Open Terminal 2 (keep Terminal 1 running)
cd KonsultabotMobileNew
.\ngrok.exe http 8000
```

**Copy the HTTPS URL** that appears (e.g., `https://abc123.ngrok-free.dev`)

### Step 3: Update .env File
```powershell
# In Terminal 2 (still in KonsultabotMobileNew)
.\update-ngrok-url.ps1
```

Or manually edit `.env`:
```
EXPO_PUBLIC_NGROK_URL=https://your-ngrok-url.ngrok-free.dev
```

### Step 4: Verify Backend is Accessible
Open in browser: `https://your-ngrok-url.ngrok-free.dev/api/health/`

Should return: `{"status":"ok"}` or similar

### Step 5: Rebuild APK
```powershell
# Still in KonsultabotMobileNew directory
npx expo start --clear
# Then in another terminal:
eas build --platform android
```

Or if you have EAS configured:
```powershell
eas build --platform android --profile preview
```

---

## ⚠️ Important Notes

1. **Ngrok must be running** when you use the app
2. **Backend must be running** on port 8000
3. **Free Ngrok URLs change** - if you restart ngrok, you need to:
   - Update `.env` file
   - Rebuild the APK
4. **For testing**: You can use Expo Go first to test without rebuilding APK

---

## 🧪 Test Before Building APK

1. Start backend (Terminal 1)
2. Start ngrok (Terminal 2)
3. Update .env file
4. Run: `npx expo start --clear`
5. Scan QR code with Expo Go app
6. Test login on your phone
7. If it works, then build APK

---

## 🆘 Troubleshooting

**"Can't login on phone"**
- ✅ Is backend running? Check: http://localhost:8000/api/health/
- ✅ Is ngrok running? Check: http://localhost:4040
- ✅ Is .env file updated? Check: `Get-Content .env`
- ✅ Did you rebuild APK after updating .env?

**"Ngrok URL not working"**
- ✅ Backend accessible locally? http://localhost:8000/api/health/
- ✅ Ngrok tunnel active? http://localhost:4040
- ✅ Test ngrok URL in browser: `https://your-url.ngrok-free.dev/api/health/`

