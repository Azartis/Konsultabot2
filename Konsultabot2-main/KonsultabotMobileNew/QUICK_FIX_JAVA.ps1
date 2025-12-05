# Quick Fix: Set JAVA_HOME to Android Studio's Java
# This script sets JAVA_HOME to use Android Studio's bundled Java

Write-Host "Setting JAVA_HOME to Android Studio's Java..." -ForegroundColor Cyan

# Check common Android Studio locations
$possiblePaths = @(
    "C:\Program Files\Android\Android Studio\jbr",
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr",
    "C:\Program Files\Android\Android Studio\jre"
)

$foundJava = $null

foreach ($path in $possiblePaths) {
    if (Test-Path "$path\bin\java.exe") {
        $foundJava = $path
        Write-Host "✅ Found Java at: $foundJava" -ForegroundColor Green
        break
    }
}

if (-not $foundJava) {
    Write-Host "❌ Android Studio Java not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Java JDK:" -ForegroundColor Yellow
    Write-Host "  1. Download: https://adoptium.net/temurin/releases/" -ForegroundColor Cyan
    Write-Host "  2. Install JDK 17 (LTS) for Windows x64" -ForegroundColor Cyan
    Write-Host "  3. Check 'Add to PATH' during installation" -ForegroundColor Cyan
    exit 1
}

# Set JAVA_HOME for current session
$env:JAVA_HOME = $foundJava
Write-Host "✅ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green

# Set JAVA_HOME permanently
try {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $foundJava, "User")
    Write-Host "✅ JAVA_HOME set permanently" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not set JAVA_HOME permanently: $_" -ForegroundColor Yellow
}

# Verify Java works
Write-Host ""
Write-Host "Verifying Java..." -ForegroundColor Yellow
$javaVersion = & "$foundJava\bin\java.exe" -version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Java is working!" -ForegroundColor Green
    $javaVersion | Select-Object -First 3 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
} else {
    Write-Host "❌ Java verification failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Java Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now build the Android app:" -ForegroundColor Yellow
Write-Host "  npx expo run:android" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Restart PowerShell for JAVA_HOME to take full effect." -ForegroundColor Gray
Write-Host ""

