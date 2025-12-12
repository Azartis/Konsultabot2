# ============================================
# Development Build Script
# ============================================
# This script starts the Expo dev client WITHOUT rebuilding native code
# Use this for normal development when you haven't changed native modules
#
# DO NOT:
# - Run prebuild
# - Clean native directories
# - Delete Android folder
#
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KonsultaBot - Development Build" -ForegroundColor Cyan
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
Write-Host "🚀 Starting Expo dev client..." -ForegroundColor Yellow
Write-Host "   (This will NOT rebuild native code)" -ForegroundColor Gray
Write-Host ""

# Start Expo dev client
npx expo start --dev-client

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to start dev client!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Ensure dependencies are installed: npm install" -ForegroundColor Gray
    Write-Host "  2. If native code changed, run: npm run native:build" -ForegroundColor Gray
    Write-Host "  3. Check if Android folder exists (required for dev client)" -ForegroundColor Gray
    exit 1
}

