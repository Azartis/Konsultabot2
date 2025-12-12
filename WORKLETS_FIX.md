# 🔧 Fixing Worklets Version Mismatch Error

## Error
```
WorkletsError: Mismatch between JavaScript part and native part of Worklets (0.7.1 vs 0.5.1)
```

## Root Cause
This error occurs when:
1. **Using Expo Go** - Expo Go has a pre-built version of `react-native-reanimated` (0.5.1) that doesn't match your JavaScript bundle (0.7.1)
2. **Native app not rebuilt** - The native Android/iOS code wasn't rebuilt after updating `react-native-reanimated`
3. **Cache issues** - Old cached native modules are conflicting with new JavaScript code

## Solution Options

### Option 1: Use Development Build (Recommended) ✅

**Expo Go doesn't support native modules like `react-native-reanimated`!**

You MUST create a development build:

```powershell
# 1. Clear all caches
.\scripts\fix-worklets.ps1

# 2. Rebuild native code
npx expo prebuild --clean --platform android

# 3. Build and run on Android
npx expo run:android

# OR start dev client
npx expo start --dev-client
```

### Option 2: Make Reanimated Optional (Quick Fix)

If you're not actively using `react-native-reanimated` features, we can make it optional:

1. **Update `index.js`** to conditionally import:
```javascript
// Only import if available (for development builds)
try {
  require('react-native-reanimated');
} catch (e) {
  console.log('Reanimated not available (Expo Go mode)');
}
```

2. **Update `babel.config.js`** to conditionally include plugin:
```javascript
const plugins = [];
// Only add reanimated plugin if available
try {
  require.resolve('react-native-reanimated/plugin');
  plugins.push('react-native-reanimated/plugin');
} catch (e) {
  // Reanimated not available
}
```

### Option 3: Remove Reanimated (If Not Needed)

If you're not using any reanimated features:

```powershell
npm uninstall react-native-reanimated
# Remove from index.js
# Remove from babel.config.js
```

## Quick Fix Script

Run this PowerShell script to fix the issue:

```powershell
.\scripts\fix-worklets.ps1
```

This will:
1. ✅ Clear Metro bundler cache
2. ✅ Clear Expo cache
3. ✅ Reinstall dependencies
4. ✅ Clear Android build cache
5. ✅ Rebuild native code
6. ✅ Clear watchman cache

## Step-by-Step Manual Fix

### 1. Stop Expo Server
Press `Ctrl+C` in the terminal running Expo

### 2. Clear All Caches
```powershell
# Clear Metro cache
Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue

# Clear Expo cache
Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue

# Clear Android build
Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
```

### 3. Reinstall Dependencies
```powershell
npm install --legacy-peer-deps
```

### 4. Rebuild Native Code
```powershell
npx expo prebuild --clean --platform android
```

### 5. Start with Dev Client
```powershell
npx expo start --dev-client --clear
```

### 6. Build and Run
```powershell
# In a new terminal
npx expo run:android
```

## Important Notes

⚠️ **Expo Go Limitation:**
- Expo Go has a **fixed version** of `react-native-reanimated` (0.5.1)
- Your JavaScript bundle has version 0.7.1
- **They will NEVER match in Expo Go!**

✅ **Solution:**
- You MUST use a **development build** (not Expo Go)
- Development builds include your custom native modules
- Run: `npx expo run:android` to create a dev build

## Verification

After fixing, verify the app starts without errors:

1. ✅ No Worklets error
2. ✅ App loads successfully
3. ✅ Navigation works (if using reanimated)
4. ✅ Animations work (if using reanimated)

## If Still Having Issues

1. **Check if using Expo Go:**
   - If yes → Create development build
   - If no → Continue troubleshooting

2. **Verify reanimated version:**
   ```powershell
   npm list react-native-reanimated
   ```

3. **Check babel config:**
   - Ensure `react-native-reanimated/plugin` is LAST in plugins array

4. **Check import order:**
   - `react-native-gesture-handler` must be imported FIRST
   - `react-native-reanimated` must be imported SECOND
   - Then other imports

5. **Full clean rebuild:**
   ```powershell
   .\scripts\fix-worklets.ps1
   npx expo run:android
   ```

## Current Status

- ✅ `react-native-reanimated@4.1.6` installed
- ✅ Babel plugin configured correctly
- ✅ Import order correct in `index.js`
- ⚠️ **Need to rebuild native app** (development build required)

