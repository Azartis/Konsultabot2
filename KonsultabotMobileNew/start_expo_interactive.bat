@echo off
title Konsultabot Mobile - Expo Interactive
echo.
echo ========================================
echo   Starting Expo with Interactive Menu
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)

REM Navigate to project directory
cd /d "%~dp0"

REM Kill any process using port 8081
echo Clearing port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

REM Check dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
)

echo.
echo ========================================
echo   Starting Expo Development Server
echo ========================================
echo.
echo You should see:
echo - QR code for mobile testing
echo - Interactive menu with options
echo.
echo Press 'w' to open in web browser
echo Press 'a' for Android emulator
echo Press 'i' for iOS simulator
echo.
echo ========================================
echo.

REM Start Expo with clear cache and interactive mode
call npx expo start --clear

pause

