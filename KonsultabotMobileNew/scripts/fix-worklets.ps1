# Fix Worklets Version Mismatch
# This script clears all caches and rebuilds the native app

Write-Host "🔧 Fixing Worklets Version Mismatch..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear Metro bundler cache
Write-Host "[1/6] Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✅ Metro cache cleared" -ForegroundColor Green

# Step 2: Clear Expo cache
Write-Host "[2/6] Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\expo-*") {
    Remove-Item "$env:TEMP\expo-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✅ Expo cache cleared" -ForegroundColor Green

# Step 3: Clear node_modules and reinstall
Write-Host "[3/6] Reinstalling dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
}
npm install --legacy-peer-deps
Write-Host "✅ Dependencies reinstalled" -ForegroundColor Green

# Step 4: Clear Android build cache
Write-Host "[4/6] Clearing Android build cache..." -ForegroundColor Yellow
if (Test-Path "android\.gradle") {
    Remove-Item "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✅ Android cache cleared" -ForegroundColor Green

# Step 5: Rebuild native code
Write-Host "[5/6] Rebuilding native code..." -ForegroundColor Yellow
Write-Host "   This will regenerate native Android/iOS code" -ForegroundColor Gray
npx expo prebuild --clean --platform android
Write-Host "✅ Native code rebuilt" -ForegroundColor Green

# Step 6: Clear watchman (if installed)
Write-Host "[6/6] Clearing watchman cache..." -ForegroundColor Yellow
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all 2>$null
    Write-Host "✅ Watchman cache cleared" -ForegroundColor Green
} else {
    Write-Host "⚠️  Watchman not installed (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ All caches cleared and native code rebuilt!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npx expo run:android" -ForegroundColor White
Write-Host "   2. Or: npx expo start --dev-client" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: You MUST use a development build, NOT Expo Go!" -ForegroundColor Yellow
Write-Host "   Expo Go doesn't support native modules like react-native-reanimated" -ForegroundColor Yellow
Write-Host ""

