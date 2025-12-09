# PowerShell script to start Ngrok and update Expo config
# Usage: .\start-ngrok.ps1

Write-Host "Starting Ngrok for Konsultabot Backend..." -ForegroundColor Cyan

# Check if ngrok is installed
$ngrokPath = $null
# First check current directory for ngrok.exe
if (Test-Path ".\ngrok.exe") {
    $ngrokPath = ".\ngrok.exe"
} elseif (Test-Path "ngrok.exe") {
    $ngrokPath = "ngrok.exe"
} else {
    # Check PATH
    $ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
    if ($ngrokCmd) {
        $ngrokPath = $ngrokCmd.Source
    }
}

if (-not $ngrokPath) {
    Write-Host "ERROR: Ngrok is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Install Ngrok from: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "Or use: choco install ngrok (if you have Chocolatey)" -ForegroundColor Yellow
    Write-Host "Or place ngrok.exe in the current directory" -ForegroundColor Yellow
    exit 1
}

# Check if backend is running on port 8000
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "SUCCESS: Backend is running on port 8000" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Backend is not running on port 8000" -ForegroundColor Yellow
    Write-Host "Start your Django backend first: python manage.py runserver" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Check if ngrok is already running
$existingNgrok = $null
try {
    $existingTunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
    if ($existingTunnels.tunnels -and $existingTunnels.tunnels.Count -gt 0) {
        $existingUrl = $existingTunnels.tunnels[0].public_url
        Write-Host "INFO: Ngrok is already running!" -ForegroundColor Yellow
        Write-Host "Using existing tunnel: $existingUrl" -ForegroundColor Cyan
        $publicUrl = $existingUrl
        $ngrokProcess = $null
    }
} catch {
    # Ngrok not running, start it
    Write-Host "Starting Ngrok tunnel..." -ForegroundColor Cyan
    $ngrokProcess = Start-Process -FilePath $ngrokPath -ArgumentList "http", "8000" -PassThru -WindowStyle Hidden
}

# Wait for Ngrok to start
Start-Sleep -Seconds 3

# Get Ngrok public URL from API (if not already set)
if (-not $publicUrl) {
    try {
        $ngrokApiResponse = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get
        $publicUrl = $ngrokApiResponse.tunnels[0].public_url
    } catch {
        Write-Host "ERROR: Could not connect to Ngrok API" -ForegroundColor Red
        if ($ngrokProcess) {
            Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

if ($publicUrl) {
    Write-Host "SUCCESS: Ngrok tunnel established!" -ForegroundColor Green
    Write-Host "Public URL: $publicUrl" -ForegroundColor Cyan
    
    # Update .env file
    $envFile = ".env"
    $envContent = ""
    
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
    }
    
    # Update or add NGROK_URL
    if ($envContent -match "EXPO_PUBLIC_NGROK_URL=") {
        $envContent = $envContent -replace "EXPO_PUBLIC_NGROK_URL=.*", "EXPO_PUBLIC_NGROK_URL=$publicUrl"
    } else {
        if ($envContent -and -not $envContent.EndsWith("`n")) {
            $envContent += "`n"
        }
        $envContent += "EXPO_PUBLIC_NGROK_URL=$publicUrl`n"
    }
    
    Set-Content -Path $envFile -Value $envContent -NoNewline
    Write-Host "SUCCESS: Updated .env file with Ngrok URL" -ForegroundColor Green
    
    # Save Ngrok URL to a file for reference
    Set-Content -Path "ngrok-url.txt" -Value $publicUrl
    Write-Host "Ngrok URL saved to ngrok-url.txt" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Restart Expo: npx expo start --clear" -ForegroundColor White
    Write-Host "2. The app will now use: $publicUrl/api" -ForegroundColor White
    Write-Host ""
    Write-Host "NOTE: Ngrok URL changes each time you restart (free plan)" -ForegroundColor Yellow
    Write-Host "TIP: Use ngrok http 8000 --domain=your-domain.ngrok-free.app for static domain" -ForegroundColor Cyan
    
    # Keep script running (only if we started ngrok)
    if ($ngrokProcess) {
        Write-Host ""
        Write-Host "To stop Ngrok, press Ctrl+C or run: Stop-Process -Id $($ngrokProcess.Id)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Ngrok is running. Press Ctrl+C to stop..." -ForegroundColor Cyan
        try {
            Wait-Process -Id $ngrokProcess.Id
        } catch {
            Write-Host ""
            Write-Host "Stopping Ngrok..." -ForegroundColor Yellow
            Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host ""
        Write-Host "Ngrok is already running. To stop it, close the ngrok window or run: Stop-Process -Name ngrok" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Could not get Ngrok public URL" -ForegroundColor Red
    if ($ngrokProcess) {
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    }
    exit 1
}
