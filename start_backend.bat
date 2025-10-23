@echo off
echo Starting Konsultabot Django Backend...
cd /d "%~dp0"
if exist ".venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call ".venv\Scripts\activate.bat"
) else (
    echo Creating virtual environment...
    python -m venv .venv
    call ".venv\Scripts\activate.bat"
)

echo Installing dependencies...
python -m pip install -r requirements.txt

echo Running migrations...
cd backend\django_konsultabot
python manage.py migrate

echo Starting Django server on 0.0.0.0:8000...
python manage.py runserver 0.0.0.0:8000
pause
