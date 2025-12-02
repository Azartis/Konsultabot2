# Fix hosts file to resolve Supabase hostname to IPv4
Write-Host "🔧 Fixing hosts file for Supabase connection..." -ForegroundColor Yellow

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$supabaseHost = "db.xfvjpiudllclwjzpvomz.supabase.co"
$ipv4Address = "199.36.158.100"

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 To fix manually:" -ForegroundColor Cyan
    Write-Host "   1. Open Notepad as Administrator" -ForegroundColor White
    Write-Host "   2. Open: C:\Windows\System32\drivers\etc\hosts" -ForegroundColor White
    Write-Host "   3. Add this line at the end:" -ForegroundColor White
    Write-Host "      $ipv4Address   $supabaseHost" -ForegroundColor Yellow
    Write-Host "   4. Save and close" -ForegroundColor White
    Write-Host "   5. Run: ipconfig /flushdns" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or run this PowerShell script as Administrator" -ForegroundColor Cyan
    exit 1
}

# Read current hosts file
$hostsContent = Get-Content $hostsPath -ErrorAction Stop

# Check if entry already exists
$entryExists = $hostsContent | Where-Object { $_ -match $supabaseHost }

if ($entryExists) {
    Write-Host "⚠️  Entry already exists in hosts file:" -ForegroundColor Yellow
    $entryExists | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    $response = Read-Host "Do you want to update it? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Skipped." -ForegroundColor Gray
        exit 0
    }
    # Remove old entry
    $hostsContent = $hostsContent | Where-Object { $_ -notmatch $supabaseHost }
}

# Add new entry
$newEntry = "$ipv4Address   $supabaseHost"
$hostsContent += $newEntry

# Write back
$hostsContent | Set-Content $hostsPath -Encoding ASCII
Write-Host "✅ Added to hosts file: $newEntry" -ForegroundColor Green

# Flush DNS
Write-Host ""
Write-Host "🔄 Flushing DNS cache..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
Write-Host "✅ DNS cache flushed" -ForegroundColor Green

# Test connection
Write-Host ""
Write-Host "🧪 Testing hostname resolution..." -ForegroundColor Yellow
try {
    $result = Test-NetConnection -ComputerName $supabaseHost -Port 5432 -WarningAction SilentlyContinue -ErrorAction Stop
    if ($result.TcpTestSucceeded) {
        Write-Host "✅ Connection successful! PostgreSQL should work now." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Hostname resolves but port 5432 is not reachable." -ForegroundColor Yellow
        Write-Host "   This might be a firewall issue." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Connection test failed: $_" -ForegroundColor Red
    Write-Host "   The hosts file was updated, but connection still fails." -ForegroundColor Yellow
    Write-Host "   Check your firewall or network settings." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test: python test_database_connection.py" -ForegroundColor White
Write-Host "   2. If successful, run: python manage.py migrate" -ForegroundColor White

