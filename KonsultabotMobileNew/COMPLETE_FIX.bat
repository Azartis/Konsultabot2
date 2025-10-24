@echo off
color 0C
echo ========================================
echo  COMPLETE FIX - Reinstalling Everything
echo ========================================
echo.
echo This will:
echo 1. Delete node_modules
echo 2. Delete package-lock.json
echo 3. Clear all caches
echo 4. Reinstall everything fresh
echo.
echo This may take 5-10 minutes...
echo.
pause

echo.
echo Stopping processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Deleting old files...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"
if exist ".expo" rmdir /s /q ".expo"
if exist ".metro" rmdir /s /q ".metro"

echo.
echo Installing packages (this will take a while)...
npm install --legacy-peer-deps

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Now starting Expo...
npx expo start --web --clear

pause
