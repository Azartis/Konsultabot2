# PowerShell script to build APK with Ngrok URL
# Usage: .\build-apk.ps1

Write-Host "=== Building APK with Ngrok Configuration ===" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "app.config.js")) {
    Write-Host "ERROR: app.config.js not found. Run this script from KonsultabotMobileNew directory" -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found. Creating it..." -ForegroundColor Yellow
    Write-Host "Please update it with your Ngrok URL: EXPO_PUBLIC_NGROK_URL=https://your-url.ngrok-free.dev" -ForegroundColor Yellow
    "EXPO_PUBLIC_NGROK_URL=" | Out-File .env -Encoding utf8
}

# Display current .env
Write-Host "`nCurrent .env configuration:" -ForegroundColor Yellow
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
}

# Check if Ngrok is running
Write-Host "`nChecking Ngrok status..." -ForegroundColor Yellow
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
    $ngrokUrl = $tunnels.tunnels[0].public_url
    Write-Host "  Ngrok is running: $ngrokUrl" -ForegroundColor Green
    
    # Update .env if needed
    $envContent = Get-Content .env -Raw
    if ($envContent -notmatch $ngrokUrl) {
        Write-Host "  Updating .env with current Ngrok URL..." -ForegroundColor Yellow
        if ($envContent -match "EXPO_PUBLIC_NGROK_URL=") {
            $envContent = $envContent -replace "EXPO_PUBLIC_NGROK_URL=.*", "EXPO_PUBLIC_NGROK_URL=$ngrokUrl"
        } else {
            $envContent += "`nEXPO_PUBLIC_NGROK_URL=$ngrokUrl`n"
        }
        Set-Content .env -Value $envContent -NoNewline
        Write-Host "  Updated .env file" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: Ngrok is not running or not accessible" -ForegroundColor Yellow
    Write-Host "  Make sure Ngrok is running before building APK" -ForegroundColor Yellow
}

# Check if EAS is installed
Write-Host "`nChecking EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if ($easInstalled) {
    Write-Host "  EAS CLI is installed" -ForegroundColor Green
} else {
    Write-Host "  EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# Build APK
Write-Host "`n=== Starting APK Build ===" -ForegroundColor Cyan
Write-Host "This will take 10-30 minutes..." -ForegroundColor Yellow
Write-Host "`nBuilding with command:" -ForegroundColor White
Write-Host "  eas build --platform android --profile preview" -ForegroundColor Gray
Write-Host "`nPress Ctrl+C to cancel, or wait to continue..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start the build
Write-Host "`nStarting build now..." -ForegroundColor Green
eas build --platform android --profile preview

Write-Host "`n=== Build Complete ===" -ForegroundColor Green
Write-Host "Check your email or EAS dashboard for the download link" -ForegroundColor White

