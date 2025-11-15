@echo off
title Konsultabot - Start Backend + Mobile
color 0B
echo.
echo ========================================
echo   Starting Konsultabot (Backend + Mobile)
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server...
start "Konsultabot Backend" cmd /k "cd /d %~dp0backend\django_konsultabot && if exist ..\..\gemini_venv\Scripts\activate.bat (call ..\..\gemini_venv\Scripts\activate.bat) && echo Backend starting on http://localhost:8000 && python manage.py runserver 0.0.0.0:8000"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Starting Mobile App (Expo)...
cd KonsultabotMobileNew
start "Expo Metro" cmd /k "npx expo start --clear"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend: http://localhost:8000
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

