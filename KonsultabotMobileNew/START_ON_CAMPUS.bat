@echo off
color 0A
echo ========================================
echo  KonsultaBot Campus WiFi Startup
echo ========================================
echo.
echo This script will start your app for
echo campus WiFi demonstration!
echo.
echo IMPORTANT:
echo 1. Make sure you're connected to campus WiFi
echo 2. Backend should be running on another terminal
echo 3. Expo Go app should be installed on your phone
echo.
pause

echo.
echo ========================================
echo  Starting Expo with Tunnel Mode
echo ========================================
echo.
echo Tunnel mode bypasses campus firewall!
echo This works on ANY WiFi network.
echo.
echo QR Code will appear shortly...
echo Scan it with Expo Go app (not camera!)
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

npx expo start --tunnel --go --clear

pause
