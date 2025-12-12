# 🚀 Build APK with Ngrok - Step by Step

## ✅ Pre-Build Checklist

Before building, make sure:

1. ✅ **Ngrok is running** - Check: `http://localhost:4040`
2. ✅ **Backend is running** - Check: `http://localhost:8000/api/health/`
3. ✅ **.env file exists** with current Ngrok URL
4. ✅ **You're in KonsultabotMobileNew directory**

---

## 📱 Build APK Commands

### Option 1: Build with EAS (Recommended)

```powershell
# Make sure you're in KonsultabotMobileNew
cd KonsultabotMobileNew

# Build APK
eas build --platform android --profile preview
```

### Option 2: Build APK locally (if EAS is configured)

```powershell
cd KonsultabotMobileNew
npx expo run:android --variant release
```

### Option 3: Build APK with specific profile

```powershell
cd KonsultabotMobileNew
eas build --platform android --profile production
```

---

## 🔧 Before Building - Update .env

Make sure your `.env` file has the current Ngrok URL:

```powershell
cd KonsultabotMobileNew
.\update-ngrok-url.ps1
```

Or manually check:
```powershell
Get-Content .env
```

Should show:
```
EXPO_PUBLIC_NGROK_URL=https://your-current-ngrok-url.ngrok-free.dev
```

---

## ⚠️ Important Notes

1. **Ngrok URL changes** - If you restart ngrok, you need to:
   - Update `.env` file
   - Rebuild APK

2. **Backend must be running** - The APK will try to connect to Ngrok, which tunnels to your local backend

3. **Build time** - APK build takes 10-30 minutes depending on EAS queue

---

## 📥 After Build Completes

1. **Download APK** from EAS dashboard or check email
2. **Transfer to phone** via USB or download link
3. **Install APK** on your phone
4. **Test login** - Should now work with Ngrok URL

---

## 🆘 Troubleshooting

**"Build failed"**
- Check EAS account is logged in: `eas login`
- Check `eas.json` exists and is valid
- Check `app.config.js` is valid

**"APK still can't login"**
- Verify Ngrok is running when you test
- Verify backend is running
- Check `.env` file has correct URL
- Check APK was built AFTER updating `.env`

**"How do I know if APK has Ngrok URL?"**
- The APK will use the URL from `.env` at build time
- If you built before updating `.env`, rebuild!

---

## 🎯 Quick Build Command

```powershell
# One command to update URL and build
cd KonsultabotMobileNew
.\update-ngrok-url.ps1
eas build --platform android --profile preview
```

