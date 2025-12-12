# ✅ Konsultabot Ngrok Setup - Complete

All fixes have been applied to enable APK connection via Ngrok on any WiFi network.

## 📋 Changes Applied

### 1. ✅ Django Backend Fixes (`backend/django_konsultabot/django_konsultabot/settings.py`)

- **ALLOWED_HOSTS**: Added `.ngrok-free.app`, `.ngrok.io`, `.ngrok.app` patterns
- **CORS**: `CORS_ALLOW_ALL_ORIGINS = True` (already set)
- **CSRF_TRUSTED_ORIGINS**: Added Ngrok domain patterns and dynamic URL support
- **Backend Binding**: Must run with `0.0.0.0:8000` to accept external connections

### 2. ✅ Ngrok Scripts Created

- **`start-ngrok.ps1`**: PowerShell script (Windows)
- **`start-ngrok.sh`**: Bash script (Linux/Mac)
- **`start-ngrok.bat`**: Batch script (Windows)
- **`update-ngrok-url.ps1`**: Updates .env with current Ngrok URL

All scripts:
- Detect ngrok installation
- Check backend is running
- Start ngrok tunnel
- Get public URL (ensures HTTPS)
- Update `.env` file automatically

### 3. ✅ React Native/Expo Fixes (`KonsultabotMobileNew/src/services/apiService.js`)

- **Priority 1**: Ngrok URL from environment/config (HTTPS enforced)
- **Priority 2**: Cached Ngrok URL (HTTPS enforced)
- **Priority 3**: Local network discovery (fallback)
- **Ngrok Bypass Header**: Automatically adds `ngrok-skip-browser-warning: true`
- **Error Handling**: Friendly error message if Ngrok is not reachable
- **HTTPS Enforcement**: All Ngrok URLs automatically converted to HTTPS

### 4. ✅ App Config (`KonsultabotMobileNew/app.config.js`)

- `ngrokUrl` prioritized in `extra` config
- Ngrok URL embedded at build time from `.env`
- No localhost references in production builds

### 5. ✅ Validation Script

- **`validate-setup.ps1`**: Comprehensive validation script
  - Checks backend is running
  - Checks Ngrok is running
  - Tests backend via Ngrok
  - Verifies .env file
  - Checks app.config.js

---

## 🚀 Quick Start Guide

### Step 1: Start Django Backend

```powershell
cd backend\django_konsultabot
python manage.py runserver 0.0.0.0:8000
```

**Important**: Must use `0.0.0.0:8000` (not `localhost:8000`) to accept external connections.

### Step 2: Start Ngrok

```powershell
cd KonsultabotMobileNew
.\start-ngrok.ps1
```

This will:
- Start ngrok tunnel
- Get public URL (e.g., `https://abc123.ngrok-free.dev`)
- Update `.env` file automatically

### Step 3: Validate Setup

```powershell
cd KonsultabotMobileNew
.\validate-setup.ps1
```

This checks everything is working correctly.

### Step 4: Build APK

```powershell
cd KonsultabotMobileNew
eas build --platform android --profile preview
```

The APK will be built with the Ngrok URL embedded from `.env`.

### Step 5: Test on Phone

1. Install APK on phone (can be on different WiFi)
2. Open app
3. Try to login
4. Should connect via Ngrok automatically

---

## 🔧 Configuration Files

### `.env` File (KonsultabotMobileNew/.env)

```
EXPO_PUBLIC_NGROK_URL=https://your-url.ngrok-free.dev
```

This is automatically updated by `start-ngrok.ps1`.

### `app.config.js`

The Ngrok URL is read from `process.env.EXPO_PUBLIC_NGROK_URL` and embedded in the APK at build time.

---

## ⚠️ Important Notes

1. **Ngrok URL Changes**: Free ngrok URLs change each time you restart ngrok
   - **Solution**: Update `.env` and rebuild APK, OR use static domain: `ngrok http 8000 --domain=your-domain.ngrok-free.app`

2. **Backend Must Be Running**: Ngrok only tunnels - your Django backend must be running on `0.0.0.0:8000`

3. **HTTPS Required**: All Ngrok URLs are automatically converted to HTTPS (required for external access)

4. **APK Must Be Rebuilt**: After updating Ngrok URL in `.env`, you must rebuild the APK

5. **Ngrok Must Be Running**: When testing the APK, Ngrok must be running (it tunnels to your local backend)

---

## 🆘 Troubleshooting

### "Can't connect to backend"

1. ✅ Check backend is running: `http://localhost:8000/api/health/`
2. ✅ Check Ngrok is running: `http://localhost:4040`
3. ✅ Check `.env` has Ngrok URL: `Get-Content KonsultabotMobileNew\.env`
4. ✅ Verify backend accessible via Ngrok: `https://your-url.ngrok-free.dev/api/health/`
5. ✅ Rebuild APK after updating `.env`

### "Ngrok URL not working"

1. ✅ Backend accessible locally? `http://localhost:8000/api/health/`
2. ✅ Ngrok tunnel active? `http://localhost:4040`
3. ✅ Test Ngrok URL in browser: `https://your-url.ngrok-free.dev/api/health/`
4. ✅ Check CORS/CSRF settings in Django

### "APK still can't login"

1. ✅ Verify APK was built AFTER updating `.env`
2. ✅ Check Ngrok is running when testing
3. ✅ Check backend is running
4. ✅ Check app logs for connection errors
5. ✅ Verify Ngrok URL in `.env` matches current Ngrok URL

---

## 📱 Testing Checklist

- [ ] Backend running on `0.0.0.0:8000`
- [ ] Ngrok running and accessible
- [ ] `.env` file has current Ngrok URL (HTTPS)
- [ ] `validate-setup.ps1` passes all checks
- [ ] APK built with updated `.env`
- [ ] APK installed on phone (different WiFi)
- [ ] Login works from phone

---

## 🎯 Success Criteria

✅ APK can log in when phone is on different WiFi (e.g., FreeWifi)  
✅ Backend accessible via Ngrok HTTPS URL  
✅ No CORS errors in logs  
✅ API calls succeed from phone  
✅ Ngrok tunneling works consistently  

---

## 📝 Files Modified

1. `backend/django_konsultabot/django_konsultabot/settings.py` - CORS, CSRF, ALLOWED_HOSTS
2. `KonsultabotMobileNew/src/services/apiService.js` - Ngrok URL discovery, HTTPS enforcement
3. `KonsultabotMobileNew/app.config.js` - Ngrok URL embedding
4. `KonsultabotMobileNew/start-ngrok.ps1` - Created/Updated
5. `KonsultabotMobileNew/start-ngrok.sh` - Created
6. `KonsultabotMobileNew/start-ngrok.bat` - Created
7. `KonsultabotMobileNew/update-ngrok-url.ps1` - Created
8. `KonsultabotMobileNew/validate-setup.ps1` - Created

---

## 🚀 Next Steps

1. Run `validate-setup.ps1` to verify everything is configured
2. Start backend: `python manage.py runserver 0.0.0.0:8000`
3. Start Ngrok: `.\start-ngrok.ps1`
4. Build APK: `eas build --platform android --profile preview`
5. Test on phone with different WiFi

All fixes are complete! 🎉

