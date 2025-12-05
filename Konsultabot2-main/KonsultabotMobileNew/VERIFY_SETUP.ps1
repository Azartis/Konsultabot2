# Verify Backend Setup for Phone Connection
Write-Host "`n🔍 Verifying Backend Setup...`n" -ForegroundColor Cyan

# Get IP address
Write-Host "[1/4] Finding your computer's IP address..." -ForegroundColor Yellow
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike '127.*' -and 
    $_.IPAddress -notlike '169.254.*' -and
    ($_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.*')
} | Select-Object IPAddress, InterfaceAlias | Sort-Object IPAddress

if ($ipAddresses) {
    $primaryIP = $ipAddresses[0].IPAddress
    Write-Host "✅ Found IP: $primaryIP`n" -ForegroundColor Green
} else {
    Write-Host "❌ Could not find IP address!`n" -ForegroundColor Red
    exit 1
}

# Check if backend is running
Write-Host "[2/4] Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend is running locally!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running on localhost:8000" -ForegroundColor Red
    Write-Host "   Start it with: .\START_BACKEND_FOR_PHONE.bat`n" -ForegroundColor Yellow
    exit 1
}

# Check if backend is accessible from network
Write-Host "[3/4] Checking if backend is accessible from network..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$primaryIP:8000/api/health/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend is accessible from network at http://$primaryIP:8000`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend might not be accessible from network" -ForegroundColor Yellow
    Write-Host "   Make sure backend is running with: python manage.py runserver 0.0.0.0:8000" -ForegroundColor Yellow
    Write-Host "   (NOT localhost:8000 or 127.0.0.1:8000)`n" -ForegroundColor Yellow
}

# Check Windows Firewall
Write-Host "[4/4] Checking Windows Firewall..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -DisplayName "*Python*" -ErrorAction SilentlyContinue
if ($firewallRule) {
    Write-Host "✅ Python firewall rules found`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  No Python firewall rules found" -ForegroundColor Yellow
    Write-Host "   You may need to allow Python through Windows Firewall`n" -ForegroundColor Yellow
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Verification Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📱 For your phone:" -ForegroundColor Yellow
Write-Host "   • Backend URL: http://$primaryIP:8000/api" -ForegroundColor White
Write-Host "   • Test in phone browser: http://$primaryIP:8000/api/health/" -ForegroundColor White
Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Make sure phone and computer are on same WiFi" -ForegroundColor White
Write-Host "   2. Restart Expo: npm start" -ForegroundColor White
Write-Host "   3. Reload app on phone (shake device -> Reload)" -ForegroundColor White
Write-Host "   4. The app will auto-detect IP from Metro bundler!`n" -ForegroundColor White

