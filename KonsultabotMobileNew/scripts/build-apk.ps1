# ============================================
# KonsultaBot - Standalone APK Build Script
# ============================================
# Usage: npm run build:apk
# Steps:
# 1. Load .env and Expo public variables
# 2. Run `npx expo prebuild --no-install`
# 3. Build release APK via Gradle (assembleRelease)
# 4. Show APK output path
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KonsultaBot - Standalone APK Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify current directory
if (-not (Test-Path 'app.config.js')) {
    Write-Host '❌ Run this script from the KonsultabotMobileNew directory.' -ForegroundColor Red
    exit 1
}

# Ensure Android project exists
if (-not (Test-Path 'android/app/build.gradle')) {
    Write-Host '❌ Android project not found. Run npm run native:build first.' -ForegroundColor Red
    exit 1
}

# Load .env variables
if (Test-Path '.env') {
    Write-Host '📄 Loading .env variables...' -ForegroundColor Gray
    Get-Content '.env' | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
            Write-Host "  ↳ $key" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host '⚠️  .env file not found. Set EXPO_PUBLIC_BACKEND_URL or EXPO_PUBLIC_NGROK_URL for production builds.' -ForegroundColor Yellow
}

# Check backend URL
if (-not $env:EXPO_PUBLIC_BACKEND_URL -and -not $env:EXPO_PUBLIC_NGROK_URL) {
    Write-Host '⚠️  No backend URL configured. APK will default to http://localhost:8000 (won’t work off your PC).' -ForegroundColor Yellow
}

# Check JAVA_HOME
if (-not $env:JAVA_HOME) {
    Write-Host '⚠️  JAVA_HOME not set. Ensure JDK 17+ is installed and JAVA_HOME points to it.' -ForegroundColor Yellow
} else {
    Write-Host "☕ JAVA_HOME: $($env:JAVA_HOME)" -ForegroundColor Gray
}

# Keystore validation
$keystoreProps = 'android\keystore.properties'
if (Test-Path $keystoreProps) {
    Write-Host "🔐 Using release keystore from $keystoreProps" -ForegroundColor Green
} else {
    Write-Host '⚠️  keystore.properties not found. Release APK will be signed with debug keystore (NOT for production).' -ForegroundColor Yellow
    Write-Host '    Copy android/keystore.properties.example and update with your release keystore.' -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host 'Step 1/2: Running Expo prebuild (no clean)...' -ForegroundColor Yellow
npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) {
    Write-Host '❌ Expo prebuild failed. Check the log above.' -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host 'Step 2/2: Building release APK via Gradle...' -ForegroundColor Yellow
Push-Location 'android'

# Use gradlew.bat on Windows
if (Test-Path '.\gradlew.bat') {
    .\gradlew.bat assembleRelease
} else {
    ./gradlew assembleRelease
}
$gradleExit = $LASTEXITCODE
Pop-Location

if ($gradleExit -ne 0) {
    Write-Host '❌ Gradle build failed. Review the error output for details.' -ForegroundColor Red
    exit 1
}

# APK path
$apkPath = Join-Path 'android/app/build/outputs/apk/release' 'app-release.apk'

Write-Host ""
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  ✅ APK Build Complete' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Cyan

if (Test-Path $apkPath) {
    Write-Host '📦 APK location:' -ForegroundColor Green
    Write-Host "    $apkPath" -ForegroundColor White
    Write-Host ''
    Write-Host 'Install on device/emulator:' -ForegroundColor Yellow
    Write-Host "    adb install -r `"$apkPath`"" -ForegroundColor Gray
} else {
    Write-Host '⚠️  APK file not found at expected path. Check android/app/build/outputs/apk/release' -ForegroundColor Yellow
}

Write-Host ""
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '  • Use HTTPS backend (set EXPO_PUBLIC_BACKEND_URL) for production.' -ForegroundColor Gray
Write-Host '  • Upload the APK or convert to AAB for Play Store.' -ForegroundColor Gray
Write-Host ""
