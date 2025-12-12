# 🚀 Quick Fix: Android Emulator Stuck on Loading

## Quick Fix Steps:

### Option 1: Run the Fix Script (Recommended)
1. Double-click `FIX_ANDROID_LOADING.bat`
2. Wait for it to complete
3. Press 'a' when Expo starts to open Android emulator

### Option 2: Manual Fix

#### Step 1: Stop Everything
```bash
# Kill all Node/Expo processes
taskkill /F /IM node.exe
taskkill /F /IM expo.exe

# Kill processes on ports
netstat -ano | findstr :8081
# Note the PID and kill it: taskkill /PID <PID> /F
```

#### Step 2: Clear Caches
```bash
cd KonsultabotMobileNew
rmdir /s /q node_modules\.cache
rmdir /s /q .expo
rmdir /s /q .metro
npm cache clean --force
```

#### Step 3: Restart Expo
```bash
npx expo start --clear --reset-cache
```

#### Step 4: Open Android Emulator
- Press 'a' in the Expo terminal
- Or manually open Android Studio emulator first, then press 'a'

## Common Causes & Solutions:

### 1. Metro Bundler Not Starting
**Solution:** Check if port 8081 is available
```bash
netstat -ano | findstr :8081
```

### 2. Android Emulator Not Connected
**Solution:** Check ADB connection
```bash
adb devices
# If no devices, restart ADB:
adb kill-server
adb start-server
```

### 3. Network Issues
**Solution:** 
- Make sure emulator has internet (check emulator settings)
- Try using `10.0.2.2` for localhost in emulator
- Check firewall isn't blocking Expo

### 4. Cache Issues
**Solution:** Run the fix script or manually clear all caches

### 5. App Initialization Timeout
**Solution:** Already fixed in App.js (reduced timeout to 3 seconds)

## If Still Stuck:

1. **Cold Boot Emulator:**
   - Close Android emulator completely
   - Open Android Studio
   - Cold Boot Now (from emulator menu)

2. **Check Android Studio Logs:**
   - Open Android Studio
   - View > Tool Windows > Logcat
   - Look for errors

3. **Try Different Emulator:**
   - Create a new AVD (Android Virtual Device)
   - Use a different API level

4. **Check Expo Go:**
   - If using Expo Go, make sure it's updated
   - Try scanning QR code instead

5. **Restart Everything:**
   - Close all terminals
   - Close Android Studio
   - Restart computer
   - Start fresh

## Debug Commands:

```bash
# Check if Metro is running
curl http://localhost:8081/status

# Check ADB connection
adb devices

# Check Expo connection
npx expo start --tunnel

# View logs
npx expo start --android --verbose
```

## Still Not Working?

1. Check `App.js` for initialization errors
2. Check Metro bundler console for errors
3. Check Android Studio Logcat for native errors
4. Try running on a physical device instead
5. Check if backend server is running (if needed)

---

**Most common fix:** Run `FIX_ANDROID_LOADING.bat` and wait for it to complete! 🎯

