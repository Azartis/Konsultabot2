@echo off
echo.
echo ========================================
echo   KonsultaBot Enhanced System Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo [1/5] Checking Python environment...
python -c "import sys; print(f'Python {sys.version}')"

echo.
echo [2/5] Installing/updating dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo WARNING: Some dependencies may not have installed correctly
)

echo.
echo [3/5] Initializing database...
python -c "from analytics_dashboard import KonsultaBotAnalytics; KonsultaBotAnalytics(); print('Database initialized')"

echo.
echo [4/5] Testing system components...
python -c "from chatbot_core import get_bot_response; print('Chatbot core: OK')"
python -c "from network_detector import NetworkDetector; print('Network detector: OK')"

echo.
echo [5/5] Starting Enhanced KonsultaBot API Server...
echo.
echo ========================================
echo   Server Information
echo ========================================
echo   URL: http://localhost:8000
echo   Health Check: http://localhost:8000/api/health
echo   Chat API: http://localhost:8000/api/chat
echo.
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the enhanced API server
python backend/api/enhanced_chat_api.py

echo.
echo Server stopped. Press any key to exit...
pause >nul
