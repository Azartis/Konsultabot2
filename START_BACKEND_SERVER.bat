@echo off
title Konsultabot Backend Server
color 0B
echo.
echo ========================================
echo   Starting Konsultabot Backend Server
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo [1/3] Activating virtual environment (if exists)...
if exist "gemini_venv\Scripts\activate.bat" (
    call gemini_venv\Scripts\activate.bat
    echo Virtual environment activated.
) else (
    echo No virtual environment found, using system Python.
)

echo.
echo [2/3] Checking backend directory...
if not exist "backend\" (
    echo ERROR: Backend folder not found!
    pause
    exit /b 1
)

cd backend

echo.
echo [3/3] Starting Django backend server on port 8000...
echo.
echo Backend will be available at:
echo   - http://localhost:8000
echo   - http://localhost:8000/api/auth/login/
echo.
echo ========================================
echo.

REM Activate virtual environment if it exists
if exist "..\gemini_venv\Scripts\activate.bat" (
    call ..\gemini_venv\Scripts\activate.bat
)

REM Try Django backend first
if exist "django_konsultabot\manage.py" (
    echo Starting Django backend...
    cd django_konsultabot
    python manage.py runserver 0.0.0.0:8000
) else if exist "manage.py" (
    echo Starting Django backend...
    python manage.py runserver 0.0.0.0:8000
) else (
    echo ERROR: No Django manage.py found!
    echo Trying Flask auth API instead...
    if exist "simple_auth_api.py" (
        echo Starting Flask auth API on port 5000...
        python simple_auth_api.py
    ) else (
        echo ERROR: No backend server found!
        pause
        exit /b 1
    )
)

pause

