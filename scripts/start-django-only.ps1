# ============================================
# Start Django Server Only (No Ngrok)
# ============================================
# Starts Django server on 0.0.0.0:8000
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Django Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Django project exists
$djangoPath = "backend\django_konsultabot"
if (-not (Test-Path $djangoPath)) {
    Write-Host "[ERROR] Django project not found at $djangoPath" -ForegroundColor Red
    exit 1
}

# Find Python executable
$pythonExe = $null
$pythonPaths = @(
    "C:\Users\Ace Ziegfred Culapas\AppData\Local\Programs\Python\Python314\python.exe",
    "python",
    "py",
    "python3"
)

foreach ($path in $pythonPaths) {
    if ($path -match "^[A-Z]:") {
        if (Test-Path $path) {
            $pythonExe = $path
            break
        }
    } else {
        $cmd = Get-Command $path -ErrorAction SilentlyContinue
        if ($cmd) {
            $pythonExe = $cmd.Source
            break
        }
    }
}

if (-not $pythonExe) {
    Write-Host "[ERROR] Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Using Python: $pythonExe" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting Django server on 0.0.0.0:8000..." -ForegroundColor Yellow
Write-Host ""

# Change to Django directory and start server
Set-Location $djangoPath
& $pythonExe manage.py runserver 0.0.0.0:8000

