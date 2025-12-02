# Start Expo with QR code support
# This script helps troubleshoot QR code connection issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Expo with QR Code Support" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Run this script from KonsultabotMobileNew folder." -ForegroundColor Red
    exit 1
}

# Check if Expo is installed
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npx not found. Install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Checking network configuration..." -ForegroundColor Yellow

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object -First 1).IPAddress
if ($localIP) {
    Write-Host "   Found local IP: $localIP" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Could not detect local IP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/4] Starting Expo with tunnel mode..." -ForegroundColor Yellow
Write-Host "   Tunnel mode works even if phone and computer are on different networks" -ForegroundColor Gray
Write-Host ""

# Start Expo with tunnel mode (works across different networks)
Write-Host "Starting: npx expo start --tunnel --clear" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TROUBLESHOOTING TIPS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "If QR code doesn't work:" -ForegroundColor White
Write-Host "  1. Make sure Expo Go app is installed on your phone" -ForegroundColor Gray
Write-Host "  2. Try scanning the QR code with Expo Go app (not camera app)" -ForegroundColor Gray
Write-Host "  3. If still not working, try LAN mode instead:" -ForegroundColor Gray
Write-Host "     Press 's' to switch to LAN mode" -ForegroundColor Gray
Write-Host "  4. Make sure phone and computer are on same WiFi (for LAN mode)" -ForegroundColor Gray
Write-Host "  5. Check Windows Firewall allows port 8081" -ForegroundColor Gray
Write-Host ""
Write-Host "Alternative: Use the URL shown in terminal" -ForegroundColor Yellow
Write-Host "  - Copy the exp:// URL from terminal" -ForegroundColor Gray
Write-Host "  - Open Expo Go app manually" -ForegroundColor Gray
Write-Host "  - Paste the URL in Expo Go" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Expo with tunnel mode
npx expo start --tunnel --clear

