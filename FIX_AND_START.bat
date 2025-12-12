@echo off
title Fixing and Starting Expo
echo.
echo ========================================
echo   Complete Fix and Restart
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Killing all Node/Expo processes...
taskkill /F /IM node.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [2/5] Clearing all caches...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
if exist .metro rmdir /s /q .metro
if exist .tmp rmdir /s /q .tmp
echo Cache cleared.

echo [3/5] Reinstalling dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: Installation failed
    pause
    exit /b 1
)

echo [4/5] Verifying reanimated version...
call npm list react-native-reanimated

echo [5/5] Starting Expo...
echo.
echo ========================================
echo   Starting Development Server
echo ========================================
echo.

call npx expo start --clear

pause

