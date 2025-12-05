# Fix Gemini API Key - Step by Step Guide

## 🔴 **Problem:**
```
ERROR Gemini API error 400: API key expired. Please renew the API key.
```

## ✅ **Solution: Get a New Gemini API Key**

### Step 1: Get Your New API Key

1. **Go to Google AI Studio:**
   - Visit: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Sign in** with your Google account

3. **Create API Key:**
   - Click "Create API Key" or "Get API Key"
   - Select your Google Cloud project (or create a new one)
   - Copy the API key (starts with `AIza...`)

### Step 2: Update Your .env File

Find your `.env` file (usually in `backend/django_konsultabot/` or `backend/`):

1. **Open the `.env` file** in a text editor

2. **Find or add these lines:**
   ```env
   GEMINI_API_KEY=your_new_api_key_here
   GOOGLE_API_KEY=your_new_api_key_here
   ```
   
   **Replace `your_new_api_key_here` with your actual API key**

3. **Save the file**

### Step 3: Restart Django Server

1. **Stop the current server** (Press `Ctrl+C` in the terminal)

2. **Start it again:**
   ```powershell
   cd backend\django_konsultabot
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Check the logs** - you should see:
   ```
   INFO Gemini API key detected. Initializing Gemini client...
   INFO Gemini model initialized successfully.
   ```
   (No more "API key expired" errors!)

### Step 4: Test It

Send a chat message from your mobile app. It should work now! ✅

---

## 🔧 **Quick Fix Script**

I've created a helper script to make this easier. Run:

```powershell
cd backend\django_konsultabot
.\update_gemini_key.ps1
```

This will guide you through updating the key.

---

## 📝 **Alternative: Use PowerShell to Update**

```powershell
# Navigate to backend folder
cd backend\django_konsultabot

# Edit .env file (replace YOUR_NEW_KEY with actual key)
$newKey = "YOUR_NEW_KEY"
$envFile = ".env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    # Update or add GEMINI_API_KEY
    if ($content -match "GEMINI_API_KEY=") {
        $content = $content -replace "GEMINI_API_KEY=.*", "GEMINI_API_KEY=$newKey"
    } else {
        $content += "`nGEMINI_API_KEY=$newKey`n"
    }
    # Update or add GOOGLE_API_KEY
    if ($content -match "GOOGLE_API_KEY=") {
        $content = $content -replace "GOOGLE_API_KEY=.*", "GOOGLE_API_KEY=$newKey"
    } else {
        $content += "`nGOOGLE_API_KEY=$newKey`n"
    }
    Set-Content -Path $envFile -Value $content -NoNewline
    Write-Host "✅ Updated .env file with new API key" -ForegroundColor Green
} else {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "GEMINI_API_KEY=$newKey`nGOOGLE_API_KEY=$newKey" | Out-File $envFile -Encoding utf8
    Write-Host "✅ Created .env file with new API key" -ForegroundColor Green
}

Write-Host "`n⚠️  Don't forget to replace YOUR_NEW_KEY with your actual API key!" -ForegroundColor Yellow
```

---

## 🆘 **Troubleshooting**

### Issue: Still getting "API key expired" error

**Solutions:**
1. Make sure you saved the `.env` file
2. Restart Django server (it needs to reload environment variables)
3. Check the API key is correct (no extra spaces, correct format)
4. Verify the key is active in Google AI Studio

### Issue: "API key not found"

**Solutions:**
1. Check `.env` file exists in `backend/django_konsultabot/` or `backend/`
2. Make sure the variable names are exactly:
   - `GEMINI_API_KEY=...`
   - `GOOGLE_API_KEY=...`
3. No quotes around the key value
4. Restart Django server

### Issue: API key format looks wrong

**Valid format:**
- Starts with `AIza`
- About 39 characters long
- Example: `AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U`

---

## 📋 **Quick Checklist**

- [ ] Got new API key from Google AI Studio
- [ ] Updated `.env` file with new key
- [ ] Restarted Django server
- [ ] Tested chat functionality
- [ ] No more "API key expired" errors

---

## 🔗 **Useful Links**

- **Get API Key**: https://makersuite.google.com/app/apikey
- **Google AI Studio**: https://aistudio.google.com/
- **API Documentation**: https://ai.google.dev/docs

---

**After updating the key, your chatbot will work again!** 🚀

