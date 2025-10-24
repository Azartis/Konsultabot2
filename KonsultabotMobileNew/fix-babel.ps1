Write-Host "Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}

Write-Host "Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

Write-Host "Installing packages..." -ForegroundColor Green
npm install --legacy-peer-deps

Write-Host "Starting Expo..." -ForegroundColor Green
npx expo start --web --clear
