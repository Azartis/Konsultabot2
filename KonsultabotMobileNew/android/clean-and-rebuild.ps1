# Clean and Rebuild Script for AndroidX Migration
# This script cleans all build artifacts and rebuilds with AndroidX

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cleaning and Rebuilding Android App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the android directory
if (-not (Test-Path "build.gradle")) {
    Write-Host "❌ Error: build.gradle not found!" -ForegroundColor Red
    Write-Host "Please run this script from the android directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Cleaning Gradle cache..." -ForegroundColor Yellow
.\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Clean failed, continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Cleaning build cache..." -ForegroundColor Yellow
.\gradlew cleanBuildCache
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Build cache clean failed, continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Removing build directories..." -ForegroundColor Yellow
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed app/build" -ForegroundColor Green
}

if (Test-Path ".gradle") {
    Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .gradle cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Building debug APK..." -ForegroundColor Yellow
.\gradlew assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK location: app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Ensure android.enableJetifier=true in gradle.properties" -ForegroundColor Gray
    Write-Host "  2. Check that all dependencies use AndroidX" -ForegroundColor Gray
    Write-Host "  3. Run: .\gradlew app:dependencies to check for old support libraries" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Step 5: Verifying AndroidX migration..." -ForegroundColor Yellow
$deps = .\gradlew app:dependencies --configuration debugRuntimeClasspath 2>&1 | Out-String
if ($deps -match "com\.android\.support") {
    Write-Host "⚠️ WARNING: Old support libraries still found!" -ForegroundColor Yellow
    Write-Host "Check dependencies.txt for details" -ForegroundColor Gray
    $deps | Out-File "dependencies.txt"
} else {
    Write-Host "✅ No old support libraries found - AndroidX migration complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

