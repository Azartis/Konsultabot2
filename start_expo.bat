@echo off
REM Simple helper to build a one-file executable using PyInstaller
if "%~1"=="" (
  echo Usage: start_expo.bat [build|clean]
  exit /b 1
)

if "%~1"=="clean" (
  rd /s /q dist
  rd /s /q build
  del /q modern_gui.spec
  echo Cleaned build artifacts.
  exit /b 0
)

if "%~1"=="build" (
  echo Building Konsultabot executable via PyInstaller...
  pyinstaller --onefile --add-data "VOICE_SETUP.md;." --name Konsultabot modern_gui.py
  echo Build complete. See dist\Konsultabot.exe
  exit /b 0
)

echo Unknown command %1
exit /b 1
