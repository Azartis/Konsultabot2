@echo off
title Running Konsultabot Project
echo.
echo ========================================
echo   Starting Konsultabot Project
echo ========================================
echo.

:: Activate virtual environment if it exists
if exist "gemini_venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call gemini_venv\Scripts\activate.bat
)

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ from https://python.org
    echo.
    pause
    exit /b 1
)

:: Check if main.py exists
if exist "main.py" (
    echo Starting Konsultabot application...
    echo.
    python main.py
) else (
    echo ERROR: main.py not found!
    echo Please ensure you're in the correct directory.
    echo.
    pause
    exit /b 1
)

pause

