@echo off
title Fix Android Emulator - Konsultabot
color 0B
echo.
echo ========================================
echo   Fixing Android Emulator Issues
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Killing processes on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [2/4] Clearing Metro bundler cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo

echo.
echo [3/4] Clearing watchman cache (if installed)...
where watchman >nul 2>&1
if %errorlevel% == 0 (
    watchman watch-del-all >nul 2>&1
    echo Watchman cache cleared
) else (
    echo Watchman not installed, skipping
)

echo.
echo [4/4] Starting Expo with clean cache...
echo.
echo ========================================
echo   Starting Expo...
echo ========================================
echo.
echo Press 'a' in the Expo terminal to open Android emulator
echo Or scan QR code with Expo Go app
echo.

npx expo start --clear

pause

