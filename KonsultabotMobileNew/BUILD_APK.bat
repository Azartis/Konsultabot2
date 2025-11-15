@echo off
title Building Konsultabot APK with EAS
color 0B
echo.
echo ========================================
echo   Building Konsultabot APK
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking EAS CLI...
eas --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: EAS CLI not found!
    echo Installing EAS CLI...
    call npm install -g eas-cli
    if errorlevel 1 (
        echo ERROR: Failed to install EAS CLI
        pause
        exit /b 1
    )
)
echo EAS CLI found.

echo.
echo [2/4] Checking if logged in to EAS...
eas whoami >nul 2>&1
if errorlevel 1 (
    echo Not logged in. Please login to EAS:
    echo.
    call eas login
    if errorlevel 1 (
        echo ERROR: Login failed
        pause
        exit /b 1
    )
)
echo Logged in to EAS.

echo.
echo [3/4] Initializing EAS project (if needed)...
if not exist ".eas" (
    echo Initializing EAS project...
    call eas init --non-interactive
)

echo.
echo [4/4] Starting Android APK build...
echo.
echo This will:
echo   - Upload your project to Expo servers
echo   - Build the APK in the cloud
echo   - Take approximately 15-20 minutes
echo.
echo ========================================
echo.

call eas build --platform android --profile preview

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Check the EAS dashboard for your APK:
echo https://expo.dev/accounts/[your-account]/projects/konsultabot-mobile/builds
echo.
pause

