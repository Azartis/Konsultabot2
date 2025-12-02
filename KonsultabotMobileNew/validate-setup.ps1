# Validation script to test Ngrok setup
# Usage: .\validate-setup.ps1

Write-Host "=== Konsultabot Ngrok Setup Validation ===" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Check backend
Write-Host "1. Checking Django Backend..." -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 5 -ErrorAction Stop
    if ($backend.StatusCode -eq 200) {
        Write-Host "   ✅ Backend is running on port 8000" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "   💡 Start it: python manage.py runserver 0.0.0.0:8000" -ForegroundColor Yellow
    $allGood = $false
}

# 2. Check Ngrok
Write-Host "`n2. Checking Ngrok..." -ForegroundColor Yellow
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
    $ngrokUrl = $tunnels.tunnels[0].public_url
    if ($ngrokUrl) {
        Write-Host "   ✅ Ngrok is running" -ForegroundColor Green
        Write-Host "   🌐 URL: $ngrokUrl" -ForegroundColor White
        
        # Ensure HTTPS
        if ($ngrokUrl -notmatch '^https://') {
            $ngrokUrl = $ngrokUrl -replace '^http://', 'https://'
        }
        
        # Test backend via Ngrok
        Write-Host "`n3. Testing Backend via Ngrok..." -ForegroundColor Yellow
        try {
            $test = Invoke-WebRequest -Uri "$ngrokUrl/api/health/" -TimeoutSec 10 -Headers @{'ngrok-skip-browser-warning'='true'} -ErrorAction Stop
            if ($test.StatusCode -eq 200) {
                Write-Host "   ✅ Backend is accessible via Ngrok!" -ForegroundColor Green
            }
        } catch {
            Write-Host "   ❌ Backend NOT accessible via Ngrok" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            $allGood = $false
        }
    }
} catch {
    Write-Host "   ❌ Ngrok is NOT running" -ForegroundColor Red
    Write-Host "   💡 Start it: .\start-ngrok.ps1" -ForegroundColor Yellow
    $allGood = $false
}

# 4. Check .env file
Write-Host "`n4. Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    if ($envContent -match "EXPO_PUBLIC_NGROK_URL=") {
        $envUrl = ($envContent -split "`n" | Select-String "EXPO_PUBLIC_NGROK_URL=").ToString() -replace "EXPO_PUBLIC_NGROK_URL=", ""
        Write-Host "   ✅ .env file exists" -ForegroundColor Green
        Write-Host "   📝 Ngrok URL in .env: $envUrl" -ForegroundColor White
        
        if ($envUrl -match '^https://') {
            Write-Host "   ✅ URL uses HTTPS" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  URL should use HTTPS" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ EXPO_PUBLIC_NGROK_URL not found in .env" -ForegroundColor Red
        Write-Host "   💡 Run: .\update-ngrok-url.ps1" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
    Write-Host "   💡 Run: .\start-ngrok.ps1" -ForegroundColor Yellow
    $allGood = $false
}

# 5. Check app.config.js
Write-Host "`n5. Checking app.config.js..." -ForegroundColor Yellow
if (Test-Path "app.config.js") {
    $configContent = Get-Content app.config.js -Raw
    if ($configContent -match "EXPO_PUBLIC_NGROK_URL") {
        Write-Host "   ✅ app.config.js references Ngrok URL" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  app.config.js may not use Ngrok URL" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ app.config.js not found" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host "`n=== Validation Summary ===" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ All checks passed! Ready to build APK." -ForegroundColor Green
    Write-Host "`nNext step: eas build --platform android --profile preview" -ForegroundColor Yellow
} else {
    Write-Host "❌ Some checks failed. Please fix the issues above." -ForegroundColor Red
}

