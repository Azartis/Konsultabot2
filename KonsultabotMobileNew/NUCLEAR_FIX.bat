@echo off
echo.
echo ========================================
echo   NUCLEAR FIX - Complete Clean Start
echo ========================================
echo.
echo This will completely clean and rebuild your app.
echo.
pause

echo.
echo [1/6] Killing all Node processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM watchman.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo [2/6] Deleting ALL caches and temporary files...
echo Removing Metro bundler cache...
rmdir /s /q node_modules\.cache 2>nul
echo Removing Expo cache...
rmdir /s /q .expo 2>nul
rmdir /s /q .expo-shared 2>nul
echo Removing temporary files...
rd /s /q %TEMP%\metro-* 2>nul
rd /s /q %TEMP%\haste-* 2>nul
rd /s /q %TEMP%\react-* 2>nul
rd /s /q %TEMP%\expo-* 2>nul
rd /s /q %LOCALAPPDATA%\Temp\metro-* 2>nul
echo Removing watchman cache...
rd /s /q %LOCALAPPDATA%\.watchman 2>nul

echo.
echo [3/6] Clearing NPM cache...
call npm cache clean --force

echo.
echo [4/6] What was fixed:
echo   ✓ Removed ALL 'gap' properties from 7 files
echo   ✓ WelcomeScreen.js (3 instances)
echo   ✓ LumaChatScreen.js (2 instances)
echo   ✓ LumaLoginScreen.js (1 instance)
echo   ✓ GeminiChatScreen.js (1 instance)
echo   ✓ ExpoGeminiChatScreen.js (1 instance)
echo   ✓ ImprovedChatScreen.js (3 instances)
echo   ✓ Fixed babel.config.js for reanimated
echo   ✓ Fixed react-native-reanimated version
echo.

echo [5/6] Reinstalling dependencies...
call npm install --legacy-peer-deps

echo.
echo [6/6] Starting Expo with completely clean cache...
echo.
echo ========================================
echo        Everything is Clean!
echo ========================================
echo.
echo Starting fresh build now...
echo This may take 1-2 minutes...
echo.

npx expo start --clear

echo.
pause
