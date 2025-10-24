@echo off
echo ========================================
echo  Updating Expo Packages
echo ========================================
echo.
echo This will update packages for better compatibility
echo.
pause

echo Updating expo packages...
npx expo install expo@latest

echo Updating React packages...
npx expo install react@latest react-dom@latest

echo Updating React Native...
npx expo install react-native@latest

echo.
echo ========================================
echo Update complete!
echo ========================================
echo.
echo Now restart Expo:
echo   npx expo start --go --tunnel
echo.
pause
