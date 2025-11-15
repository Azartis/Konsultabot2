@echo off
title Konsultabot - Quick Start (Backend + Mobile)
color 0B
echo.
echo ========================================
echo   Konsultabot Quick Start
echo   Starting Backend + Mobile App
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend Server (Django on port 8000)...
start "Konsultabot Backend" cmd /k "cd /d %~dp0backend\django_konsultabot && if exist ..\..\gemini_venv\Scripts\activate.bat (call ..\..\gemini_venv\Scripts\activate.bat) && echo Backend starting on http://localhost:8000 && python manage.py runserver 0.0.0.0:8000"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Testing backend connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/auth/login/' -Method GET -UseBasicParsing -TimeoutSec 2; Write-Host 'Backend is running!' -ForegroundColor Green } catch { Write-Host 'Backend starting... (this is normal)' -ForegroundColor Yellow }"

echo.
echo [3/3] Starting Mobile App (Expo)...
cd KonsultabotMobileNew
start "Expo Metro" cmd /k "npx expo start --clear"

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Backend Server: http://localhost:8000
echo   - Login: http://localhost:8000/api/auth/login/
echo   - Health: http://localhost:8000/health/
echo.
echo Mobile App: Check Expo window for QR code
echo.
echo Default Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo ========================================
echo.
pause

