# PowerShell script to set up online database
# Usage: .\setup_online_database.ps1

Write-Host "=== KonsultaBot Online Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item "env_example.txt" $envFile -ErrorAction SilentlyContinue
}

Write-Host "Choose your database provider:" -ForegroundColor Yellow
Write-Host "1. Supabase (Recommended - Free)" -ForegroundColor White
Write-Host "2. Railway (Free tier available)" -ForegroundColor White
Write-Host "3. Render (Free tier available)" -ForegroundColor White
Write-Host "4. ElephantSQL (Free tier available)" -ForegroundColor White
Write-Host "5. Custom PostgreSQL" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-5)"

$databaseUrl = ""

switch ($choice) {
    "1" {
        Write-Host "`n=== Supabase Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://supabase.com and create a project" -ForegroundColor White
        Write-Host "2. Go to Settings > Database" -ForegroundColor White
        Write-Host "3. Copy the Connection String (URI format)" -ForegroundColor White
        Write-Host ""
        $databaseUrl = Read-Host "Paste your Supabase DATABASE_URL"
    }
    "2" {
        Write-Host "`n=== Railway Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://railway.app and create a project" -ForegroundColor White
        Write-Host "2. Add PostgreSQL service" -ForegroundColor White
        Write-Host "3. Copy the DATABASE_URL from Variables tab" -ForegroundColor White
        Write-Host ""
        $databaseUrl = Read-Host "Paste your Railway DATABASE_URL"
    }
    "3" {
        Write-Host "`n=== Render Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://render.com and create a PostgreSQL database" -ForegroundColor White
        Write-Host "2. Copy the Internal Database URL" -ForegroundColor White
        Write-Host ""
        $databaseUrl = Read-Host "Paste your Render DATABASE_URL"
    }
    "4" {
        Write-Host "`n=== ElephantSQL Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://www.elephantsql.com and create a database" -ForegroundColor White
        Write-Host "2. Copy the URL from the database details" -ForegroundColor White
        Write-Host ""
        $databaseUrl = Read-Host "Paste your ElephantSQL DATABASE_URL"
    }
    "5" {
        Write-Host "`n=== Custom PostgreSQL Setup ===" -ForegroundColor Cyan
        $dbHost = Read-Host "Database Host"
        $dbPort = Read-Host "Database Port" -Default "5432"
        $dbName = Read-Host "Database Name"
        $dbUser = Read-Host "Database User"
        $dbPass = Read-Host "Database Password" -AsSecureString
        $dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))
        $databaseUrl = "postgresql://${dbUser}:${dbPassPlain}@${dbHost}:${dbPort}/${dbName}"
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

if ($databaseUrl) {
    # Update .env file
    $envContent = ""
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
    }
    
    # Remove old DATABASE_URL if exists
    if ($envContent -match "DATABASE_URL=") {
        $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$databaseUrl"
    } else {
        if ($envContent -and -not $envContent.EndsWith("`n")) {
            $envContent += "`n"
        }
        $envContent += "DATABASE_URL=$databaseUrl`n"
    }
    
    Set-Content -Path $envFile -Value $envContent -NoNewline
    Write-Host "`n✅ DATABASE_URL added to .env file" -ForegroundColor Green
    
    # Install PostgreSQL driver
    Write-Host "`nInstalling PostgreSQL driver..." -ForegroundColor Yellow
    pip install psycopg2-binary dj-database-url
    
    Write-Host "`n✅ Setup complete!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Run migration: python migrate_to_postgresql.py" -ForegroundColor White
    Write-Host "2. Test connection: python manage.py dbshell" -ForegroundColor White
} else {
    Write-Host "No database URL provided" -ForegroundColor Red
    exit 1
}

