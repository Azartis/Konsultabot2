# ============================================
# Native Build Script
# ============================================
# This script rebuilds native code when:
# - Native modules are added/removed
# - app.config.js plugins change
# - Android/iOS native code needs updating
#
# WARNING: This will regenerate the android/ folder
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KonsultaBot - Native Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "app.config.js")) {
    Write-Host "❌ Error: app.config.js not found!" -ForegroundColor Red
    Write-Host "Please run this script from the KonsultabotMobileNew directory" -ForegroundColor Yellow
    exit 1
}

# Load .env file if it exists
if (Test-Path ".env") {
    Write-Host "📄 Loading .env file..." -ForegroundColor Gray
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  ✅ Loaded: $key" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "⚠️  No .env file found (optional)" -ForegroundColor Yellow
}

# Export EXPO_PUBLIC_NGROK_URL if set
if ($env:EXPO_PUBLIC_NGROK_URL) {
    Write-Host "🌐 Using NGROK URL: $env:EXPO_PUBLIC_NGROK_URL" -ForegroundColor Green
} else {
    Write-Host "ℹ️  EXPO_PUBLIC_NGROK_URL not set (using default from app.config.js)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⚠️  WARNING: This will regenerate native code!" -ForegroundColor Yellow
Write-Host "   The android/ folder will be updated" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Continue? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Step 1: Running expo prebuild..." -ForegroundColor Yellow
Write-Host "   (This generates/updates native code)" -ForegroundColor Gray
Write-Host ""

npx expo prebuild

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Prebuild failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Check app.config.js is valid" -ForegroundColor Gray
    Write-Host "  2. Ensure all dependencies are installed: npm install" -ForegroundColor Gray
    Write-Host "  3. Check for AndroidX conflicts" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Step 2: Building and running on Android..." -ForegroundColor Yellow
Write-Host "   (This will take 5-15 minutes on first build)" -ForegroundColor Gray
Write-Host ""

npx expo run:android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Check Android SDK is properly configured" -ForegroundColor Gray
    Write-Host "  2. Verify JAVA_HOME is set to JDK 17" -ForegroundColor Gray
    Write-Host "  3. Check Gradle build errors above" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Native Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For future development, use: npm start" -ForegroundColor Yellow
Write-Host "   (This will NOT rebuild native code)" -ForegroundColor Gray
Write-Host ""

