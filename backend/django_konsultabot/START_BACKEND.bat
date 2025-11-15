@echo off
echo ========================================
echo  KonsultaBot Django Backend Server
echo ========================================
echo.
echo Starting backend on http://192.168.1.17:8000
echo.
echo This provides:
echo  - Gemini AI integration
echo  - Knowledge Base responses
echo  - User authentication
echo  - Chat history
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python manage.py runserver 192.168.1.17:8000

pause
