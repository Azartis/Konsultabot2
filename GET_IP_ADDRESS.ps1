# Get Computer IP Address for Mobile Connection
Write-Host "`n🔍 Finding your computer's IP address...`n" -ForegroundColor Cyan

# Get all IPv4 addresses
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike '127.*' -and 
    $_.IPAddress -notlike '169.254.*' -and
    ($_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.*')
} | Select-Object IPAddress, InterfaceAlias | Sort-Object IPAddress

if ($ipAddresses) {
    Write-Host "✅ Found IP Address(es):`n" -ForegroundColor Green
    $ipAddresses | ForEach-Object {
        Write-Host "  • $($_.IPAddress) ($($_.InterfaceAlias))" -ForegroundColor White
    }
    
    # Get the first non-localhost IP
    $primaryIP = $ipAddresses[0].IPAddress
    Write-Host "`n📱 Primary IP for mobile connection: $primaryIP" -ForegroundColor Yellow
    Write-Host "`nBackend URL should be: http://$primaryIP:8000/api`n" -ForegroundColor Cyan
    
    # Check if backend is running
    Write-Host "🔍 Checking if backend is accessible..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://$primaryIP:8000/api/health/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✅ Backend is running and accessible!`n" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend is not accessible at http://$primaryIP:8000" -ForegroundColor Yellow
        Write-Host "   Make sure the backend is running with: python manage.py runserver 0.0.0.0:8000`n" -ForegroundColor White
    }
    
    # Return the IP for use in other scripts
    return $primaryIP
} else {
    Write-Host "❌ Could not find a valid IP address!" -ForegroundColor Red
    Write-Host "   Make sure you're connected to WiFi or a network.`n" -ForegroundColor Yellow
    return $null
}

