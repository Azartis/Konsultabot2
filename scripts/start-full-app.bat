@echo off
echo ========================================
echo  KonsultaBot - Full Application Startup
echo ========================================
echo.
echo This will start:
echo   1. Django Backend Server
echo   2. Expo Mobile App
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

cd /d "%~dp0\.."
cd /d "%~dp0\..\.."

echo.
echo Starting Backend Server...
start "KonsultaBot Backend" cmd /k "cd backend\django_konsultabot && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python manage.py runserver 0.0.0.0:8000"

timeout /t 3 /nobreak >nul

echo.
echo Starting Expo Mobile App...
cd KonsultabotMobileNew
call npm start

pause

