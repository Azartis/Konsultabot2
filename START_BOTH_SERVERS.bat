@echo off
title Konsultabot - Start Backend + Mobile
color 0A
echo.
echo ========================================
echo   Starting Konsultabot Backend + Mobile
echo ========================================
echo.

cd /d "%~dp0"

REM Step 1: Start Backend Server
echo [1/2] Starting Backend Server...
echo.
start "Konsultabot Backend" cmd /k "cd /d %~dp0backend\django_konsultabot && if exist ..\..\gemini_venv\Scripts\activate.bat (call ..\..\gemini_venv\Scripts\activate.bat) && python manage.py runserver 0.0.0.0:8000"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Step 2: Start Mobile App
echo.
echo [2/2] Starting Mobile App (Expo)...
echo.
cd KonsultabotMobileNew
start "Expo Metro" cmd /k "npx expo start --clear"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Expo: Check the Expo window for QR code
echo.
echo Default login credentials:
echo   Username: admin
echo   Password: admin123
echo.
pause

