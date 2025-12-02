# update-ngrok-url.ps1
# Helper script to update mobile config from .ngrok-last-url

$last = Get-Content -Path ".\.ngrok-last-url" -ErrorAction Stop
Write-Host "Ngrok URL:" $last
# Run Node sync script from repo root
Push-Location ..
node .\backend\sync_ngrok_url.js
Pop-Location
Write-Host "Mobile config updated."

