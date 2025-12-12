@echo off
REM start_backend_and_ngrok.bat
REM Usage: run from backend folder: start_backend_and_ngrok.bat

set PORT=8000

REM Start Django (check for manage.py in current dir or django_konsultabot)
if exist manage.py (
  start "" cmd /k "python manage.py runserver 0.0.0.0:%PORT%"
) else if exist django_konsultabot\manage.py (
  start "" cmd /k "cd django_konsultabot && python manage.py runserver 0.0.0.0:%PORT%"
) else (
  echo Error: manage.py not found
  pause
  exit /b 1
)

REM wait a moment
timeout /t 2 /nobreak >nul

REM Start ngrok (expects ngrok.exe in same folder or in PATH)
if exist ngrok.exe (
  start "" ngrok.exe http %PORT% --log=stdout
) else (
  echo ngrok.exe not found in this folder, attempting to run ngrok from PATH...
  start "" ngrok http %PORT% --log=stdout
)

echo Waiting for ngrok to initialize. Sleeping 3s...
timeout /t 3 /nobreak >nul

REM Try to get ngrok URL via local API using powershell
powershell -Command ^
  "$u='http://127.0.0.1:4040/api/tunnels'; for($i=0;$i -lt 20;$i++){try{$r=Invoke-RestMethod -Uri $u -ErrorAction Stop; if($r.tunnels){$t=$r.tunnels|Where-Object{$_.public_url -like 'https:*'} | Select-Object -First 1; if($t){$pu=$t.public_url} else {$pu=$r.tunnels[0].public_url}; Set-Content -Path '.ngrok-last-url' -Value $pu -Force; Write-Host 'Ngrok URL:' $pu; exit 0}}catch{}; Start-Sleep -Seconds 1}; Write-Host 'Failed to get ngrok URL'; exit 1"

echo If sync script exists, run: node ..\backend\sync_ngrok_url.js
echo Keep this window open while testing.
pause

