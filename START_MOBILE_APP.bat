@echo off
echo ========================================
echo  KonsultaBot Mobile App Startup
echo ========================================
echo.

echo Step 1: Checking backend server...
echo.
echo Please make sure your Django backend is running!
echo Open a separate terminal and run:
echo    cd ..\backend\django_konsultabot
echo    python manage.py runserver 192.168.1.17:8000
echo.
pause

echo.
echo Step 2: Starting Expo with tunnel mode...
echo This allows your phone to connect even if on different network
echo.

npx expo start --tunnel --clear

pause
