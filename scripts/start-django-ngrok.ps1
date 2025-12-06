# ============================================
# Start Django + Ngrok Script
# ============================================
# Starts Django server on 0.0.0.0:8000 and ngrok tunnel
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Django + Ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "❌ ngrok not found in PATH" -ForegroundColor Red
    Write-Host "   Install ngrok: https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

# Check if Django is in virtual environment
$djangoPath = "backend\django_konsultabot"
if (-not (Test-Path $djangoPath)) {
    Write-Host "❌ Django project not found at $djangoPath" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Starting Django server on 0.0.0.0:8000..." -ForegroundColor Yellow
Write-Host ""

# Start Django in background
$djangoJob = Start-Job -ScriptBlock {
    Set-Location $using:djangoPath
    python manage.py runserver 0.0.0.0:8000
}

Start-Sleep -Seconds 3

# Check if Django started
if ($djangoJob.State -eq 'Running') {
    Write-Host "✅ Django server started" -ForegroundColor Green
} else {
    Write-Host "⚠️  Django server may not have started. Check logs." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Starting ngrok tunnel..." -ForegroundColor Yellow
Write-Host ""

# Start ngrok
Start-Process ngrok -ArgumentList "http", "8000" -NoNewWindow

Start-Sleep -Seconds 3

Write-Host "✅ Ngrok started" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Get ngrok URL from: http://localhost:4040" -ForegroundColor Gray
Write-Host "  2. Update URL: .\scripts\update-ngrok-url.ps1" -ForegroundColor Gray
Write-Host "  3. Rebuild APK with new URL" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop Django server" -ForegroundColor Yellow
Write-Host ""

# Wait for Django job
Wait-Job $djangoJob
Remove-Job $djangoJob

