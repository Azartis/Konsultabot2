# Helper script to get Supabase database password
# Usage: .\get_supabase_password.ps1

Write-Host "=== Get Supabase Database Password ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "To get your Supabase database password:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Go to Settings → Database" -ForegroundColor White
Write-Host "4. Scroll to 'Connection string' section" -ForegroundColor White
Write-Host "5. Click 'URI' tab" -ForegroundColor White
Write-Host "6. Copy the connection string" -ForegroundColor White
Write-Host ""
Write-Host "The connection string looks like:" -ForegroundColor Cyan
Write-Host "postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -ForegroundColor Gray
Write-Host ""
Write-Host "OR use the 'Connection pooling' URI which is recommended:" -ForegroundColor Yellow
Write-Host ""
Write-Host "After copying, run:" -ForegroundColor Cyan
Write-Host "  .\setup_online_database.ps1" -ForegroundColor White
Write-Host ""
Write-Host "And paste the complete connection string when prompted." -ForegroundColor White

