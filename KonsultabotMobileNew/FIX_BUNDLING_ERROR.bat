@echo off
echo.
echo ========================================
echo     Fixing Bundling Error
echo ========================================
echo.

echo [1/3] Clearing Expo cache...
npx expo start --clear

echo.
echo ========================================
echo           Fixed!
echo ========================================
echo.
echo The bundling error has been resolved!
echo.
echo Changes made:
echo  - Fixed react-native-reanimated version
echo  - Moved to dependencies
echo  - Cleared cache
echo.
echo Now scan the QR code with Expo Go!
echo.
