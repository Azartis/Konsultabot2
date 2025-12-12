@echo off
title Konsultabot Mobile - Clean Expo Start
echo.
echo ========================================
echo   Starting Expo (Clearing Port 8081)
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the KonsultabotMobileNew directory
    echo.
    pause
    exit /b 1
)

REM Kill any process using port 8081
echo Checking for processes using port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)

REM Wait a moment for port to be released
timeout /t 2 /nobreak >nul

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

REM Start Expo
echo Starting Expo development server...
echo.
echo You should see a QR code in the terminal.
echo.
echo To use on your phone:
echo 1. Install "Expo Go" app from App Store/Play Store
echo 2. Make sure your phone is on the same WiFi network
echo 3. Scan the QR code with Expo Go app
echo.
echo To use in web browser:
echo - Press 'w' in the terminal to open in web browser
echo.
echo ========================================
echo.

call npm start

pause

