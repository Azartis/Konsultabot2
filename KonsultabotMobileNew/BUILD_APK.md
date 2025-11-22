# Building APK with EAS

## Quick Start

To build an APK, simply run:

```bash
eas build --platform android
```

This will use the **production** profile by default and generate an APK file.

## Build Profiles

All profiles are configured to build APK files:

### 1. Production (Default)
```bash
eas build --platform android
# or explicitly:
eas build --platform android --profile production
```
- Builds: **APK**
- Distribution: Internal (downloadable)
- Environment: Production

### 2. Preview
```bash
eas build --platform android --profile preview
```
- Builds: **APK**
- Distribution: Internal (downloadable)
- Environment: Preview

### 3. Development
```bash
eas build --platform android --profile development
```
- Builds: **APK** (Debug)
- Distribution: Internal
- Includes development client

## Downloading Your APK

After the build completes:

1. **Via EAS Dashboard**: 
   - Go to https://expo.dev/accounts/[your-account]/projects/konsultabot-mobile/builds
   - Click on your build
   - Download the APK file

2. **Via CLI**:
   ```bash
   eas build:list
   eas build:download [build-id]
   ```

## Installation

Once downloaded, you can install the APK on Android devices:

```bash
# Via ADB
adb install path/to/your-app.apk

# Or transfer to device and install manually
```

## Notes

- ✅ All profiles are configured to build **APK** (not AAB)
- ✅ Production profile uses `distribution: "internal"` for direct downloads
- ✅ Builds are optimized for release with latest Android SDK
- ✅ APK files can be installed directly on Android devices without Play Store

## Troubleshooting

If you get an AAB instead of APK:
1. Check `eas.json` - ensure `buildType: "apk"` is set
2. Verify you're using the correct profile
3. Clear EAS cache: `eas build --platform android --clear-cache`

