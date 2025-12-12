# Setup Java for Android Development
# This script helps you find and configure Java/JDK for Android builds

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Java Setup for Android Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Java is already installed
Write-Host "Step 1: Checking for Java installation..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Java is installed!" -ForegroundColor Green
    $javaVersion | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    
    # Check JAVA_HOME
    if ($env:JAVA_HOME) {
        Write-Host ""
        Write-Host "✅ JAVA_HOME is set: $env:JAVA_HOME" -ForegroundColor Green
        Write-Host ""
        Write-Host "Java is ready! You can now build the Android app." -ForegroundColor Green
        exit 0
    } else {
        Write-Host ""
        Write-Host "⚠️ JAVA_HOME is not set" -ForegroundColor Yellow
        Write-Host "Finding Java installation..." -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Java is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Java JDK:" -ForegroundColor Yellow
    Write-Host "  1. Download: https://adoptium.net/temurin/releases/" -ForegroundColor Cyan
    Write-Host "  2. Choose: JDK 17 (LTS) for Windows x64" -ForegroundColor Cyan
    Write-Host "  3. Install with default settings" -ForegroundColor Cyan
    Write-Host "  4. Run this script again" -ForegroundColor Cyan
    exit 1
}

# Try to find Java installation
Write-Host ""
Write-Host "Step 2: Finding Java installation..." -ForegroundColor Yellow

$possibleJavaPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Microsoft",
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr",
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\jre"
)

$foundJava = $null

foreach ($basePath in $possibleJavaPaths) {
    if (Test-Path $basePath) {
        $javaDirs = Get-ChildItem $basePath -Directory -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -match "jdk|jre|java" -or $_.Name -match "^\d+"
        }
        
        foreach ($javaDir in $javaDirs) {
            $javaExe = Join-Path $javaDir.FullName "bin\java.exe"
            if (Test-Path $javaExe) {
                $foundJava = $javaDir.FullName
                Write-Host "✅ Found Java at: $foundJava" -ForegroundColor Green
                break
            }
        }
        
        if ($foundJava) { break }
    }
}

# If not found, try using 'where java'
if (-not $foundJava) {
    Write-Host "Trying to find Java via 'where' command..." -ForegroundColor Gray
    $javaPath = where.exe java 2>$null
    if ($javaPath) {
        $javaExePath = $javaPath | Select-Object -First 1
        $javaBinDir = Split-Path $javaExePath -Parent
        $foundJava = Split-Path $javaBinDir -Parent
        Write-Host "✅ Found Java at: $foundJava" -ForegroundColor Green
    }
}

if (-not $foundJava) {
    Write-Host ""
    Write-Host "❌ Could not find Java installation automatically" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Java JDK:" -ForegroundColor Yellow
    Write-Host "  1. Download: https://adoptium.net/temurin/releases/" -ForegroundColor Cyan
    Write-Host "  2. Choose: JDK 17 (LTS) for Windows x64" -ForegroundColor Cyan
    Write-Host "  3. Install with default settings" -ForegroundColor Cyan
    Write-Host "  4. Run this script again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or set JAVA_HOME manually:" -ForegroundColor Yellow
    Write-Host '  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"' -ForegroundColor Gray
    Write-Host '  [Environment]::SetEnvironmentVariable("JAVA_HOME", $env:JAVA_HOME, "User")' -ForegroundColor Gray
    exit 1
}

# Set JAVA_HOME for current session
Write-Host ""
Write-Host "Step 3: Setting JAVA_HOME..." -ForegroundColor Yellow
$env:JAVA_HOME = $foundJava
Write-Host "✅ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green

# Set JAVA_HOME permanently
Write-Host ""
Write-Host "Step 4: Setting JAVA_HOME permanently..." -ForegroundColor Yellow
try {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $foundJava, "User")
    Write-Host "✅ JAVA_HOME set permanently in user environment" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not set JAVA_HOME permanently: $_" -ForegroundColor Yellow
    Write-Host "You may need to set it manually in System Environment Variables" -ForegroundColor Gray
}

# Verify Java works
Write-Host ""
Write-Host "Step 5: Verifying Java..." -ForegroundColor Yellow
$javaVersion = & "$foundJava\bin\java.exe" -version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Java is working!" -ForegroundColor Green
    $javaVersion | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
} else {
    Write-Host "❌ Java verification failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Java Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "JAVA_HOME is now set to: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""
Write-Host "You can now build the Android app:" -ForegroundColor Yellow
Write-Host "  npx expo run:android" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: You may need to restart PowerShell for JAVA_HOME to take effect." -ForegroundColor Gray
Write-Host ""

