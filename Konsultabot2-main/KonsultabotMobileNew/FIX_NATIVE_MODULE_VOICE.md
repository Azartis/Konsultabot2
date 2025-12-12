# 🎤 Fix "Native Module is Null" Error for react-native-voice

## 🔍 **Why This Error Occurs (Simple Explanation)**

### **The Problem:**
`@react-native-voice/voice` is a **native module** - it contains native Android/iOS code (Java/Kotlin/Swift) that must be **compiled into your app**.

### **Why It Fails:**
1. **Expo Go Limitation:** Expo Go only includes a limited set of pre-compiled native modules. `@react-native-voice/voice` is NOT included.
2. **Native Code Not Compiled:** When you run `expo start` and use Expo Go, the native code for voice recognition isn't compiled into the app.
3. **Module Returns Null:** When your JavaScript tries to access the native module, it returns `null` because the native code doesn't exist in the running app.

### **The Solution:**
You need to create a **development build** (not Expo Go) where the native module is compiled into the app.

---

## ✅ **Complete Fix: Step-by-Step Instructions**

### **Step 1: Verify Plugin Configuration**

**File:** `app.config.js` ✅ **Already Correct!**

Your plugin is already configured:
```javascript
[
  "@react-native-voice/voice",
  {
    microphonePermission: "Allow Konsultabot to access your microphone for voice input."
  }
]
```

**Why this is needed:** The plugin tells Expo to include the native module during build.

---

### **Step 2: Verify Android Permissions**

**File:** `android/app/src/main/AndroidManifest.xml` ✅ **Already Correct!**

Your permissions are already set:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
```

**Why this is needed:** Android requires explicit permission to access the microphone.

---

### **Step 3: Clean Previous Builds**

Remove old build artifacts that might have incorrect native module linking:

```powershell
# Navigate to project root
cd KonsultabotMobileNew

# Remove old native code
Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ios -ErrorAction SilentlyContinue

# Clean node modules (optional but recommended)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Reinstall dependencies
npm install
```

**Why this is needed:** Old build artifacts might have incorrect native module configurations.

---

### **Step 4: Generate Native Code (Prebuild)**

This creates the Android/iOS native projects with your native modules:

```powershell
# From project root (KonsultabotMobileNew)
npx expo prebuild --clean
```

**What this does:**
- ✅ Generates `android/` and `ios/` folders
- ✅ Links all native modules (including `@react-native-voice/voice`)
- ✅ Configures AndroidManifest.xml with permissions
- ✅ Sets up Gradle dependencies

**Why `--clean`:** Removes old native code to ensure a fresh build.

**Expected output:**
```
✔ Created native project
✔ Linked native modules
✔ Configured Android permissions
```

---

### **Step 5: Verify Native Module Linking**

Check that the native module is properly linked:

**File:** `android/app/build.gradle`

After prebuild, you should see the module in dependencies. Verify by checking:

```powershell
cd android
.\gradlew app:dependencies --configuration debugRuntimeClasspath | Select-String "voice"
```

**Expected:** You should see `@react-native-voice/voice` in the dependency tree.

---

### **Step 6: Build and Run**

Compile the native code and install on device/emulator:

```powershell
# From project root
cd KonsultabotMobileNew

# Build and run on Android
npx expo run:android
```

**What this does:**
- ✅ Compiles native Android code (including voice module)
- ✅ Builds the APK
- ✅ Installs on connected device/emulator
- ✅ Starts the app

**Time required:** 5-15 minutes (first build takes longer)

**Why this is needed:** This compiles the native module into the app binary.

---

### **Step 7: Verify Voice Module Works**

After the app launches, test voice recognition:

1. **Check console logs:**
   ```
   ✅ Voice module loaded successfully
   ✅ Native module availability check: true
   ✅ Microphone permission granted
   ✅ Voice recognition started successfully
   ```

2. **Test microphone:**
   - Tap the microphone button
   - Grant permission if prompted
   - Speak - text should appear

3. **If you still see errors:**
   - Check that you're NOT using Expo Go
   - Verify you installed the development build (not Expo Go)
   - Check AndroidManifest.xml has RECORD_AUDIO permission

---

## 📦 **Building Release APK with Voice Module**

To build a release APK that includes the voice module:

### **Option 1: Local Build**

```powershell
cd KonsultabotMobileNew\android
.\gradlew assembleRelease
```

**APK location:** `android/app/build/outputs/apk/release/app-release.apk`

### **Option 2: EAS Build (Recommended for Production)**

```powershell
cd KonsultabotMobileNew

