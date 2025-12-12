# Fix EAS Build Upload Error

## Problem

The EAS build failed during upload with error:
```
Failed to upload the project tarball to EAS Build
Reason: write ECONNRESET
```

The project was compressed to **49.7 MB**, which is quite large and may cause upload timeouts.

## Solution Applied

### 1. Created `.easignore` File
This file excludes unnecessary files from the EAS build upload:
- ✅ All `.md` documentation files (except README.md)
- ✅ All batch scripts (`.bat`, `.ps1`, `.sh`)
- ✅ Test files
- ✅ Debug/log files
- ✅ Development scripts
- ✅ Build artifacts (will be regenerated)
- ✅ Cache directories

### 2. Reduced Upload Size
By excluding these files, the upload size should be significantly reduced, making it more reliable.

## Next Steps

### Option 1: Retry the Build (Recommended)
```bash
eas build --platform android
```

The `.easignore` file will automatically exclude unnecessary files, reducing upload size and improving reliability.

### Option 2: If Upload Still Fails

1. **Check Your Network Connection**
   - Ensure stable internet connection
   - Try a different network (mobile hotspot, different WiFi)
   - Check if firewall/proxy is blocking the upload

2. **Reduce Project Size Further**
   - Check `node_modules` size (should be excluded by default)
   - Remove large unused assets
   - Clean up unnecessary files

3. **Use EAS Build with Retry**
   ```bash
   eas build --platform android --non-interactive
   ```

4. **Check EAS Build Status**
   - Visit https://expo.dev/accounts/[your-account]/projects/konsultabot-mobile/builds
   - Check if there are any service issues

### Option 3: Local Build (Alternative)
If upload continues to fail, you can build locally:
```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## What Was Excluded

The `.easignore` file excludes:
- 📄 Documentation files (100+ .md files)
- 🔧 Batch scripts (30+ .bat files)
- 🧪 Test files
- 📦 Build artifacts
- 💾 Cache directories
- 🗑️ Temporary files

## Expected Result

After applying `.easignore`:
- ✅ Upload size should be **much smaller** (likely 10-20 MB instead of 49.7 MB)
- ✅ Upload should be **faster and more reliable**
- ✅ Build should **complete successfully**

## Troubleshooting

### If upload still fails:

1. **Network Issues**
   ```bash
   # Test connection to EAS
   ping expo.dev
   ```

2. **Firewall/Proxy**
   - Check if corporate firewall is blocking Google Cloud Storage
   - Try from a different network

3. **EAS Service Status**
   - Check https://status.expo.dev/
   - Check EAS Build service status

4. **Manual Retry**
   - Wait a few minutes
   - Try again (network issues are often transient)

## Notes

- The `.easignore` file works like `.gitignore` but for EAS builds
- Files excluded won't affect the build (they're not needed)
- Your source code and necessary files are still included
- The build will work exactly the same, just with a smaller upload

