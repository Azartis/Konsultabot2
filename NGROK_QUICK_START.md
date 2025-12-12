# Ngrok Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Ngrok
```bash
# Windows (Chocolatey)
choco install ngrok

# macOS (Homebrew)
brew install ngrok

# Or download from: https://ngrok.com/download
```

### Step 2: Sign Up (Free)
1. Go to: https://dashboard.ngrok.com/signup
2. Get your authtoken
3. Run: `ngrok config add-authtoken YOUR_TOKEN`

### Step 3: Start Backend
```bash
cd backend/django_konsultabot
python manage.py runserver
```

### Step 4: Start Ngrok
**Option A: Automated (Recommended)**
```powershell
# Windows
.\start-ngrok.ps1

# macOS/Linux
./start-ngrok.sh
```

**Option B: Manual**
```bash
ngrok http 8000
```
Then copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 5: Update Environment
Create/edit `.env` in `KonsultabotMobileNew/`:
```env
EXPO_PUBLIC_NGROK_URL=https://your-url.ngrok.io
```

### Step 6: Restart Expo
```bash
cd KonsultabotMobileNew
npx expo start --clear
```

## ✅ Verify It Works

1. **Test Backend:**
   ```bash
   curl https://your-url.ngrok.io/api/health/
   ```

2. **Test from Phone:**
   - Disconnect from WiFi
   - Open app
   - Try to login
   - Check Expo logs for: `🌐 Using Ngrok URL for global access`

## 🔄 When URL Changes

1. Get new URL from: http://localhost:4040
2. Update `.env` file
3. Restart Expo: `npx expo start --clear`

## 📝 Files to Know

- `.env` - Your Ngrok URL (don't commit to Git)
- `ngrok-url.txt` - Current URL (auto-generated)
- `NGROK_SETUP.md` - Full documentation

## 🆘 Common Issues

**"Ngrok not found"**
→ Install Ngrok and add to PATH

**"Backend not running"**
→ Start Django: `python manage.py runserver`

**"App still uses local IP"**
→ Clear cache: `npx expo start --clear`

**"CORS errors"**
→ Already configured in Django settings

---

For detailed help, see: `NGROK_SETUP.md`

