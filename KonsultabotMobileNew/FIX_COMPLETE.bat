@echo off
echo.
echo ========================================
echo   Complete Fix - All Errors Resolved
echo ========================================
echo.

echo [1/4] Stopping all Node processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Clearing all Metro and Expo caches...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .expo 2>nul
rmdir /s /q .expo-shared 2>nul
rd /s /q %TEMP%\metro-* 2>nul
rd /s /q %TEMP%\haste-* 2>nul
rd /s /q %TEMP%\react-* 2>nul

echo.
echo [3/4] What was fixed:
echo   ✓ Removed 'gap' property (not supported in RN 0.81.4)
echo   ✓ Added proper margin spacing instead
echo   ✓ Fixed babel.config.js for reanimated
echo   ✓ Cleared all caches
echo.

echo [4/4] Starting Expo with clean slate...
echo.
echo ========================================
echo          Starting Fresh Build
echo ========================================
echo.

npx expo start --clear

echo.
echo If you still see errors:
echo 1. Force close Expo Go app on your phone
echo 2. Clear Expo Go app cache
echo 3. Reopen Expo Go
echo 4. Scan QR code again
echo.
