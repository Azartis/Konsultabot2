# Ngrok Setup Guide for Konsultabot Mobile App

This guide will help you set up Ngrok to make your local Django backend accessible globally, allowing your Expo mobile app to connect from anywhere (not just the same WiFi network).

## 📋 Prerequisites

1. **Ngrok Account** (Free or Paid)
   - Sign up at: https://dashboard.ngrok.com/signup
   - Free plan works, but URL changes on restart
   - Paid plan allows static domains

2. **Ngrok Installed**
   - Download from: https://ngrok.com/download
   - Or use: `choco install ngrok` (Chocolatey)
   - Or use: `brew install ngrok` (macOS)

3. **Django Backend Running**
   - Your backend should be running on `http://localhost:8000`
   - Test it: `curl http://localhost:8000/api/health/`

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)

**Windows (PowerShell):**
```powershell
.\start-ngrok.ps1
```

**Windows (Batch):**
```cmd
start-ngrok.bat
```

**macOS/Linux:**
```bash
chmod +x start-ngrok.sh
./start-ngrok.sh
```

The script will:
- ✅ Check if backend is running
- ✅ Start Ngrok tunnel
- ✅ Get public URL
- ✅ Update `.env` file automatically
- ✅ Save URL to `ngrok-url.txt`

### Option 2: Manual Setup

1. **Start Ngrok:**
   ```bash
   ngrok http 8000
   ```

2. **Get Public URL:**
   - Open: http://localhost:4040
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. **Update Environment Variable:**
   - Create or edit `.env` file in `KonsultabotMobileNew/`
   - Add:
     ```
     EXPO_PUBLIC_NGROK_URL=https://abc123.ngrok.io
     ```

4. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `KonsultabotMobileNew/`:

```env
# Ngrok URL (without /api suffix)
EXPO_PUBLIC_NGROK_URL=https://your-subdomain.ngrok.io

# Alternative: Direct API URL
# EXPO_PUBLIC_API_URL=https://your-subdomain.ngrok.io/api
```

### App Configuration

The app is configured to use Ngrok URL in `app.config.js`:

```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_NGROK_URL 
    ? `${process.env.EXPO_PUBLIC_NGROK_URL}/api`
    : process.env.EXPO_PUBLIC_API_URL || "http://192.168.103.243:8000/api",
  ngrokUrl: process.env.EXPO_PUBLIC_NGROK_URL || null,
}
```

### API Service Priority

The app checks URLs in this order:
1. **Ngrok URL** (from environment/config) - Highest priority
2. **Cached URL** (from AsyncStorage)
3. **Local network IPs** (fallback for same WiFi)

## 📱 Testing

### 1. Test Backend Health Endpoint

```bash
# Replace with your Ngrok URL
curl https://your-subdomain.ngrok.io/api/health/
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Server is running"
}
```

### 2. Test from Mobile Device

1. **Disconnect from WiFi** (use mobile data)
2. **Open the Expo app**
3. **Try to login or send a chat message**
4. **Check console logs** for:
   ```
   🌐 Using Ngrok URL for global access: https://your-subdomain.ngrok.io/api
   ```

### 3. Verify Connection

Check Expo logs:
```bash
npx expo start
```

Look for:
- ✅ `🌐 Using Ngrok URL for global access`
- ❌ `🔍 Discovering backend URL...` (means Ngrok not found)

## 🔄 Updating Ngrok URL

### When URL Changes (Free Plan)

Ngrok free plan gives a new URL each time you restart. To update:

1. **Get new URL:**
   - Visit: http://localhost:4040
   - Or check `ngrok-url.txt` (if using script)

2. **Update `.env`:**
   ```env
   EXPO_PUBLIC_NGROK_URL=https://new-url.ngrok.io
   ```

3. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

### Static Domain (Paid Plan)

For production/testing, use a static domain:

```bash
ngrok http 8000 --domain=your-domain.ngrok-free.app
```

