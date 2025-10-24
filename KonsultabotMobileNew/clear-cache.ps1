# Clear all Metro and Expo caches
Write-Host "Clearing caches..." -ForegroundColor Yellow

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "Cleared node_modules\.cache" -ForegroundColor Green
}

if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo"
    Write-Host "Cleared .expo" -ForegroundColor Green
}

if (Test-Path ".metro") {
    Remove-Item -Recurse -Force ".metro"
    Write-Host "Cleared .metro" -ForegroundColor Green
}

Write-Host "Cache cleared! Now starting Expo..." -ForegroundColor Green
npx expo start --web --clear
