@echo off
title Expo Development Server - Konsultabot Mobile
color 0A
echo.
echo ========================================
echo   Konsultabot Mobile - Expo Server
echo ========================================
echo.

cd /d "%~dp0"

REM Kill existing Metro bundler on port 8081
echo [1/3] Clearing port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

REM Check dependencies
echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies... This may take a few minutes.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo [3/3] Starting Expo development server...
echo.
echo ========================================
echo   IMPORTANT: Look for the QR code below!
echo ========================================
echo.
echo After Metro bundler starts, you will see:
echo   - A QR code (scan with Expo Go app)
echo   - Interactive menu options
echo.
echo Quick commands:
echo   Press 'w' = Open in web browser
echo   Press 'a' = Open Android emulator
echo   Press 'i' = Open iOS simulator
echo   Press 'r' = Reload app
echo   Press 'm' = Toggle menu
echo.
echo ========================================
echo.

REM Start Expo with --go flag to show QR code immediately
call npx expo start --go --clear

pause

