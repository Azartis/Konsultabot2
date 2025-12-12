# Temporarily switch to SQLite so the app works while fixing network issues
Write-Host "🔄 Switching to SQLite temporarily..." -ForegroundColor Yellow

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Backup current .env
Copy-Item $envFile "$envFile.backup" -Force
Write-Host "✅ Backed up .env to .env.backup" -ForegroundColor Green

# Read current .env
$content = Get-Content $envFile -Raw

# Comment out DATABASE_URL and DB_ENGINE
$content = $content -replace '^DATABASE_URL=', '# DATABASE_URL='
$content = $content -replace '^DB_ENGINE=', '# DB_ENGINE='

# Write back
$content | Set-Content $envFile -NoNewline

Write-Host "✅ Switched to SQLite" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To switch back to PostgreSQL later, run:" -ForegroundColor Cyan
Write-Host "   .\switch_to_postgresql.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Now run: python manage.py migrate" -ForegroundColor Yellow
Write-Host "   Then: python manage.py runserver 0.0.0.0:8000" -ForegroundColor Yellow

