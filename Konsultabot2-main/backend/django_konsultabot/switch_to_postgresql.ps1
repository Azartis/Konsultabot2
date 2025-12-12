# Restore PostgreSQL configuration from backup
Write-Host "🔄 Restoring PostgreSQL configuration..." -ForegroundColor Yellow

$envFile = ".env"
$backupFile = ".env.backup"

if (-not (Test-Path $backupFile)) {
    Write-Host "❌ .env.backup not found! Cannot restore." -ForegroundColor Red
    exit 1
}

# Restore from backup
Copy-Item $backupFile $envFile -Force
Write-Host "✅ Restored PostgreSQL configuration from backup" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Make sure you've fixed the hosts file first!" -ForegroundColor Yellow
Write-Host "   Run: .\fix_hosts_file.ps1" -ForegroundColor Cyan

