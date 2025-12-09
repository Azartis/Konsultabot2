@echo off
echo.
echo ========================================
echo   KonsultaBot - Auto IP Configuration
echo ========================================
echo.

REM Get WiFi IP Address
echo [1/3] Detecting your current IP address...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)

:found
REM Remove leading space
set IP=%IP:~1%
echo Current IP: %IP%
echo.

REM Update the apiService.js with all possible IP ranges
echo [2/3] Updating backend URL list...
echo.

REM Backup original file
if not exist "src\services\apiService.js.backup" (
    copy "src\services\apiService.js" "src\services\apiService.js.backup" >nul
    echo Created backup: apiService.js.backup
)

REM Extract the base IP range (e.g., 192.168.1 from 192.168.1.17)
for /f "tokens=1,2,3,4 delims=." %%a in ("%IP%") do (
    set RANGE=%%a.%%b.%%c
    set LAST=%%d
)

echo Detected IP range: %RANGE%.x
echo.

REM Create PowerShell script to update the file
echo $content = Get-Content "src\services\apiService.js" -Raw > temp_update.ps1
echo $urls = @( >> temp_update.ps1
echo   "  'http://%RANGE%.%LAST%:8000/api',  // Current WiFi IP", >> temp_update.ps1
echo   "  'http://%RANGE%.1:8000/api',      // Router IP variation", >> temp_update.ps1
echo   "  'http://%RANGE%.100:8000/api',    // Common range", >> temp_update.ps1
echo   "  'http://192.168.1.17:8000/api',  // Fallback 1", >> temp_update.ps1
echo   "  'http://192.168.0.17:8000/api',  // Fallback 2", >> temp_update.ps1
echo   "  'http://192.168.100.17:8000/api', // Campus WiFi", >> temp_update.ps1
echo   "  'http://10.0.0.17:8000/api',     // Alternative", >> temp_update.ps1
echo   "  'http://172.20.10.2:8000/api',   // Mobile hotspot", >> temp_update.ps1
echo   "  'http://10.0.2.2:8000/api',      // Android emulator" >> temp_update.ps1
echo ^) >> temp_update.ps1
echo $urlList = $urls -join "`n" >> temp_update.ps1
echo if ($content -match '(?s)const POSSIBLE_BACKEND_URLS = \[.*?\];') { >> temp_update.ps1
echo   $newBlock = "const POSSIBLE_BACKEND_URLS = [`n$urlList`n];" >> temp_update.ps1
echo   $content = $content -replace '(?s)const POSSIBLE_BACKEND_URLS = \[.*?\];', $newBlock >> temp_update.ps1
echo   $content ^| Set-Content "src\services\apiService.js" -NoNewline >> temp_update.ps1
echo   Write-Host "Updated backend URLs!" -ForegroundColor Green >> temp_update.ps1
echo } else { >> temp_update.ps1
echo   Write-Host "Could not find POSSIBLE_BACKEND_URLS in file" -ForegroundColor Yellow >> temp_update.ps1
echo } >> temp_update.ps1

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File temp_update.ps1

REM Clean up
del temp_update.ps1

echo.
echo [3/3] Configuration complete!
echo.
echo ========================================
echo          Auto-Discovery Enabled!
echo ========================================
echo.
echo Your app will now automatically try these URLs:
echo   1. http://%IP%:8000/api  (Current)
echo   2. http://%RANGE%.1:8000/api
echo   3. http://%RANGE%.100:8000/api
echo   4. Multiple fallback ranges
echo.
echo This means:
echo   - Works on ANY WiFi network
echo   - Automatically finds backend
echo   - Handles IP changes
echo   - No manual configuration needed!
echo.
echo ========================================
echo.
echo Ready to start? Press any key...
pause > nul

REM Start everything
echo.
echo Starting backend and Expo...
echo.

start "KonsultaBot Backend" cmd /k "cd /d ..\backend && python manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak > nul

start "Expo Metro" cmd /k "npx expo start"

echo.
echo ========================================
echo   App is starting with auto-discovery!
echo ========================================
echo.
echo The app will automatically find your backend
echo no matter which WiFi network you're on!
echo.
