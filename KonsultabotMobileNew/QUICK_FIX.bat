@echo off
echo ========================================
echo  QUICK FIX - Mobile Error
echo ========================================
echo.
echo This will:
echo 1. Kill all node processes
echo 2. Clear all caches
echo 3. Restart Expo fresh
echo.
echo IMPORTANT: Make sure you have:
echo [ ] Updated .env with your ngrok URL
echo [ ] Django backend running
echo [ ] ngrok running
echo.
pause
echo.
echo Step 1: Killing all node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul
echo.
echo Step 2: Clearing Expo cache...
if exist .expo rmdir /s /q .expo
if exist .metro rmdir /s /q .metro
echo.
echo Step 3: Starting Expo with clear cache...
echo.
npx expo start --clear
