@echo off
title NUCLEAR FIX - Complete Reinstall
color 0E
echo.
echo ========================================
echo   NUCLEAR FIX - Complete Clean Reinstall
echo   This will fix ALL issues
echo ========================================
echo.
echo WARNING: This will delete node_modules
echo and reinstall everything fresh.
echo.
pause

cd /d "%~dp0"

echo.
echo [1/7] Killing ALL Node/Expo processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM expo.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    echo Killing process %%a on port 8081...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 3 /nobreak >nul
echo Done.

echo.
echo [2/7] Removing ALL caches and temp files...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
if exist .metro rmdir /s /q .metro
if exist .tmp rmdir /s /q .tmp
if exist package-lock.json del /q package-lock.json
echo Done.

echo.
echo [3/7] Removing node_modules completely...
if exist node_modules (
    echo This may take a minute...
    rmdir /s /q node_modules
)
echo Done.

echo.
echo [4/7] Verifying package.json has correct reanimated version...
findstr /C:"react-native-reanimated" package.json
echo.

echo [5/7] Installing ALL dependencies fresh...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    echo.
    pause
    exit /b 1
)
echo Done.

echo.
echo [6/7] Verifying react-native-reanimated installation...
call npm list react-native-reanimated
echo.

echo [7/7] Starting Expo with completely clean cache...
echo.
echo ========================================
echo   Starting Expo Development Server
echo ========================================
echo.
echo The app should now work correctly!
echo.
echo ========================================
echo.

call npx expo start --clear

pause
