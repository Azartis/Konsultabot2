# ============================================
# Cleanup Unnecessary Files Script
# ============================================
# This script removes unnecessary files that should not be committed
# Review the list below before running
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KonsultaBot - Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  This script will remove:" -ForegroundColor Yellow
Write-Host "   - Virtual environments (gemini_venv, venv, etc.)" -ForegroundColor Gray
Write-Host "   - Python cache (__pycache__, *.pyc)" -ForegroundColor Gray
Write-Host "   - Database files (*.db, *.sqlite3)" -ForegroundColor Gray
Write-Host "   - Log files (*.log)" -ForegroundColor Gray
Write-Host "   - Build artifacts (node_modules, .expo, build/)" -ForegroundColor Gray
Write-Host "   - Temporary files (*.tmp, *.bak)" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  This will NOT remove:" -ForegroundColor Green
Write-Host "   - .env files (you should delete manually if needed)" -ForegroundColor Gray
Write-Host "   - Source code" -ForegroundColor Gray
Write-Host "   - Configuration files" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Yellow
Write-Host ""

$removedCount = 0
$errorCount = 0

# Function to safely remove directory
function Remove-DirectorySafe {
    param([string]$Path)
    if (Test-Path $Path) {
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "  ✅ Removed: $Path" -ForegroundColor Green
            $script:removedCount++
        } catch {
            Write-Host "  ⚠️  Failed to remove: $Path - $($_.Exception.Message)" -ForegroundColor Yellow
            $script:errorCount++
        }
    }
}

# Function to safely remove file
function Remove-FileSafe {
    param([string]$Path)
    if (Test-Path $Path) {
        try {
            Remove-Item -Path $Path -Force -ErrorAction Stop
            Write-Host "  ✅ Removed: $Path" -ForegroundColor Green
            $script:removedCount++
        } catch {
            Write-Host "  ⚠️  Failed to remove: $Path - $($_.Exception.Message)" -ForegroundColor Yellow
            $script:errorCount++
        }
    }
}

# Virtual environments
Write-Host "Removing virtual environments..." -ForegroundColor Cyan
Remove-DirectorySafe "gemini_venv"
Remove-DirectorySafe "venv"
Remove-DirectorySafe ".venv"
Remove-DirectorySafe "env"
Remove-DirectorySafe "ENV"
Get-ChildItem -Directory -Filter "*venv*" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-DirectorySafe $_.FullName
}

# Python cache
Write-Host "Removing Python cache..." -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-DirectorySafe $_.FullName
}
Get-ChildItem -Path . -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}
Get-ChildItem -Path . -Recurse -Filter "*.pyo" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}

# Database files
Write-Host "Removing database files..." -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Filter "*.db" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}
Get-ChildItem -Path . -Recurse -Filter "*.sqlite3" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}
Get-ChildItem -Path . -Recurse -Filter "*.sqlite" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}

# Log files
Write-Host "Removing log files..." -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Filter "*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}

# Node modules and build artifacts (be careful - these are large)
Write-Host "Removing Node.js build artifacts..." -ForegroundColor Cyan
Write-Host "  (Skipping node_modules - run 'npm install' to restore)" -ForegroundColor Gray
# Uncomment if you want to remove node_modules (will require npm install)
# Remove-DirectorySafe "node_modules"
# Remove-DirectorySafe "KonsultabotMobileNew/node_modules"
# Remove-DirectorySafe "admin-panel-frontend/node_modules"

Remove-DirectorySafe ".expo"
Remove-DirectorySafe "KonsultabotMobileNew/.expo"
Remove-DirectorySafe "web-build"
Remove-DirectorySafe "KonsultabotMobileNew/web-build"
Remove-DirectorySafe "build"
Remove-DirectorySafe "dist"

# Temporary files
Write-Host "Removing temporary files..." -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Filter "*.tmp" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}
Get-ChildItem -Path . -Recurse -Filter "*.bak" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}
Get-ChildItem -Path . -Recurse -Filter "*.temp" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-FileSafe $_.FullName
}

# Android build artifacts
Write-Host "Removing Android build artifacts..." -ForegroundColor Cyan
Remove-DirectorySafe "KonsultabotMobileNew/android/.gradle"
Remove-DirectorySafe "KonsultabotMobileNew/android/app/build"
Remove-DirectorySafe "KonsultabotMobileNew/android/build"

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Removed: $removedCount items" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "  Errors: $errorCount items" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review .gitignore to ensure these files are ignored" -ForegroundColor Gray
Write-Host "   2. Run 'npm install' in mobile project if needed" -ForegroundColor Gray
Write-Host "   3. Create virtual environment for backend: python -m venv venv" -ForegroundColor Gray
Write-Host ""

