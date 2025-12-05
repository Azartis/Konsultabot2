@echo off
title Fix Backend - Konsultabot
color 0B
echo.
echo ========================================
echo   Fixing Backend Configuration
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Django installation...
cd django_konsultabot
python manage.py check --deploy

echo.
echo [2/3] Running migrations...
python manage.py migrate

echo.
echo [3/3] Collecting static files...
python manage.py collectstatic --noinput

echo.
echo ========================================
echo   Backend Fixes Applied!
echo ========================================
echo.
echo Changes made:
echo   - Added /api/health/ endpoint
echo   - Fixed CORS settings for mobile app
echo   - Updated ALLOWED_HOSTS
echo   - Improved login error handling
echo.
echo To start the backend:
echo   python manage.py runserver 0.0.0.0:8000
echo.
pause

