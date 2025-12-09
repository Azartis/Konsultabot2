# Retry EAS Build Script
# This script helps retry the EAS build after fixes

Write-Host "`n🔧 EAS Build Retry Script`n" -ForegroundColor Cyan
Write-Host "Fixes Applied:" -ForegroundColor Yellow
Write-Host "  ✅ Fixed newArchEnabled mismatch (gradle.properties)" -ForegroundColor Green
Write-Host "  ✅ Enhanced eas.json configuration" -ForegroundColor Green
Write-Host "  ✅ EAS Project ID already configured`n" -ForegroundColor Green

# Navigate to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "Current directory: $projectDir`n" -ForegroundColor Gray

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI..." -ForegroundColor Cyan
try {
    $easVersion = eas --version 2>&1
    Write-Host "✅ EAS CLI found: $easVersion`n" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
}

# Ask user which build profile to use
Write-Host "Select build profile:" -ForegroundColor Yellow
Write-Host "  1. Preview (recommended for testing)" -ForegroundColor White
Write-Host "  2. Production" -ForegroundColor White
Write-Host "  3. Development (local build)" -ForegroundColor White
Write-Host "  4. Cancel`n" -ForegroundColor White

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Starting Preview build...`n" -ForegroundColor Cyan
        eas build --platform android --profile preview
    }
    "2" {
        Write-Host "`n🚀 Starting Production build...`n" -ForegroundColor Cyan
        eas build --platform android --profile production
    }
    "3" {
        Write-Host "`n🚀 Starting Development build (local)...`n" -ForegroundColor Cyan
        Write-Host "Note: Local builds require Android SDK and can take longer.`n" -ForegroundColor Yellow
        eas build --platform android --profile development --local
    }
    "4" {
        Write-Host "`n❌ Build cancelled.`n" -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "`n❌ Invalid choice. Using Preview build...`n" -ForegroundColor Yellow
        eas build --platform android --profile preview
    }
}

Write-Host "`n✅ Build command executed!`n" -ForegroundColor Green
Write-Host "Monitor your build at: https://expo.dev/accounts/acestrike404/projects/konsultabot-mobile/builds`n" -ForegroundColor Cyan

