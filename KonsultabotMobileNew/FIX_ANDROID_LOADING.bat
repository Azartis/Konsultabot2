@echo off
title Fix Android Emulator Loading Issue
color 0E
echo.
echo ========================================
echo   Fixing Android Emulator Loading Issue
echo ========================================
echo.

cd /d "%~dp0"

echo [1/7] Stopping all Node/Expo processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM expo.exe >nul 2>&1
taskkill /F /IM metro.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo [2/7] Killing processes on ports 8081, 19000, 19001, 19002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :19000') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :19001') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :19002') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo.
echo [3/7] Clearing ALL caches...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
if exist .metro rmdir /s /q .metro
if exist android\.gradle rmdir /s /q android\.gradle
if exist android\app\build rmdir /s /q android\app\build
if exist %TEMP%\metro-* rmdir /s /q %TEMP%\metro-* 2>nul
if exist %TEMP%\haste-* rmdir /s /q %TEMP%\haste-* 2>nul

echo.
echo [4/7] Clearing watchman cache (if installed)...
where watchman >nul 2>&1
if %errorlevel% == 0 (
    watchman watch-del-all >nul 2>&1
    echo Watchman cache cleared
) else (
    echo Watchman not installed, skipping
)

echo.
echo [5/7] Clearing npm cache...
call npm cache clean --force

echo.
echo [6/7] Reinstalling dependencies...
call npm install --legacy-peer-deps

echo.
echo [7/7] Starting Expo with complete reset...
echo.
echo ========================================
echo   Starting Expo - Android Emulator Fix
echo ========================================
echo.
echo IMPORTANT STEPS:
echo 1. Wait for Metro bundler to start
echo 2. Press 'a' to open Android emulator
echo 3. If emulator is already open, press 'r' to reload
echo 4. If still stuck, close emulator and restart it
echo 5. Check Android Studio for emulator errors
echo.
echo TROUBLESHOOTING:
echo - If still stuck, try: adb kill-server ^&^& adb start-server
echo - Check Android emulator is running: adb devices
echo - Make sure emulator has internet connection
echo - Try cold booting the emulator
echo.

npx expo start --clear --reset-cache --android

pause

