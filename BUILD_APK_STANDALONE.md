# 📦 KonsultaBot Standalone APK Guide

Build a fully offline APK using the local Gradle toolchain. No EAS account required.

---

## ✅ Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node + npm** | v18+ recommended |
| **Expo CLI** | Bundled via `npx expo` |
| **JDK** | Temurin JDK 17 (`JAVA_HOME` must point to it) |
| **Android SDK / Platform Tools** | Installed via Android Studio |
| **Keystore** | PKCS12 keystore for release signing |
| **Backend URL** | HTTPS endpoint for production usage |

---

## 1. Generate Release Keystore (one-time)

```bash
cd KonsultabotMobileNew/android
mkdir keystores

keytool -genkeypair -v -storetype PKCS12 \
  -keystore keystores/konsultabot-release.keystore \
  -alias konsultabot-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

> 💡 **Keep this file private.** Never commit `.keystore` files or passwords.

---

## 2. Configure `keystore.properties`

```bash
cd KonsultabotMobileNew/android
copy keystore.properties.example keystore.properties
```

Edit `keystore.properties`:

```
storeFile=keystores/konsultabot-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=konsultabot-release
keyPassword=YOUR_KEY_PASSWORD
```

This file is gitignored (`android/.gitignore` + root `.gitignore`).

---

## 3. Set Backend URL

Expo only bundles environment variables prefixed with `EXPO_PUBLIC_`.

```
# KonsultabotMobileNew/.env
EXPO_PUBLIC_BACKEND_URL=https://your-api.example.com
# Optional fallback (e.g., Ngrok)
EXPO_PUBLIC_NGROK_URL=https://something.ngrok-free.dev
```

> ⚠️ Older Android versions block HTTP by default. Use HTTPS (Ngrok, Cloudflare Tunnel, production host, etc.) for release builds.

---

## 4. Build the APK

```bash
cd KonsultabotMobileNew
npm install          # if not already installed
npm run build:apk
```

The script performs:

1. Loads `.env` into the build environment
2. Runs `npx expo prebuild --platform android --no-install`
3. Calls `gradlew assembleRelease`
4. Prints APK output path

> Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 5. Install & Test

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Turn off the development server if you want to simulate production networking. Ensure the backend is reachable from the device (public HTTPS/Ngrok).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `JAVA_HOME` not set | Install JDK 17 and update environment variables |
| Gradle out-of-memory | Already configured for 4GB via `android/gradle.properties`; close memory-intensive apps |
| `keystore.properties` missing | Copy from `android/keystore.properties.example` |
| `cleartext HTTP traffic not permitted` | Use HTTPS backend or create a custom `network_security_config.xml` |
| `Permission denied` when installing | Run `adb uninstall com.evsu.konsultabot` first |
| Voice module unavailable | Ensure you previously ran `npm run native:build` and granted microphone permission |

---

## Production Checklist

- [ ] `EXPO_PUBLIC_BACKEND_URL` set to production API (HTTPS)
- [ ] Release keystore configured
- [ ] `keystore.properties` excluded from git
- [ ] APK signed with release key
- [ ] Tested on physical device with backend online
- [ ] Optional: build AAB via `./gradlew bundleRelease` for Play Store

---

Need more automation? See `scripts/build-apk.ps1` (invoked via `npm run build:apk`).

