# 📱 EAS Build - Complete Setup Guide

## ✅ Everything is Configured!

Your project is now ready for EAS Build. All configurations have been set up:

### ✅ What's Been Configured:

1. **EAS Configuration** (`eas.json`)
   - Preview build profile (APK)
   - Production build profile (APK)
   - Development profile

2. **App Configuration** (`app.config.js`)
   - Android package: `com.evsu.konsultabot`
   - Version: `1.0.0`
   - Version code: `1`
   - Permissions: Internet, Network State, Audio Recording
   - Plugins: expo-av, @react-native-voice/voice, expo-secure-store

3. **Build Scripts** (`package.json`)
   - `npm run build:android` - Quick build
   - `npm run build:android:preview` - Preview APK
   - `npm run build:android:production` - Production APK

4. **Assets**
   - ✅ Icon: `assets/icon.png`
   - ✅ Adaptive Icon: `assets/adaptive-icon.png`
   - ✅ Splash: `assets/splash-icon.png`

## 🚀 How to Build APK

### Step 1: Login to EAS (First Time Only)
```bash
cd KonsultabotMobileNew
eas login
```
Create an account at https://expo.dev if you don't have one.

### Step 2: Initialize Project (First Time Only)
```bash
eas init
```
Follow the prompts. This will create a project on Expo servers.

### Step 3: Build APK
```bash
# Option 1: Quick build (uses preview profile)
eas build --platform android

# Option 2: Explicit preview build
eas build --platform android --profile preview

# Option 3: Production build
eas build --platform android --profile production

# Option 4: Use the batch file
BUILD_APK.bat
```

## 📋 Build Process

1. **EAS will:**
   - Upload your project to Expo servers
   - Install dependencies
   - Build the APK in the cloud
   - Provide download link

2. **Build Time:**
   - First build: 20-30 minutes
   - Subsequent builds: 10-15 minutes

3. **After Build:**
   - Check EAS dashboard: https://expo.dev
   - Download APK from build page
   - Install on Android device

## 📱 Installing APK

1. **Download APK** from EAS dashboard
2. **Transfer to Android device** (USB, email, cloud)
3. **Enable Unknown Sources:**
   - Settings → Security → Unknown Sources (enable)
4. **Install APK:**
   - Open APK file
   - Tap "Install"
   - Wait for installation
   - Open app

## 🔧 Troubleshooting

### "Not logged in"
```bash
eas login
```

### "Project not initialized"
```bash
eas init
```

### "Build failed - dependencies"
```bash
npm install --legacy-peer-deps
eas build --platform android --clear-cache
```

### "Package name conflict"
Edit `app.config.js`:
```javascript
android: {
  package: "com.evsu.konsultabot.yourname" // Make unique
}
```

### "Missing assets"
Ensure these files exist:
- `assets/icon.png` (1024x1024px)
- `assets/adaptive-icon.png` (1024x1024px)
- `assets/splash-icon.png`

## 📊 Build Status

Check build status:
```bash
eas build:list
```

Cancel a build:
```bash
eas build:cancel
```

Download latest build:
```bash
eas build:download
```

## 🎯 Quick Reference

```bash
# Login
eas login

# Initialize (first time)
eas init

# Build APK
eas build --platform android

# Check status
eas build:list

# Download APK
eas build:download
```

## 📝 Important Notes

1. **Free Tier:** Limited builds per month
2. **APK Size:** ~30-50 MB
3. **No Android SDK Needed:** Builds happen in cloud
4. **Project ID:** Will be auto-generated on first `eas init`

## ✅ Ready to Build!

Everything is configured. Just run:

```bash
cd KonsultabotMobileNew
eas build --platform android
```

Or double-click: `BUILD_APK.bat`

---

**Good luck with your build! 🚀**

