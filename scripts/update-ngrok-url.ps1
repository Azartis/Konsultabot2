# ============================================
# Update Ngrok URL Script
# ============================================
# This script updates the ngrok URL in all necessary places:
# 1. mobile_api_url.txt (root)
# 2. KonsultabotMobileNew/.env (EXPO_PUBLIC_NGROK_URL)
# 3. Backend .env (NGROK_URL)
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$NgrokUrl = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Update Ngrok URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# If no URL provided, try to get from ngrok API
if (-not $NgrokUrl) {
    Write-Host "Attempting to get ngrok URL from local ngrok instance..." -ForegroundColor Yellow
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
        $NgrokUrl = $tunnels.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url
        if ($NgrokUrl) {
            Write-Host "✅ Found ngrok URL: $NgrokUrl" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No HTTPS tunnel found in ngrok" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not connect to ngrok API (is ngrok running?)" -ForegroundColor Yellow
    }
}

# If still no URL, prompt user
if (-not $NgrokUrl) {
    $NgrokUrl = Read-Host "Enter ngrok HTTPS URL (e.g., https://abc123.ngrok-free.dev)"
}

# Validate URL
if (-not $NgrokUrl -or (-not $NgrokUrl.StartsWith('https://'))) {
    Write-Host "❌ Invalid URL. Must start with https://" -ForegroundColor Red
    exit 1
}

# Remove trailing slash
$NgrokUrl = $NgrokUrl.TrimEnd('/')
$ApiUrl = "$NgrokUrl/api"

Write-Host ""
Write-Host "Updating files..." -ForegroundColor Yellow

# 1. Update mobile_api_url.txt
$mobileApiFile = "mobile_api_url.txt"
if (Test-Path $mobileApiFile) {
    $content = Get-Content $mobileApiFile -Raw
    $content = $content -replace 'NGROK_URL=.*', "NGROK_URL=$NgrokUrl"
    $content = $content -replace 'API_BASE_URL=.*', "API_BASE_URL=$ApiUrl"
    Set-Content $mobileApiFile -Value $content -NoNewline
    Write-Host "  ✅ Updated $mobileApiFile" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  $mobileApiFile not found (creating...)" -ForegroundColor Yellow
    @"
NGROK_URL=$NgrokUrl
API_BASE_URL=$ApiUrl
"@ | Set-Content $mobileApiFile
    Write-Host "  ✅ Created $mobileApiFile" -ForegroundColor Green
}

# 2. Update KonsultabotMobileNew/.env
$mobileEnvFile = "KonsultabotMobileNew\.env"
if (Test-Path $mobileEnvFile) {
    $content = Get-Content $mobileEnvFile -Raw
    if ($content -match 'EXPO_PUBLIC_NGROK_URL=') {
        $content = $content -replace 'EXPO_PUBLIC_NGROK_URL=.*', "EXPO_PUBLIC_NGROK_URL=$NgrokUrl"
    } else {
        $content += "`nEXPO_PUBLIC_NGROK_URL=$NgrokUrl`n"
    }
    if ($content -match 'EXPO_PUBLIC_BACKEND_URL=') {
        $content = $content -replace 'EXPO_PUBLIC_BACKEND_URL=.*', "EXPO_PUBLIC_BACKEND_URL=$NgrokUrl"
    } else {
        $content += "`nEXPO_PUBLIC_BACKEND_URL=$NgrokUrl`n"
    }
    Set-Content $mobileEnvFile -Value $content -NoNewline
    Write-Host "  ✅ Updated $mobileEnvFile" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  $mobileEnvFile not found (creating...)" -ForegroundColor Yellow
    @"
EXPO_PUBLIC_NGROK_URL=$NgrokUrl
EXPO_PUBLIC_BACKEND_URL=$NgrokUrl
"@ | Set-Content $mobileEnvFile
    Write-Host "  ✅ Created $mobileEnvFile" -ForegroundColor Green
}

# 3. Update backend .env
$backendEnvFile = "backend\django_konsultabot\.env"
if (Test-Path $backendEnvFile) {
    $content = Get-Content $backendEnvFile -Raw
    if ($content -match 'NGROK_URL=') {
        $content = $content -replace 'NGROK_URL=.*', "NGROK_URL=$NgrokUrl"
    } else {
        $content += "`nNGROK_URL=$NgrokUrl`n"
    }
    Set-Content $backendEnvFile -Value $content -NoNewline
    Write-Host "  ✅ Updated $backendEnvFile" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  $backendEnvFile not found (skipping)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Ngrok URL Updated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Django server if running" -ForegroundColor Gray
Write-Host "  2. Rebuild APK: cd KonsultabotMobileNew && npm run build:apk" -ForegroundColor Gray
Write-Host ""

