# Helper script to update Gemini API key in .env file
# Usage: .\update_gemini_key.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Gemini API Key Updater" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find .env file
$envFile = ".env"
$parentEnvFile = "..\.env"

$targetFile = $null
if (Test-Path $envFile) {
    $targetFile = $envFile
    Write-Host "[OK] Found .env file: $envFile" -ForegroundColor Green
} elseif (Test-Path $parentEnvFile) {
    $targetFile = $parentEnvFile
    Write-Host "[OK] Found .env file: $parentEnvFile" -ForegroundColor Green
} else {
    Write-Host "[INFO] .env file not found. Will create one." -ForegroundColor Yellow
    $targetFile = $envFile
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "How to Get Your API Key:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://makersuite.google.com/app/apikey" -ForegroundColor White
Write-Host "2. Sign in with your Google account" -ForegroundColor White
Write-Host "3. Click 'Create API Key' or 'Get API Key'" -ForegroundColor White
Write-Host "4. Copy the API key (starts with AIza...)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get API key from user
$apiKey = Read-Host "Enter your new Gemini API key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "[ERROR] API key cannot be empty!" -ForegroundColor Red
    exit 1
}

# Validate format (basic check)
if (-not $apiKey.StartsWith("AIza")) {
    Write-Host "[WARN] API key should start with 'AIza'. Are you sure this is correct?" -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "[INFO] Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Read existing content
$content = ""
if (Test-Path $targetFile) {
    $content = Get-Content $targetFile -Raw -ErrorAction SilentlyContinue
}

# Update or add GEMINI_API_KEY
if ($content -match "GEMINI_API_KEY=") {
    $content = $content -replace "GEMINI_API_KEY=.*", "GEMINI_API_KEY=$apiKey"
    Write-Host "[OK] Updated GEMINI_API_KEY" -ForegroundColor Green
} else {
    if ($content -and -not $content.EndsWith("`n")) {
        $content += "`n"
    }
    $content += "GEMINI_API_KEY=$apiKey`n"
    Write-Host "[OK] Added GEMINI_API_KEY" -ForegroundColor Green
}

# Update or add GOOGLE_API_KEY (for backwards compatibility)
if ($content -match "GOOGLE_API_KEY=") {
    $content = $content -replace "GOOGLE_API_KEY=.*", "GOOGLE_API_KEY=$apiKey"
    Write-Host "[OK] Updated GOOGLE_API_KEY" -ForegroundColor Green
} else {
    if ($content -and -not $content.EndsWith("`n")) {
        $content += "`n"
    }
    $content += "GOOGLE_API_KEY=$apiKey`n"
    Write-Host "[OK] Added GOOGLE_API_KEY" -ForegroundColor Green
}

# Write back to file
try {
    Set-Content -Path $targetFile -Value $content -NoNewline -Encoding UTF8
    Write-Host ""
    Write-Host "[SUCCESS] Updated $targetFile with new API key!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Restart your Django server:" -ForegroundColor White
    Write-Host "   Press Ctrl+C to stop current server" -ForegroundColor Gray
    Write-Host "   Then run: python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test the chatbot - it should work now!" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed to write to file: $_" -ForegroundColor Red
    exit 1
}

