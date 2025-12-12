@echo off
title Emergency Fix - Konsultabot
color 0C
echo.
echo ========================================
echo   EMERGENCY FIX - App Won't Load
echo ========================================
echo.r

cd /d "%~dp0"

echo [1/5] Stopping all Node/Expo processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM expo.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Killing processes on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [3/5] Clearing ALL caches...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
if exist .metro rmdir /s /q .metro
if exist android\.gradle rmdir /s /q android\.gradle
if exist android\app\build rmdir /s /q android\app\build

echo.
echo [4/5] Reinstalling dependencies...
call npm install

echo.
echo [5/5] Starting Expo with clean cache...
echo.
echo ========================================
echo   Starting Expo...
echo ========================================
echo.
echo IMPORTANT:
echo - Press 'a' to open Android emulator
echo - Or scan QR code with Expo Go
echo - Check console for errors
echo.

npx expo start --clear --reset-cache

pause

