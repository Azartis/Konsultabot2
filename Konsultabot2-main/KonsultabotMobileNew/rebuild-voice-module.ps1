# Rebuild Script for Voice Module
# This script ensures @react-native-voice/voice native module is properly linked

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rebuilding App with Voice Module" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "app.config.js")) {
    Write-Host "❌ Error: app.config.js not found!" -ForegroundColor Red
    Write-Host "Please run this script from the KonsultabotMobileNew directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "android") {
    Remove-Item -Recurse -Force "android" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed android directory" -ForegroundColor Green
}

if (Test-Path "ios") {
    Remove-Item -Recurse -Force "ios" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed ios directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Verifying dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules\@react-native-voice\voice")) {
    Write-Host "⚠️ @react-native-voice/voice not found in node_modules" -ForegroundColor Yellow
    Write-Host "Installing dependencies..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ @react-native-voice/voice found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Verifying plugin configuration..." -ForegroundColor Yellow
$appConfig = Get-Content "app.config.js" -Raw
if ($appConfig -match "@react-native-voice/voice") {
    Write-Host "✅ Voice plugin configured in app.config.js" -ForegroundColor Green
} else {
    Write-Host "❌ Voice plugin NOT found in app.config.js!" -ForegroundColor Red
    Write-Host "Please add the plugin to app.config.js:" -ForegroundColor Yellow
    Write-Host '  ["@react-native-voice/voice", { microphonePermission: "..." }]' -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Step 4: Running expo prebuild (this generates native code)..." -ForegroundColor Yellow
Write-Host "This will take 1-2 minutes..." -ForegroundColor Gray
npx expo prebuild --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prebuild failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Check app.config.js is valid JSON/JS" -ForegroundColor Gray
    Write-Host "  2. Ensure all dependencies are installed: npm install" -ForegroundColor Gray
    Write-Host "  3. Check for AndroidX conflicts (see FIX_ANDROIDX_DUPLICATES.md)" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Step 5: Verifying Android permissions..." -ForegroundColor Yellow
if (Test-Path "android\app\src\main\AndroidManifest.xml") {
    $manifest = Get-Content "android\app\src\main\AndroidManifest.xml" -Raw
    if ($manifest -match "RECORD_AUDIO") {
        Write-Host "✅ RECORD_AUDIO permission found in AndroidManifest.xml" -ForegroundColor Green
    } else {
        Write-Host "⚠️ RECORD_AUDIO permission NOT found!" -ForegroundColor Yellow
        Write-Host "This should have been added by the plugin, but check manually." -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ AndroidManifest.xml not found - prebuild may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Checking Java installation..." -ForegroundColor Yellow
$javaCheck = java -version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Java is not installed or not in PATH!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Java JDK is required for Android builds." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fix:" -ForegroundColor Yellow
    Write-Host "  1. Download Java JDK 17: https://adoptium.net/temurin/releases/" -ForegroundColor Cyan
    Write-Host "  2. Install with 'Add to PATH' checked" -ForegroundColor Cyan
    Write-Host "  3. Run: .\setup-java.ps1" -ForegroundColor Cyan
    Write-Host "  4. Restart PowerShell" -ForegroundColor Cyan
    Write-Host "  5. Run this script again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use EAS Build (cloud build - no Java needed locally):" -ForegroundColor Yellow
    Write-Host "  eas build --profile development --platform android" -ForegroundColor Cyan
    exit 1
}

if (-not $env:JAVA_HOME) {
    Write-Host "⚠️ JAVA_HOME is not set" -ForegroundColor Yellow
    Write-Host "Running setup-java.ps1 to configure Java..." -ForegroundColor Gray
    if (Test-Path ".\setup-java.ps1") {
        .\setup-java.ps1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Java setup script failed, but continuing..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ setup-java.ps1 not found. Setting JAVA_HOME manually..." -ForegroundColor Yellow
        # Try to find Java
        $javaPath = where.exe java 2>$null | Select-Object -First 1
        if ($javaPath) {
            $javaBin = Split-Path $javaPath -Parent
            $env:JAVA_HOME = Split-Path $javaBin -Parent
            Write-Host "✅ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
        }
    }
}

Write-Host "✅ Java is ready" -ForegroundColor Green
$javaCheck | ForEach-Object { Write-Host $_ -ForegroundColor Gray }

Write-Host ""
Write-Host "Step 7: Building and running on Android..." -ForegroundColor Yellow
Write-Host "This will take 5-15 minutes (first build is slower)..." -ForegroundColor Gray
Write-Host ""
npx expo run:android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Check AndroidX conflicts: .\android\clean-and-rebuild.ps1" -ForegroundColor Gray
    Write-Host "  2. Ensure Android SDK is properly configured" -ForegroundColor Gray
    Write-Host "  3. Check Gradle build errors above" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternative: Build with EAS:" -ForegroundColor Yellow
    Write-Host "  eas build --profile development --platform android" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app should now be installed on your device/emulator." -ForegroundColor Green
Write-Host ""
Write-Host "To verify voice module is working:" -ForegroundColor Yellow
Write-Host "  1. Open the app (NOT Expo Go)" -ForegroundColor Gray
Write-Host "  2. Tap the microphone button" -ForegroundColor Gray
Write-Host "  3. Grant microphone permission" -ForegroundColor Gray
Write-Host "  4. Speak - text should appear" -ForegroundColor Gray
Write-Host ""
Write-Host "If you still see 'Native module is null':" -ForegroundColor Yellow
Write-Host "  - Make sure you're NOT using Expo Go" -ForegroundColor Gray
Write-Host "  - Verify you installed the development build (not Expo Go)" -ForegroundColor Gray
Write-Host "  - Check console logs for permission errors" -ForegroundColor Gray
Write-Host ""

