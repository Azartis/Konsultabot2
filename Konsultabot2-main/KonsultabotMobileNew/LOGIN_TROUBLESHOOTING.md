# 🔧 Login Troubleshooting Guide

## Current Status
- ✅ Ngrok is running: `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev`
- ✅ Backend is running on port 8000
- ✅ .env file has Ngrok URL
- ⚠️ **CRITICAL: APK must be rebuilt after updating .env**

## Most Common Issue: APK Built Before .env Update

**If you built the APK BEFORE updating the .env file, the APK doesn't have the Ngrok URL!**

### Solution:
1. Make sure `.env` has: `EXPO_PUBLIC_NGROK_URL=https://unmutated-nondeprecatively-bonnie.ngrok-free.dev`
2. **Rebuild the APK:**
   ```powershell
   cd KonsultabotMobileNew
   eas build --platform android
   ```
3. Install the new APK on your phone

---

## Ngrok-Free.dev Browser Verification Issue

**Ngrok-free.dev requires browser verification** which can block API requests from mobile apps.

### Solution 1: Use Ngrok Paid Plan (Static Domain)
```powershell
ngrok http 8000 --domain=your-domain.ngrok-free.app
```

### Solution 2: Add Ngrok Bypass Header
The app should automatically add the bypass header, but verify in `apiService.js`

### Solution 3: Use ngrok.io (if available)
Some ngrok plans provide `ngrok.io` domains that don't require browser verification.

---

## Testing Steps

### Step 1: Test Ngrok URL in Browser
Open: `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/health/`

If you see a browser verification page, that's the issue!

### Step 2: Test Login Endpoint
```powershell
# In PowerShell
$url = "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev"
$body = @{username="test"; password="test"} | ConvertTo-Json
Invoke-WebRequest -Uri "$url/api/auth/login/" -Method POST -Body $body -ContentType "application/json"
```

### Step 3: Check App Logs
1. Connect phone via USB
2. Run: `adb logcat | findstr "Konsultabot\|Ngrok\|API"`
3. Try to login
4. Check what URL the app is trying to use

---

## Quick Fix Checklist

- [ ] Backend running? `http://localhost:8000/api/health/`
- [ ] Ngrok running? `http://localhost:4040`
- [ ] .env file updated? `Get-Content KonsultabotMobileNew\.env`
- [ ] APK rebuilt after .env update?
- [ ] Ngrok URL accessible? Test in browser
- [ ] No browser verification blocking? (ngrok-free.dev issue)

---

## If Still Not Working

1. **Check app logs** on phone (use ADB or Expo logs)
2. **Verify the URL** the app is using (should be the ngrok URL)
3. **Test with Expo Go** first (easier to debug)
4. **Check backend logs** for incoming requests
5. **Check ngrok dashboard** at `http://localhost:4040` for requests

---

## Alternative: Use Expo Go for Testing

Instead of building APK, test with Expo Go:
```powershell
cd KonsultabotMobileNew
npx expo start --clear
# Scan QR code with Expo Go app
```

This way you can see console logs and verify the URL is correct.

