@echo off
color 0A
cls
echo ========================================
echo  KONSULTABOT MOBILE - EXPO GO MODE
echo ========================================
echo.
echo expo-dev-client has been REMOVED!
echo This will now work with Expo Go app!
echo.
echo ========================================
echo.
pause

echo Starting Expo in Go mode with tunnel...
echo.
echo After QR code appears:
echo 1. Open Expo Go app on your phone
echo 2. Tap "Scan QR code"
echo 3. Scan the code below
echo 4. Wait for app to load
echo.
echo ========================================
echo.

npx expo start --go --tunnel

pause
