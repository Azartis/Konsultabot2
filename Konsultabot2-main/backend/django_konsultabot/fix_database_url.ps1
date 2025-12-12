# Fix DATABASE_URL formatting issues
# Usage: .\fix_database_url.ps1

Write-Host "=== Fix DATABASE_URL Format ===" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile -Raw
$dbUrlLine = ($envContent -split "`n" | Select-String "DATABASE_URL=")

if (-not $dbUrlLine) {
    Write-Host "❌ DATABASE_URL not found in .env" -ForegroundColor Red
    Write-Host "💡 Run: .\setup_online_database.ps1" -ForegroundColor Yellow
    exit 1
}

$currentUrl = ($dbUrlLine -split "=", 2)[1].Trim()
Write-Host "Current DATABASE_URL:" -ForegroundColor Yellow
Write-Host $currentUrl -ForegroundColor Gray
Write-Host ""

# Check for placeholder password
if ($currentUrl -match '\[YOUR_PASSWORD\]' -or $currentUrl -match 'YOUR_PASSWORD' -or $currentUrl -match 'your-password') {
    Write-Host "❌ DATABASE_URL contains placeholder password!" -ForegroundColor Red
    Write-Host "💡 You need to replace [YOUR_PASSWORD] with your actual database password" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your password:" -ForegroundColor Cyan
    Write-Host "1. Go to your Supabase project" -ForegroundColor White
    Write-Host "2. Settings → Database" -ForegroundColor White
    Write-Host "3. Copy the Connection String (URI format)" -ForegroundColor White
    Write-Host "4. It should look like: postgresql://postgres:ACTUAL_PASSWORD@host:5432/postgres" -ForegroundColor White
    Write-Host ""
    $newUrl = Read-Host "Paste your complete DATABASE_URL here (with real password)"
    
    if ($newUrl) {
        $newContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$newUrl"
        Set-Content -Path $envFile -Value $newContent -NoNewline
        Write-Host "✅ .env file updated with new DATABASE_URL" -ForegroundColor Green
        $currentUrl = $newUrl
    } else {
        Write-Host "❌ No URL provided. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Check if URL needs fixing
if ($currentUrl -notmatch '^postgresql://' -and $currentUrl -notmatch '^postgres://') {
    Write-Host "❌ Invalid URL format. Must start with postgresql:// or postgres://" -ForegroundColor Red
    Write-Host "💡 Example: postgresql://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

# Check for common issues
$needsFix = $false
$fixedUrl = $currentUrl

# Add System.Web assembly for URL encoding
Add-Type -AssemblyName System.Web

# Check if password has special characters that need encoding
if ($currentUrl -match 'postgresql://([^:]+):([^@]+)@' -or $currentUrl -match 'postgres://([^:]+):([^@]+)@') {
    $user = $matches[1]
    $password = $matches[2]
    
    # Check if password needs URL encoding
    try {
        $decoded = [System.Web.HttpUtility]::UrlDecode($password)
        if ($decoded -ne $password) {
            # Already encoded, check if it's correct
            Write-Host "Password appears to be URL-encoded" -ForegroundColor Green
        } else {
            # Check for special characters
            if ($password -match '[^a-zA-Z0-9\-_.~]') {
                Write-Host "⚠️  Password contains special characters that may need encoding" -ForegroundColor Yellow
                Write-Host "   Encoding password..." -ForegroundColor Yellow
                $encodedPassword = [System.Web.HttpUtility]::UrlEncode($password)
                $fixedUrl = $currentUrl -replace ":$password@", ":$encodedPassword@"
                $needsFix = $true
            }
        }
    } catch {
        Write-Host "⚠️  Could not check password encoding" -ForegroundColor Yellow
    }
}

if ($needsFix) {
    Write-Host "`nFixed URL:" -ForegroundColor Green
    Write-Host $fixedUrl -ForegroundColor Gray
    Write-Host ""
    $confirm = Read-Host "Update .env file with fixed URL? (y/n)"
    
    if ($confirm -eq "y") {
        $newContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$fixedUrl"
        Set-Content -Path $envFile -Value $newContent -NoNewline
        Write-Host "✅ .env file updated!" -ForegroundColor Green
    }
} else {
    Write-Host "✅ URL format looks correct" -ForegroundColor Green
    Write-Host ""
    Write-Host "If you're still getting errors, try:" -ForegroundColor Yellow
    Write-Host "1. Verify the URL is correct" -ForegroundColor White
    Write-Host "2. Check if password needs URL encoding" -ForegroundColor White
    Write-Host "3. Test connection: python test_database_connection.py" -ForegroundColor White
}

