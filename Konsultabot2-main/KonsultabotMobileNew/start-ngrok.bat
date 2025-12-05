@echo off
REM Batch script to start Ngrok and update Expo config
REM Usage: start-ngrok.bat

echo 🚀 Starting Ngrok for Konsultabot Backend...

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ngrok is not installed or not in PATH
    echo 📥 Install Ngrok from: https://ngrok.com/download
    pause
    exit /b 1
)

REM Check if backend is running
curl -s http://localhost:8000/api/health/ >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Backend is not running on port 8000
    echo 💡 Start your Django backend first: python manage.py runserver
    pause
)

REM Start Ngrok
echo 🌐 Starting Ngrok tunnel...
start /B ngrok http 8000

REM Wait for Ngrok to start
timeout /t 3 /nobreak >nul

REM Get Ngrok URL using PowerShell
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels'; $url = $response.tunnels[0].public_url; Write-Host '✅ Ngrok tunnel established!'; Write-Host '🌐 Public URL:' $url; if (Test-Path '.env') { $content = Get-Content '.env' -Raw; if ($content -match 'EXPO_PUBLIC_NGROK_URL=') { $content = $content -replace 'EXPO_PUBLIC_NGROK_URL=.*', \"EXPO_PUBLIC_NGROK_URL=$url\" } else { $content += \"`nEXPO_PUBLIC_NGROK_URL=$url`n\" }; Set-Content -Path '.env' -Value $content -NoNewline; Write-Host '✅ Updated .env file'; } else { Set-Content -Path '.env' -Value \"EXPO_PUBLIC_NGROK_URL=$url`n\"; Write-Host '✅ Created .env file'; }; Set-Content -Path 'ngrok-url.txt' -Value $url; Write-Host '📝 Ngrok URL saved to ngrok-url.txt'; Write-Host ''; Write-Host '📱 Next steps:'; Write-Host '1. Restart Expo: npx expo start --clear'; Write-Host \"2. The app will now use: $url/api\"; } catch { Write-Host '❌ Error:' $_.Exception.Message }"

echo.
echo ⏳ Ngrok is running. Press any key to stop...
pause >nul

REM Stop Ngrok
taskkill /F /IM ngrok.exe >nul 2>&1
echo 🛑 Ngrok stopped.

