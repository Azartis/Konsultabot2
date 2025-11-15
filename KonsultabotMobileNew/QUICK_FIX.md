# 🚨 QUICK FIX - App Won't Load

## ⚡ Immediate Steps:

### 1. **Run Emergency Fix Script**
```bash
EMERGENCY_FIX.bat
```

This will:
- Kill all Node/Expo processes
- Clear all caches
- Reinstall dependencies
- Start Expo with clean cache

### 2. **If Still Not Working - Test Minimal App**

Temporarily rename files to test:
```bash
# Backup current App.js
ren App.js App.js.backup

# Use test app
ren App.test.js App.js

# Start Expo
npx expo start --clear
```

If test app loads, the issue is in the main App.js or its dependencies.

### 3. **Check Console Logs**

Look for these messages:
- ✅ `🚀 App initializing...` - App started
- ✅ `✅ App ready!` - App initialized
- ❌ Any red errors - These show what's wrong

### 4. **Common Issues & Fixes**

#### Issue: "Cannot find module"
**Fix:** Run `npm install`

#### Issue: "lumaTheme not found"
**Fix:** Check if `src/theme/lumaTheme.js` exists

#### Issue: "Navigation error"
**Fix:** Check if all screen components exist

#### Issue: "AsyncStorage error"
**Fix:** This is usually a warning, not critical

### 5. **Check Android Emulator**

Make sure:
- Emulator is fully booted
- Can access Metro bundler
- No firewall blocking port 8081

### 6. **Try Web Version**

```bash
npx expo start --web
```

If web works, issue is Android-specific.

### 7. **Check Logs**

```bash
# Android logs
adb logcat | grep -i "react\|expo\|error"

# Or in Expo terminal, press 'j' to open debugger
```

## 🔍 What to Look For:

1. **Red errors in console** - These show what's broken
2. **"Bundling 100%" stuck** - Usually a JavaScript error
3. **White/black screen** - App crashed silently
4. **"Cannot read property"** - Missing import or undefined value

## ✅ Success Indicators:

- ✅ Console shows "🚀 App initializing..."
- ✅ Console shows "✅ App ready!"
- ✅ App shows Welcome screen or Login screen
- ✅ No red errors in console

---

**Run `EMERGENCY_FIX.bat` first, then check console logs!**

