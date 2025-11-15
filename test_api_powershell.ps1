# PowerShell API Test Script for KonsultaBot
Write-Host "🔐 Testing KonsultaBot APIs with PowerShell" -ForegroundColor Green

# Test Authentication API
Write-Host "`n📡 Testing Authentication API..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Auth API working - Token received" -ForegroundColor Green
    $token = $response.access
} catch {
    Write-Host "❌ Auth API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Chat API
Write-Host "`n🤖 Testing Chat API..." -ForegroundColor Yellow
try {
    $chatData = @{
        query = "Hello, test message for Gemini API"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/" -Method POST -Body $chatData -Headers $headers
    Write-Host "✅ Chat API working - Response received" -ForegroundColor Green
    Write-Host "Response: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Chat API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API test complete!" -ForegroundColor Green
