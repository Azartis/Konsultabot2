@echo off
echo.
echo ========================================
echo    KonsultaBot - Mobile Setup Helper
echo ========================================
echo.

REM Get WiFi IP Address
echo [1/4] Finding your computer's IP address...
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)

:found
REM Remove leading space
set IP=%IP:~1%
echo Your Computer IP: %IP%
echo.

REM Check if backend folder exists
if not exist "..\backend\" (
    echo ERROR: Backend folder not found!
    echo Please make sure you're running this from KonsultabotMobileNew folder
    pause
    exit /b 1
)

echo.
echo ========================================
echo   IMPORTANT: Update API Configuration
echo ========================================
echo.
echo Before running on mobile, you need to:
echo.
echo 1. Open: src\services\apiService.js
echo 2. Find line 23 (baseURL)
echo 3. Change to: 'http://%IP%:8000/api'
echo.
echo Current line should look like:
echo   baseURL: Platform.OS === 'web' ? 'http://localhost:8000/api' : 'http://%IP%:8000/api'
echo.
echo.
set /p UPDATED="Have you updated the IP? (y/n): "
if /i not "%UPDATED%"=="y" (
    echo.
    echo Please update the IP first, then run this script again.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Starting Backend Server on all network interfaces...
echo Backend will be accessible at: http://%IP%:8000
echo.
start "KonsultaBot Backend" cmd /k "cd /d ..\backend && python manage.py runserver 0.0.0.0:8000"

REM Wait for backend to start
timeout /t 5 /nobreak > nul

echo.
echo [3/4] Checking backend health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/health/' -UseBasicParsing; Write-Host 'Backend is running! Status:' $response.StatusCode -ForegroundColor Green } catch { Write-Host 'Backend not ready yet. Give it a moment...' -ForegroundColor Yellow }"
echo.

echo.
echo [4/4] Starting Expo Metro Bundler...
echo.
start "Expo Metro" cmd /k "npx expo start"

echo.
echo ========================================
echo            Setup Complete!
echo ========================================
echo.
echo Backend Server: http://%IP%:8000
echo Expo Metro:     Will show QR code
echo.
echo NEXT STEPS:
echo.
echo 1. Install "Expo Go" app on your phone
echo 2. Make sure phone is on SAME WiFi
echo 3. Scan QR code from Expo terminal
echo 4. App will load on your phone!
echo.
echo TESTING MICROPHONE:
echo - Tap the microphone button (mic icon)
echo - Allow permission when asked
echo - Button turns red when recording
echo - Tap stop to finish recording
echo.
echo ========================================
echo.
echo Press any key to open the mobile setup guide...
pause > nul
start "" "MOBILE_EXPO_GO_SETUP.md"
