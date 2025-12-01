# Check Ngrok Status Script
Write-Host "🔍 Checking Ngrok Status..." -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is running
try {
    $ngrokResponse = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
    $tunnel = $ngrokResponse.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
    
    if ($tunnel) {
        $ngrokUrl = $tunnel.public_url
        Write-Host "✅ Ngrok is RUNNING" -ForegroundColor Green
        Write-Host "🌐 Public URL: $ngrokUrl" -ForegroundColor Yellow
        Write-Host ""
        
        # Test if backend is accessible
        Write-Host "🔗 Testing backend connection..." -ForegroundColor Cyan
        try {
            $healthCheck = Invoke-RestMethod -Uri "$ngrokUrl/api/health/" -Method Get -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ Backend is ACCESSIBLE via Ngrok!" -ForegroundColor Green
            Write-Host ""
            
            # Check .env file
            $envPath = Join-Path $PSScriptRoot ".env"
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
                if ($envContent -match "EXPO_PUBLIC_NGROK_URL") {
                    Write-Host "✅ .env file exists with NGROK_URL" -ForegroundColor Green
                    $currentUrl = ($envContent | Select-String -Pattern "EXPO_PUBLIC_NGROK_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
                    if ($currentUrl -eq $ngrokUrl) {
                        Write-Host "✅ .env URL matches current Ngrok URL" -ForegroundColor Green
                    } else {
                        Write-Host "⚠️  .env URL ($currentUrl) doesn't match current Ngrok URL" -ForegroundColor Yellow
                        Write-Host "   Update .env file with: EXPO_PUBLIC_NGROK_URL=$ngrokUrl" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "⚠️  .env file exists but no EXPO_PUBLIC_NGROK_URL found" -ForegroundColor Yellow
                    Write-Host "   Add to .env: EXPO_PUBLIC_NGROK_URL=$ngrokUrl" -ForegroundColor Yellow
                }
            } else {
                Write-Host "⚠️  .env file NOT FOUND" -ForegroundColor Yellow
                Write-Host "   Creating .env file with Ngrok URL..." -ForegroundColor Yellow
                "EXPO_PUBLIC_NGROK_URL=$ngrokUrl" | Out-File -FilePath $envPath -Encoding utf8
                Write-Host "✅ Created .env file" -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "📱 For your phone APK:" -ForegroundColor Cyan
            Write-Host "   1. Make sure backend is running: python manage.py runserver" -ForegroundColor White
            Write-Host "   2. Ngrok URL: $ngrokUrl" -ForegroundColor White
            Write-Host "   3. Rebuild APK with: eas build --platform android" -ForegroundColor White
            Write-Host "   4. Or update app.config.js with: ngrokUrl: '$ngrokUrl'" -ForegroundColor White
        } catch {
            Write-Host "❌ Backend is NOT accessible via Ngrok" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "💡 Make sure:" -ForegroundColor Yellow
            Write-Host "   1. Django backend is running on port 8000" -ForegroundColor White
            Write-Host "   2. Backend is accessible at: http://localhost:8000" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  Ngrok is running but no HTTPS tunnel found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ngrok is NOT RUNNING" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 To start Ngrok:" -ForegroundColor Yellow
    Write-Host "   1. Run: .\start-ngrok.ps1" -ForegroundColor White
    Write-Host "   2. Or manually: ngrok http 8000" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Note: For APK on physical phone, Ngrok is REQUIRED!" -ForegroundColor Cyan
    Write-Host "   The phone can't access localhost or local IP addresses." -ForegroundColor White
}

Write-Host ""