# Build release APK
eas build --platform android --profile production
```

**Why EAS:** Handles signing, optimization, and distribution automatically.

---

## 🔍 **How to Verify Native Module is Linked in APK**

### **Method 1: Check APK Contents**

```powershell
# Extract APK (requires 7-Zip or similar)
# Look for native libraries in: lib/arm64-v8a/ or lib/armeabi-v7a/
# Should see: libreactnativevoice.so (or similar)
```

### **Method 2: Check Build Logs**

When building, look for:
```
> Task :app:mergeDebugNativeLibs
> Task :app:processDebugManifest
> Task :app:packageDebug
```

If you see native library tasks, the module is being included.

### **Method 3: Runtime Check**

In your app, add this check:
```javascript
import Voice from '@react-native-voice/voice';

// Check if native module exists
console.log('Voice module:', Voice);
console.log('Native module available:', Voice._nativeModule !== null);
```

**Expected:** `Voice._nativeModule` should NOT be null.

---

## 💡 **Tips to Avoid This Error in the Future**

### **1. Always Use Development Builds for Native Modules**

When adding a native module:
- ❌ **Don't:** Test in Expo Go
- ✅ **Do:** Create a development build first

### **2. Check Module Compatibility**

Before installing a native module, check:
- ✅ Does it require native code? (Check package README)
- ✅ Is it compatible with Expo? (Check Expo docs)
- ✅ Does it need a plugin in `app.config.js`?

### **3. Rebuild After Adding Native Modules**

**Always run after adding a native module:**
```powershell
npx expo prebuild --clean
npx expo run:android
```

### **4. Use EAS Build for Production**

For production APKs, use EAS Build:
```powershell
eas build --platform android --profile production
```

This ensures all native modules are properly compiled.

### **5. Verify Plugin Configuration**

After adding a native module:
1. Check if it needs a plugin in `app.config.js`
2. Verify permissions in `AndroidManifest.xml`
3. Run `npx expo prebuild --clean` to regenerate native code

---

## 🚨 **Common Mistakes to Avoid**

### **Mistake 1: Testing in Expo Go**
❌ **Wrong:** Running `expo start` and opening in Expo Go
✅ **Correct:** Running `npx expo run:android` to create a development build

### **Mistake 2: Skipping Prebuild**
❌ **Wrong:** Running `npx expo run:android` without prebuild
✅ **Correct:** Always run `npx expo prebuild --clean` first

### **Mistake 3: Not Cleaning Old Builds**
❌ **Wrong:** Building on top of old native code
✅ **Correct:** Use `--clean` flag or delete `android/` folder

### **Mistake 4: Missing Permissions**
❌ **Wrong:** Forgetting to add RECORD_AUDIO permission
✅ **Correct:** Verify AndroidManifest.xml has all required permissions

---

## 📋 **Quick Reference: Commands**

```powershell
# Complete rebuild workflow
cd KonsultabotMobileNew
Remove-Item -Recurse -Force android,ios -ErrorAction SilentlyContinue
npx expo prebuild --clean
npx expo run:android

# Build release APK
cd android
.\gradlew assembleRelease

# Or use EAS
eas build --platform android --profile production
```

---

## ✅ **Expected Result**

After completing all steps:
- ✅ No "Native module is null" errors
- ✅ Voice recognition works in the app
- ✅ Microphone permission is requested
- ✅ Speech-to-text functions properly
- ✅ Release APK includes voice module

---

## 🆘 **Troubleshooting**

### **Error: "Module not found"**
**Solution:** Run `npm install` and `npx expo prebuild --clean`

### **Error: "Permission denied"**
**Solution:** Check AndroidManifest.xml has RECORD_AUDIO permission

### **Error: "Build failed"**
**Solution:** 
1. Clean: `Remove-Item -Recurse -Force android`
2. Rebuild: `npx expo prebuild --clean`
3. Check AndroidX migration (see FIX_ANDROIDX_DUPLICATES.md)

### **Voice still doesn't work after rebuild**
**Solution:**
1. Verify you're NOT using Expo Go
2. Check console logs for permission errors
3. Verify AndroidManifest.xml permissions
4. Try uninstalling and reinstalling the app

---

**The key is: Native modules MUST be compiled into the app. Expo Go cannot do this - you need a development build!** 🎯

