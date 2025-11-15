@echo off
color 0E
echo ========================================
echo  FIXING BUNDLER ERROR
echo ========================================
echo.
echo This will:
echo 1. Kill any running Metro processes
echo 2. Clear all caches
echo 3. Restart fresh
echo.
pause

echo.
echo Step 1: Stopping all Metro bundlers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Step 2: Clearing Metro cache...
if exist .metro rmdir /s /q .metro
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Step 3: Clearing Expo cache...
if exist .expo rmdir /s /q .expo

echo Step 4: Clearing temp files...
del /q /s *.tmp 2>nul

echo.
echo ========================================
echo  Starting fresh Expo server...
echo ========================================
echo.

npx expo start --clear --web

pause