Then set in `.env`:
```env
EXPO_PUBLIC_NGROK_URL=https://your-domain.ngrok-free.app
```

## 🛠️ Troubleshooting

### Issue: "Ngrok URL not responding"

**Solutions:**
1. Check if Ngrok is running: `curl http://localhost:4040/api/tunnels`
2. Verify backend is running: `curl http://localhost:8000/api/health/`
3. Check Ngrok dashboard: https://dashboard.ngrok.com/status/tunnels

### Issue: "App still using local IP"

**Solutions:**
1. Clear Expo cache: `npx expo start --clear`
2. Clear AsyncStorage in app (or reinstall)
3. Verify `.env` file has correct URL
4. Check `app.config.js` is reading environment variable

### Issue: "CORS errors"

**Solutions:**
1. Update Django `CORS_ALLOWED_ORIGINS` in `settings.py`:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://your-subdomain.ngrok.io",
       "exp://192.168.x.x:8081",  # Expo dev server
   ]
   ```

2. Or allow all origins (development only):
   ```python
   CORS_ALLOW_ALL_ORIGINS = True  # Only for development!
   ```

### Issue: "HTTPS certificate errors"

**Solutions:**
- Ngrok provides valid SSL certificates automatically
- If you see errors, check Ngrok status: https://dashboard.ngrok.com

## 📦 Production Build (APK)

For APK builds, the Ngrok URL is baked into the app at build time:

1. **Set environment variable before build:**
   ```bash
   $env:EXPO_PUBLIC_NGROK_URL="https://your-subdomain.ngrok.io"
   npx expo build:android
   ```

2. **Or use EAS Build with secrets:**
   - Add to `eas.json`:
     ```json
     {
       "build": {
         "production": {
           "env": {
             "EXPO_PUBLIC_NGROK_URL": "https://your-subdomain.ngrok.io"
           }
         }
       }
     }
     ```

## 🔐 Security Notes

1. **Ngrok Free Plan:**
   - URLs are public and discoverable
   - Anyone with the URL can access your backend
   - Use for development/testing only

2. **Ngrok Paid Plan:**
   - Can set password protection
   - Can use static domains
   - Better for production testing

3. **Best Practices:**
   - Don't commit `.env` file to Git
   - Use environment variables in CI/CD
   - Rotate Ngrok URLs regularly
   - Use authentication on your backend

## 📝 Files Created

- `.env` - Environment variables (not in Git)
- `.env.example` - Example environment file
- `ngrok-url.txt` - Current Ngrok URL (for reference)
- `start-ngrok.ps1` - PowerShell automation script
- `start-ngrok.bat` - Batch automation script
- `NGROK_SETUP.md` - This documentation

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start Ngrok | `ngrok http 8000` |
| View Ngrok Dashboard | http://localhost:4040 |
| Get Public URL | Check `ngrok-url.txt` or dashboard |
| Update .env | Edit `.env` file |
| Restart Expo | `npx expo start --clear` |
| Test Backend | `curl https://your-url.ngrok.io/api/health/` |

## 💡 Tips

1. **Keep Ngrok Running:**
   - Don't close the Ngrok terminal window
   - Use `start-ngrok.ps1` to run in background

2. **Monitor Traffic:**
   - Visit http://localhost:4040 for request logs
   - Useful for debugging API calls

3. **Static Domain:**
   - Consider Ngrok paid plan for static domains
   - Or use a custom domain with Ngrok

4. **Multiple Devices:**
   - One Ngrok URL works for all devices
   - No need to update each device separately

## 🆘 Support

If you encounter issues:

1. Check Ngrok status: https://dashboard.ngrok.com/status/tunnels
2. Verify backend is running: `curl http://localhost:8000/api/health/`
3. Check Expo logs: `npx expo start`
4. Review this guide's troubleshooting section

---

**Last Updated:** 2025-01-30
**Version:** 1.0.0

