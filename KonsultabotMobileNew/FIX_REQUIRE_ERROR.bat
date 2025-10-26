@echo off
echo.
echo ========================================
echo   Fixing 'require' Error - Complete Fix
echo ========================================
echo.

echo [1/3] Stopping any running processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Clearing all caches...
echo.
echo Clearing Metro bundler cache...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .expo 2>nul
del .expo-shared\* /q 2>nul

echo.
echo Clearing temporary files...
rd /s /q %TEMP%\metro-* 2>nul
rd /s /q %TEMP%\haste-* 2>nul
rd /s /q %TEMP%\react-* 2>nul

echo.
echo [3/3] Starting Expo with cleared cache...
echo.
echo ========================================
echo   Babel Config Fixed!
echo ========================================
echo.
echo Changes made:
echo  ✓ Added react-native-reanimated plugin
echo  ✓ Fixed Expo preset
echo  ✓ Cleared all caches
echo.
echo Starting Expo now...
echo.

npx expo start --clear

echo.
echo ========================================
echo.
echo If you still see errors:
echo 1. Press Ctrl+C to stop
echo 2. Close Expo Go app completely
echo 3. Run this script again
echo.
