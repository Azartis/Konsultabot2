# 📱 EAS Build Setup Guide for Konsultabot

## ✅ Pre-Build Checklist

### 1. **EAS Account Setup**
```bash
# Login to EAS (create account if needed)
eas login

# Initialize EAS project (if not already done)
eas init
```

### 2. **Verify Configuration**
- ✅ `eas.json` - Created with build profiles
- ✅ `app.config.js` - Updated with Android package name and permissions
- ✅ Assets exist: `icon.png`, `adaptive-icon.png`, `splash-icon.png`
- ✅ All dependencies installed: `npm install`

### 3. **Android Package Configuration**
- Package name: `com.evsu.konsultabot`
- Version: `1.0.0`
- Version code: `1`

## 🚀 Building APK

### Option 1: Preview Build (Recommended for Testing)
```bash
cd KonsultabotMobileNew
eas build --platform android --profile preview
```

### Option 2: Production Build
```bash
cd KonsultabotMobileNew
eas build --platform android --profile production
```

### Option 3: Quick Build (Uses default profile)
```bash
cd KonsultabotMobileNew
eas build --platform android
```

## 📋 Build Process

1. **EAS will:**
   - Upload your project to Expo servers
   - Build the APK in the cloud
   - Provide download link when complete

2. **Build Time:** ~15-20 minutes

3. **After Build:**
   - Download APK from EAS dashboard
   - Install on Android device
   - Test the app

## 🔧 Troubleshooting

### Issue: "Project ID not found"
**Solution:**
```bash
eas init
# Follow prompts to create project
```

### Issue: "Missing assets"
**Solution:**
- Ensure `assets/icon.png` exists (1024x1024px)
- Ensure `assets/adaptive-icon.png` exists (1024x1024px)
- Ensure `assets/splash-icon.png` exists

### Issue: "Build failed - dependencies"
**Solution:**
```bash
npm install --legacy-peer-deps
eas build --platform android --clear-cache
```

### Issue: "Package name conflict"
**Solution:**
- Change package name in `app.config.js`:
  ```javascript
  android: {
    package: "com.evsu.konsultabot.yourname" // Make it unique
  }
  ```

## 📝 Important Notes

1. **First Build:** May take longer (20-30 minutes)
2. **Subsequent Builds:** Faster (10-15 minutes)
3. **Free Tier:** Limited builds per month
4. **APK Size:** ~30-50 MB (depending on assets)

## 🎯 Quick Commands

```bash
# Check EAS status
eas whoami

# View build status
eas build:list

# Download latest build
eas build:download

# Cancel running build
eas build:cancel
```

## 📱 Installing APK

1. Download APK from EAS dashboard
2. Transfer to Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Open APK file and install

---

**Ready to build? Run:**
```bash
cd KonsultabotMobileNew
eas build --platform android
```

