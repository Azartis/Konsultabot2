@echo off
color 0A
echo ========================================
echo  CLEARING CACHE AND FIXING ERROR
echo ========================================
echo.

echo Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Clearing caches...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist ".expo" rmdir /s /q ".expo"
if exist ".metro" rmdir /s /q ".metro"

echo.
echo ========================================
echo  Starting Expo (this may take a minute)
echo ========================================
echo.

npx expo start --web --clear --port 8087

pause
