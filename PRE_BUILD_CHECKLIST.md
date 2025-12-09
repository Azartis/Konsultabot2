# ✅ Pre-Build Checklist

## Before Running `eas build --platform android`

### 1. **EAS Account Setup** ✅
- [ ] Create Expo account at https://expo.dev (if you don't have one)
- [ ] Login: `eas login`
- [ ] Initialize project: `eas init` (if not already done)

### 2. **Configuration Files** ✅
- [x] `eas.json` - Created with build profiles
- [x] `app.config.js` - Updated with Android configuration
- [x] `package.json` - Build scripts added

### 3. **Android Configuration** ✅
- [x] Package name: `com.evsu.konsultabot`
- [x] Version: `1.0.0`
- [x] Version code: `1`
- [x] Permissions configured
- [x] Adaptive icon configured

### 4. **Assets** ✅
- [x] `assets/icon.png` - App icon (1024x1024px)
- [x] `assets/adaptive-icon.png` - Android adaptive icon (1024x1024px)
- [x] `assets/splash-icon.png` - Splash screen

### 5. **Dependencies** ✅
- [x] All dependencies installed: `npm install --legacy-peer-deps`
- [x] React Native Reanimated: v3.16.1 (compatible)
- [x] No worklets dependencies (removed)

### 6. **Build Configuration** ✅
- [x] Babel config correct
- [x] Plugins configured
- [x] EAS build profiles set up

## 🚀 Ready to Build!

Run one of these commands:

```bash
# Quick build (preview APK)
eas build --platform android

# Or use the batch file
BUILD_APK.bat
```

## 📝 Notes

- **First build:** May take 20-30 minutes
- **Subsequent builds:** 10-15 minutes
- **APK size:** ~30-50 MB
- **Free tier:** Limited builds per month

## ⚠️ Important

1. Make sure you're logged in: `eas whoami`
2. Project will be initialized automatically if needed
3. Build happens in the cloud (no local Android SDK needed)
4. Download APK from EAS dashboard when complete

---

**All set! Run `eas build --platform android` when ready!**

