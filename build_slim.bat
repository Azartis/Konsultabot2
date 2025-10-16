@echo off
REM Build a slim Konsultabot executable by installing only minimal deps into a venv and running PyInstaller
if exist .\build_slim_venv rmdir /s /q .\build_slim_venv
python -m venv build_slim_venv
.\build_slim_venv\Scripts\activate
pip install -r requirements_slim.txt
pip install pyinstaller
pyinstaller --onefile --add-data "VOICE_SETUP.md;." --name Konsultabot_slim launcher.py
echo Slim build complete. See dist\Konsultabot_slim.exe
