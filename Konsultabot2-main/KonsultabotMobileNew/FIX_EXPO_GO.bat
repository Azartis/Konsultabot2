@echo off
color 0E
echo ========================================
echo  FIXING EXPO GO COMPATIBILITY
echo ========================================
echo.
echo The app has expo-dev-client which blocks
echo Expo Go from working. This will fix it!
echo.
pause

echo.
echo Step 1: Stopping any running Expo servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Step 2: Clearing Metro cache...
cd /d "%~dp0"
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Step 3: Starting Expo in Expo Go mode (no dev client)...
echo.
echo ========================================
echo  QR CODE WILL APPEAR BELOW
echo ========================================
echo.
echo How to connect:
echo 1. Open Expo Go app on your phone
echo 2. Tap "Scan QR code" 
echo 3. Scan the code below
echo 4. Wait for app to load
echo.
echo ========================================
echo.

set EXPO_USE_DEV_CLIENT=false
npx expo start --go --tunnel --clear

pause
