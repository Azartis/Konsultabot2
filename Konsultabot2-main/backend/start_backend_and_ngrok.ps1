# start_backend_and_ngrok.ps1
# Usage: Open PowerShell in repository root and run:
#   cd .\backend
#   .\start_backend_and_ngrok.ps1
#
# Requires: ngrok.exe in backend folder (or ngrok in PATH), Python (with Django), Node (for sync script)
# Output: backend/.ngrok-last-url and updates mobile config via sync_ngrok_url.js

param(
    [int]$Port = 8000,
    [string]$NgrokExe = ".\ngrok.exe"
)

Write-Host "Starting Django backend (0.0.0.0:$Port) and ngrok..." -ForegroundColor Cyan

# 1) Start Django dev server
# Check for manage.py in current directory or django_konsultabot subdirectory
$managePyPath = ".\manage.py"
$djangoDir = Get-Location
if (!(Test-Path $managePyPath)) {
    $managePyPath = ".\django_konsultabot\manage.py"
    if (!(Test-Path $managePyPath)) {
        Write-Host "Error: manage.py not found. Please run this script from the backend folder." -ForegroundColor Red
        exit 1
    }
    $djangoDir = Join-Path (Get-Location) "django_konsultabot"
    Write-Host "Found manage.py in: django_konsultabot"
} else {
    Write-Host "Found manage.py in: current directory"
}

# Start Django (non-blocking)
$djangoStart = Start-Process -FilePath "python" -ArgumentList "manage.py runserver 0.0.0.0:$Port" -NoNewWindow -PassThru -WorkingDirectory $djangoDir
Start-Sleep -Seconds 2
Write-Host "Django started (PID $($djangoStart.Id))."

# 2) Start ngrok
if (Test-Path $NgrokExe) {
    $ngrokPath = (Resolve-Path $NgrokExe).Path
    Write-Host "Using ngrok executable: $ngrokPath"
    $ngrok = Start-Process -FilePath $ngrokPath -ArgumentList "http $Port --log=stdout" -NoNewWindow -PassThru
} else {
    # try ngrok in PATH
    Write-Host "ngrok.exe not found in current folder. Trying 'ngrok' in PATH..."
    $ngrok = Start-Process -FilePath "ngrok" -ArgumentList "http $Port --log=stdout" -NoNewWindow -PassThru
}
Start-Sleep -Seconds 2
Write-Host "ngrok started (PID $($ngrok.Id)). Waiting for tunnel..."

# 3) Poll ngrok local API for public URL
$apiUrl = "http://127.0.0.1:4040/api/tunnels"
$publicUrl = $null
for ($i=0; $i -lt 30; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction Stop
        if ($resp.tunnels -and $resp.tunnels.Length -gt 0) {
            # prefer https tunnel
            $httpsTunnel = $resp.tunnels | Where-Object { $_.public_url -like "https:*" } | Select-Object -First 1
            if ($null -ne $httpsTunnel) {
                $publicUrl = $httpsTunnel.public_url
            } else {
                $publicUrl = $resp.tunnels[0].public_url
            }
            break
        }
    } catch {
        # ignore until ngrok is ready
    }
    Start-Sleep -Seconds 1
}

if (-not $publicUrl) {
    Write-Host "Failed to obtain ngrok public URL from local API. Check ngrok process and firewall." -ForegroundColor Red
    exit 1
}

Write-Host "Ngrok public URL: $publicUrl" -ForegroundColor Green

# 4) Save URL to file and update mobile config
$lastUrlFile = Join-Path (Get-Location) ".ngrok-last-url"
Set-Content -Path $lastUrlFile -Value $publicUrl -Force
Write-Host "Saved ngrok URL to $lastUrlFile"

# 5) Run Node sync script to update mobile config (if present)
$syncScript = Join-Path (Get-Location) "sync_ngrok_url.js"
if (Test-Path $syncScript) {
    Write-Host "Running sync_ngrok_url.js to update mobile app config..."
    # run Node script from backend folder (it expects path to backend/.ngrok-last-url)
    pushd ..
    node .\backend\sync_ngrok_url.js
    popd
    Write-Host "Mobile config updated (if mobile project exists)." -ForegroundColor Green
} else {
    Write-Host "sync_ngrok_url.js not found. Skipping mobile config auto-update." -ForegroundColor Yellow
}

Write-Host "Done. Keep this PowerShell window open while testing the mobile APK." -ForegroundColor Cyan

