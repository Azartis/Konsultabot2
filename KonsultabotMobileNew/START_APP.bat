@echo off
echo ========================================
echo  KONSULTABOT - START APP
echo ========================================
echo.
echo This will clear cache and start Expo
echo.
echo IMPORTANT CHECKLIST:
echo [ ] Backend running? (python manage.py runserver)
echo [ ] ngrok running? (ngrok http 8000)
echo [ ] Updated .env with ngrok URL?
echo.
pause
echo.
echo Clearing Expo cache and starting...
echo.
npx expo start --clear
