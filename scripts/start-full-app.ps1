# ============================================
# KonsultaBot - Full App Startup Script
# ============================================
# This script starts both:
# 1. Django Backend Server (from backend/django_konsultabot)
# 2. Expo Mobile App (from KonsultabotMobileNew)
#
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KonsultaBot - Full Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the project root directory (parent of KonsultabotMobileNew)
$projectRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $projectRoot

# Paths
$backendPath = Join-Path $projectRoot "backend\django_konsultabot"
$frontendPath = Join-Path $projectRoot "KonsultabotMobileNew"

# Check if paths exist
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend path not found: $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend path not found: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Project Root: $projectRoot" -ForegroundColor Gray
Write-Host "🔧 Backend Path: $backendPath" -ForegroundColor Gray
Write-Host "📱 Frontend Path: $frontendPath" -ForegroundColor Gray
Write-Host ""

# Check if Python is available
Write-Host "Step 1: Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
Write-Host ""
Write-Host "Step 2: Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check if backend dependencies are installed
Write-Host ""
Write-Host "Step 3: Checking backend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path (Join-Path $backendPath "venv"))) {
    Write-Host "⚠️  Virtual environment not found" -ForegroundColor Yellow
    Write-Host "   Creating virtual environment..." -ForegroundColor Gray
    Set-Location $backendPath
    python -m venv venv
    Write-Host "   Activating and installing dependencies..." -ForegroundColor Gray
    & ".\venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
} else {
    Write-Host "✅ Virtual environment found" -ForegroundColor Green
}

# Check if frontend dependencies are installed
Write-Host ""
Write-Host "Step 4: Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "⚠️  node_modules not found" -ForegroundColor Yellow
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    Set-Location $frontendPath
    npm install
} else {
    Write-Host "✅ node_modules found" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Services..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend Server
Write-Host "🚀 Starting Django Backend Server..." -ForegroundColor Yellow
Write-Host "   Location: $backendPath" -ForegroundColor Gray
Write-Host "   URL: http://0.0.0.0:8000" -ForegroundColor Gray
Write-Host ""

$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & ".\venv\Scripts\Activate.ps1"
    }
    python manage.py runserver 0.0.0.0:8000
} -ArgumentList $backendPath

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend (Expo)
Write-Host "📱 Starting Expo Mobile App..." -ForegroundColor Yellow
Write-Host "   Location: $frontendPath" -ForegroundColor Gray
Write-Host "   Using: npm start (--dev-client)" -ForegroundColor Gray
Write-Host ""

Set-Location $frontendPath

# Load .env if exists
if (Test-Path ".env") {
    Write-Host "📄 Loading .env file..." -ForegroundColor Gray
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Both services starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status:" -ForegroundColor Cyan
Write-Host "   Backend:  http://0.0.0.0:8000" -ForegroundColor White
Write-Host "   Frontend: Starting Expo dev server..." -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Scan QR code with Expo Go app" -ForegroundColor Gray
Write-Host "   - Press 'w' to open in web browser" -ForegroundColor Gray
Write-Host "   - Press 'a' to open Android emulator" -ForegroundColor Gray
Write-Host "   - Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host ""

# Start Expo (this will block)
try {
    npm start
} finally {
    # Cleanup: Stop backend job when Expo stops
    Write-Host ""
    Write-Host "🛑 Stopping backend server..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "✅ All services stopped" -ForegroundColor Green
}

