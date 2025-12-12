# Gradle APK Build Fix

## Issues Fixed

### 1. ✅ Duplicate META-INF Files
**Problem:** Gradle was finding duplicate META-INF files causing build failures:
```
2 files found with path 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
```

**Solution:** Added `pickFirst` rules in `android/app/build.gradle` to handle duplicate META-INF files:
- `META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version`
- `META-INF/DEPENDENCIES`
- `META-INF/LICENSE*`
- `META-INF/NOTICE*`
- `META-INF/*.kotlin_module`

### 2. ✅ Build Types Configuration
**Enhancement:** Added explicit `debuggable` flags to build types for clarity:
- Debug: `debuggable true`
- Release: `debuggable false`

### 3. ✅ Packaging Options
**Enhancement:** Enhanced packaging options to handle common conflicts and ensure APK generation works smoothly.

## Files Modified

### `android/app/build.gradle`
1. Added `pickFirst` rules in `packagingOptions` block
2. Added explicit `debuggable` flags to build types
3. Maintained all existing configurations

### `app.config.js` (Already configured)
- `expo-build-properties` plugin with `pickFirst` for META-INF files

### `eas.json` (Already configured)
- All profiles set to `buildType: "apk"`

## How to Build APK

### Using EAS Build (Recommended)
```bash
eas build --platform android
```

This will:
1. Use the production profile
2. Build an APK file
3. Make it available for download

### Using Local Gradle (For Testing)
```bash
cd android
./gradlew assembleRelease
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Verification

After building, verify the APK:
1. Check file exists: `android/app/build/outputs/apk/release/app-release.apk`
2. File size should be reasonable (typically 20-50MB for React Native apps)
3. Can install on Android device: `adb install app-release.apk`

## Troubleshooting

### If build still fails with META-INF errors:
1. Clear Gradle cache:
   ```bash
   cd android
   ./gradlew clean
   rm -rf .gradle
   cd ..
   ```

2. Clear EAS build cache:
   ```bash
   eas build --platform android --clear-cache
   ```

### If APK is not generated:
1. Check `eas.json` - ensure `buildType: "apk"` is set
2. Check build logs for specific errors
3. Verify all dependencies are compatible

### If APK is too large:
1. Enable ProGuard/R8 minification (already configured)
2. Enable resource shrinking (set `android.enableShrinkResourcesInReleaseBuilds=true` in `gradle.properties`)
3. Remove unused dependencies

## Notes

- ✅ All META-INF conflicts are now handled
- ✅ Build types are properly configured
- ✅ APK generation is enabled for all profiles
- ✅ Signing uses debug keystore (for development)
- ⚠️ For production, generate a proper keystore file

## Production Signing

For production releases, you'll need to:
1. Generate a keystore file
2. Update `signingConfigs` in `android/app/build.gradle`
3. Store credentials securely (use EAS credentials)

See: https://docs.expo.dev/app-signing/app-credentials/

