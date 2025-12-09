# PowerShell script to rebuild the app for voice recognition
# This is REQUIRED for @react-native-voice/voice to work

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rebuilding App for Voice Recognition" -ForegroundColor Cyan
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
Write-Host "Step 2: Running expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prebuild failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Building and running on Android..." -ForegroundColor Yellow
Write-Host "This will take a few minutes..." -ForegroundColor Cyan
Write-Host ""

npx expo run:android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Create EAS development build:" -ForegroundColor Yellow
    Write-Host "  eas build --profile development --platform android" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "✅ Build complete! Voice recognition should now work." -ForegroundColor Green
Write-Host ""
Write-Host "Note: If you're using Expo Go, voice recognition will NOT work." -ForegroundColor Yellow
Write-Host "You MUST use the development build created above." -ForegroundColor Yellow

