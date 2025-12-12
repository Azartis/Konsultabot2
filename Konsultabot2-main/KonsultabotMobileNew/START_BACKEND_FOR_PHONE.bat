@echo off
title Konsultabot Backend - Phone Access
color 0B
echo.
echo ========================================
echo   Starting Backend for Phone Access
echo ========================================
echo.

cd /d "%~dp0"

REM Get IP address
echo [1/3] Finding your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)

:found
REM Remove leading space
set IP=%IP:~1%
echo.
echo ✅ Your Computer IP: %IP%
echo.
echo 📱 Backend will be accessible at: http://%IP%:8000
echo.

REM Check if backend folder exists
if not exist "..\backend\" (
    echo ERROR: Backend folder not found!
    echo Please make sure you're running this from KonsultabotMobileNew folder
    pause
    exit /b 1
)

echo [2/3] Activating virtual environment (if exists)...
cd ..\backend
if exist "..\gemini_venv\Scripts\activate.bat" (
    call ..\gemini_venv\Scripts\activate.bat
    echo Virtual environment activated.
) else (
    echo No virtual environment found, using system Python.
)

echo.
echo [3/3] Starting Django backend on 0.0.0.0:8000...
echo.
echo ⚠️  IMPORTANT: Make sure your phone is on the same WiFi network!
echo.
echo Backend will be accessible at:
echo   • http://localhost:8000 (on this computer)
echo   • http://%IP%:8000 (from your phone)
echo.
echo ========================================
echo.

REM Try to find manage.py
if exist "konsultabot_backend\manage.py" (
    cd konsultabot_backend
    python manage.py runserver 0.0.0.0:8000
) else if exist "django_konsultabot\manage.py" (
    cd django_konsultabot
    python manage.py runserver 0.0.0.0:8000
) else if exist "manage.py" (
    python manage.py runserver 0.0.0.0:8000
) else (
    echo ERROR: No Django manage.py found!
    echo Please check your backend directory structure.
    pause
    exit /b 1
)

pause

