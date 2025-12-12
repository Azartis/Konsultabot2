# Start Expo with LAN mode (faster, requires same network)
# Use this if phone and computer are on the same WiFi

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Expo with LAN Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Run this script from KonsultabotMobileNew folder." -ForegroundColor Red
    exit 1
}

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object -First 1).IPAddress

Write-Host "Local IP Address: $localIP" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Phone and computer must be on the same WiFi network!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting Expo..." -ForegroundColor Cyan
Write-Host ""

# Start Expo with LAN mode
npx expo start --lan --clear

