# Simple script to update .env with current Ngrok URL
# Usage: .\update-ngrok-url.ps1

try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get
    $url = $tunnels.tunnels[0].public_url
    
    if ($url) {
        Write-Host "Found Ngrok URL: $url" -ForegroundColor Green
        
        $envFile = ".env"
        $envContent = ""
        
        if (Test-Path $envFile) {
            $envContent = Get-Content $envFile -Raw
        }
        
        if ($envContent -match "EXPO_PUBLIC_NGROK_URL=") {
            $envContent = $envContent -replace "EXPO_PUBLIC_NGROK_URL=.*", "EXPO_PUBLIC_NGROK_URL=$url"
        } else {
            if ($envContent -and -not $envContent.EndsWith("`n")) {
                $envContent += "`n"
            }
            $envContent += "EXPO_PUBLIC_NGROK_URL=$url`n"
        }
        
        Set-Content -Path $envFile -Value $envContent -NoNewline
        Write-Host "SUCCESS: Updated .env file with Ngrok URL" -ForegroundColor Green
        Write-Host "Restart Expo: npx expo start --clear" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Could not get Ngrok URL" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Ngrok is not running or not accessible" -ForegroundColor Red
    Write-Host "Start ngrok first: .\ngrok.exe http 8000" -ForegroundColor Yellow
    exit 1
}

