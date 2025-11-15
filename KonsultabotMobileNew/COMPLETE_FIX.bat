@echo off
title Complete Expo Fix
color 0C
echo.
echo ========================================
echo   COMPLETE EXPO FIX - Running Now
echo ========================================
echo.

cd /d "%~dp0"

echo [STEP 1/6] Killing all processes...
taskkill /F /IM node.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 3 /nobreak >nul
echo Done.

echo.
echo [STEP 2/6] Removing all caches...
if exist node_modules\.cache (
    echo Removing node_modules cache...
    rmdir /s /q node_modules\.cache
)
if exist .expo (
    echo Removing .expo cache...
    rmdir /s /q .expo
)
if exist .metro (
    echo Removing .metro cache...
    rmdir /s /q .metro
)
echo Done.

echo.
echo [STEP 3/6] Removing and reinstalling react-native-reanimated...
call npm uninstall react-native-reanimated
call npm install react-native-reanimated@3.16.1 --legacy-peer-deps --save
if errorlevel 1 (
    echo ERROR: Failed to install reanimated
pause
    exit /b 1
)
echo Done.

echo.
echo [STEP 4/6] Verifying installation...
call npm list react-native-reanimated
echo.

echo [STEP 5/6] Reinstalling all dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: Installation failed
    pause
    exit /b 1
)
echo Done.

echo.
echo [STEP 6/6] Starting Expo with clean cache...
echo.
echo ========================================
echo   Starting Expo Development Server
echo ========================================
echo.
echo This may take 1-2 minutes to bundle...
echo.
echo ========================================
echo.

call npx expo start --clear

pause
