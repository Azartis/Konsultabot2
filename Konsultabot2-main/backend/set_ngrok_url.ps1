# Quick script to set NGROK_URL in backend .env file
param(
    [string]$NgrokUrl = "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev"
)

$envFile = Join-Path $PSScriptRoot "django_konsultabot\.env"
$parentEnvFile = Join-Path $PSScriptRoot ".env"

# Try to find .env file
if (Test-Path $envFile) {
    $targetFile = $envFile
} elseif (Test-Path $parentEnvFile) {
    $targetFile = $parentEnvFile
} else {
    Write-Host "Creating .env file at: $envFile" -ForegroundColor Yellow
    $targetFile = $envFile
}

# Read existing content
$content = ""
if (Test-Path $targetFile) {
    $content = Get-Content $targetFile -Raw -ErrorAction SilentlyContinue
}

# Update or add NGROK_URL
if ($content -match "NGROK_URL=") {
    $content = $content -replace "NGROK_URL=.*", "NGROK_URL=$NgrokUrl"
    Write-Host "Updated NGROK_URL in $targetFile" -ForegroundColor Green
} else {
    $content += "`nNGROK_URL=$NgrokUrl`n"
    Write-Host "Added NGROK_URL to $targetFile" -ForegroundColor Green
}

# Write back
Set-Content -Path $targetFile -Value $content -NoNewline

Write-Host ""
Write-Host "Backend NGROK_URL configured: $NgrokUrl" -ForegroundColor Cyan
Write-Host "This will be added to CSRF_TRUSTED_ORIGINS when Django starts." -ForegroundColor Gray

