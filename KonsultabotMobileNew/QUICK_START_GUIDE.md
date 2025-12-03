# 🚀 KonsultaBot Quick Start Guide

## ✅ App is Starting!

The app is now running with the optimized build workflow.

---

## 📱 How to Connect

### **Option 1: Scan QR Code (Recommended)**
1. Look for the QR code in the terminal
2. Open **Expo Go** app on your phone
3. Scan the QR code
4. App will load on your device

### **Option 2: Use Development Build**
If you have a development build installed:
1. The app should automatically connect
2. No QR code needed

### **Option 3: Web Browser**
1. Press `w` in the terminal to open in web browser
2. Or visit the URL shown in terminal

---

## 🎤 Voice Recognition Status

**Current Status:** ⚠️ Native module not linked

This is **normal** if you're using Expo Go. Voice recognition requires a development build.

### **To Enable Voice Recognition:**

1. **Stop the current server** (Ctrl+C in terminal)

2. **Run native build:**
   ```bash
   npm run native:build
   ```
   This will:
   - Rebuild native code with voice module
   - Install on your device/emulator
   - Take 5-15 minutes (first time)

3. **After build completes:**
   - Use the installed app (NOT Expo Go)
   - Voice recognition will work!

---

## 🔄 Daily Development Workflow

### **Normal Development (Fast - No Rebuild)**
```bash
npm start
# or
npm run dev:build
```
- ✅ Fast startup (~10-30 seconds)
- ✅ No native rebuild
- ✅ Preserves Android folder

### **When Native Code Changes**
```bash
npm run native:build
```
Only needed when:
- Adding/removing native modules
- Changing app.config.js plugins
- Updating Android/iOS code

---

## 🛠️ Current Optimizations Applied

✅ **Package.json**
- Optimized scripts (no unnecessary rebuilds)
- Voice module pinned to stable version (3.2.4)

✅ **Gradle Performance**
- Build caching enabled
- Parallel builds enabled
- Increased memory (4GB)

✅ **Build Scripts**
- `scripts/dev-build.ps1` - Fast development
- `scripts/native-build.ps1` - Native rebuilds

✅ **Documentation**
- Windows Defender optimization guide
- Build workflow documentation

---

## 📊 Performance Tips

### **For Faster Builds:**

1. **Exclude from Windows Defender:**
   ```powershell
   # Run as Administrator
   Add-MpPreference -ExclusionPath @(
       "$env:USERPROFILE\.gradle",
       "$env:LOCALAPPDATA\Android",
       "$env:LOCALAPPDATA\npm-cache"
   )
   ```
   **Improvement:** 30-50% faster builds

2. **Use SSD for project**
   - Move project to SSD if possible
   - Significantly faster I/O

3. **Keep Gradle daemon running**
   - Already enabled in gradle.properties
   - Don't kill it manually

---

## 🐛 Troubleshooting

### **App Won't Start?**
```bash
# Clear cache and restart
npx expo start --clear
```

### **Voice Module Errors?**
```bash
# Rebuild native code
npm run native:build
```

### **Build Errors?**
```bash
# Clean and rebuild
npm run native:build
```

### **Slow Builds?**
1. Check Windows Defender exclusions
2. Verify JAVA_HOME is set to JDK 17
3. Ensure sufficient disk space (10GB+)

---

## 📚 More Information

- **Build Optimization:** See `BUILD_OPTIMIZATION_SUMMARY.md`
- **Windows Defender:** See `docs/WINDOWS_DEFENDER_OPTIMIZATION.md`
- **Full README:** See `README.md`

---

## 🎯 Quick Commands Reference

| Command | Purpose | Time |
|---------|---------|------|
| `npm start` | Daily development | ~10-30s |
| `npm run dev:build` | Dev with .env | ~10-30s |
| `npm run native:build` | Rebuild native | ~5-15 min |

---

**🎉 Happy Coding!**

The app is optimized for fast development cycles. Use `npm start` for daily work, and only rebuild native code when necessary.

