# Setup Ngrok for KonsultaBot
# This script helps you set up ngrok.exe in the correct location

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ngrok Setup for KonsultaBot" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
$ngrokPath = Join-Path $backendPath "ngrok.exe"

# Check if ngrok.exe already exists in backend
if (Test-Path $ngrokPath) {
    Write-Host "✅ ngrok.exe found in backend folder" -ForegroundColor Green
    Write-Host "Location: $ngrokPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  .\start_backend_and_ngrok.ps1" -ForegroundColor Cyan
    exit 0
}

# Check if ngrok.exe exists in KonsultabotMobileNew
$mobileNgrokPath = Join-Path $PSScriptRoot "KonsultabotMobileNew\ngrok.exe"
if (Test-Path $mobileNgrokPath) {
    Write-Host "📋 Found ngrok.exe in KonsultabotMobileNew folder" -ForegroundColor Yellow
    Write-Host "Copying to backend folder..." -ForegroundColor Gray
    Copy-Item $mobileNgrokPath -Destination $ngrokPath -Force
    Write-Host "✅ Copied ngrok.exe to backend folder" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  .\start_backend_and_ngrok.ps1" -ForegroundColor Cyan
    exit 0
}

# Check if ngrok is in PATH
$ngrokInPath = Get-Command ngrok -ErrorAction SilentlyContinue
if ($ngrokInPath) {
    Write-Host "✅ ngrok found in PATH" -ForegroundColor Green
    Write-Host "Location: $($ngrokInPath.Source)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can use the automated script:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  .\start_backend_and_ngrok.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or start manually:" -ForegroundColor Yellow
    Write-Host "  cd backend\django_konsultabot" -ForegroundColor Cyan
    Write-Host "  python manage.py runserver 0.0.0.0:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then in another terminal:" -ForegroundColor Yellow
    Write-Host "  ngrok http 8000" -ForegroundColor Cyan
    exit 0
}

# Ngrok not found - provide download instructions
Write-Host "❌ ngrok.exe not found" -ForegroundColor Red
Write-Host ""
Write-Host "Please download ngrok:" -ForegroundColor Yellow
Write-Host "  1. Visit: https://ngrok.com/download" -ForegroundColor Cyan
Write-Host "  2. Download Windows version" -ForegroundColor Cyan
Write-Host "  3. Extract ngrok.exe" -ForegroundColor Cyan
Write-Host "  4. Place it in one of these locations:" -ForegroundColor Cyan
Write-Host "     - backend\ngrok.exe (recommended)" -ForegroundColor Gray
Write-Host "     - Or add to PATH" -ForegroundColor Gray
Write-Host ""
Write-Host "After downloading, run this script again to verify setup." -ForegroundColor Yellow

