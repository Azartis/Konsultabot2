@echo off
echo ========================================
echo   Holographic Orb App Icon Setup
echo ========================================
echo.

echo Step 1: Generating SVG icons...
node scripts/generate-app-icon.js
echo.

echo Step 2: Converting SVG to PNG...
node scripts/convert-icons-to-png.js
echo.

echo ========================================
echo   Icon Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Check the assets/ directory for PNG files
echo 2. If PNG files are missing, use manual conversion:
echo    - See ICON_GENERATION_GUIDE.md for instructions
echo    - Or use online tools: https://cloudconvert.com/svg-to-png
echo 3. Rebuild your app to apply new icons:
echo    npx expo prebuild --clean
echo    npx expo run:android
echo.
pause

