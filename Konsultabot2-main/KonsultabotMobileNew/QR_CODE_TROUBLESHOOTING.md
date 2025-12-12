# QR Code Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: QR Code Won't Scan

**Symptoms:**
- QR code appears but phone can't connect
- "Unable to connect" error in Expo Go
- QR code is blurry or not loading

**Solutions:**

#### Option A: Use Tunnel Mode (Recommended)
Tunnel mode works even if your phone and computer are on different networks:

```powershell
cd KonsultabotMobileNew
.\start-expo-with-qr.ps1
```

Or manually:
```powershell
npx expo start --tunnel --clear
```

#### Option B: Use LAN Mode (Faster, Same Network)
If phone and computer are on the same WiFi:

```powershell
cd KonsultabotMobileNew
.\start-expo-lan.ps1
```

Or manually:
```powershell
npx expo start --lan --clear
```

#### Option C: Manual URL Entry
1. Look for the `exp://` URL in the terminal
2. Copy the entire URL (e.g., `exp://192.168.1.17:8081`)
3. Open Expo Go app on your phone
4. Tap "Enter URL manually"
5. Paste the URL

---

### Issue 2: "Unable to Connect" Error

**Causes:**
- Phone and computer on different networks (use tunnel mode)
- Firewall blocking port 8081
- Wrong IP address

**Solutions:**

1. **Check Firewall:**
   ```powershell
   # Allow port 8081 through Windows Firewall
   netsh advfirewall firewall add rule name="Expo Dev Server" dir=in action=allow protocol=TCP localport=8081
   ```

2. **Verify Network:**
   - Make sure phone and computer are on the same WiFi (for LAN mode)
   - Or use tunnel mode if on different networks

3. **Check IP Address:**
   ```powershell
   # Get your computer's IP address
   ipconfig | findstr IPv4
   ```
   - Make sure the IP in the QR code matches your computer's IP

---

### Issue 3: QR Code Not Appearing

**Solutions:**

1. **Clear Cache and Restart:**
   ```powershell
   npx expo start --clear
   ```

2. **Check Terminal Output:**
   - Look for the QR code in the terminal
   - If it's not showing, try a different terminal (Windows Terminal, PowerShell, CMD)

3. **Use Web Interface:**
   - Press `w` in Expo terminal to open in web browser
   - QR code will be visible in the browser

---

### Issue 4: "Network Request Failed" in App

**Causes:**
- Backend not running
- Wrong API URL configured
- Ngrok URL changed

**Solutions:**

1. **Check Backend is Running:**
   ```powershell
   # Test backend health
   Invoke-WebRequest -Uri "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/health/" -Headers @{'ngrok-skip-browser-warning'='true'}
   ```

2. **Verify Ngrok URL:**
   - Make sure backend Ngrok is running
   - Check `KonsultabotMobileNew/.env` has correct `EXPO_PUBLIC_NGROK_URL`
   - Restart Expo after updating `.env`

3. **Check API Configuration:**
   - Verify `app.config.js` has the correct Ngrok URL
   - Check `app_config/api_base_url.js` is updated

---

## 📱 Step-by-Step: Connect Your Phone

### Method 1: QR Code (Easiest)

1. **Start Expo:**
   ```powershell
   cd KonsultabotMobileNew
   .\start-expo-with-qr.ps1
   ```

2. **Install Expo Go:**
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

3. **Scan QR Code:**
   - Open Expo Go app
   - Tap "Scan QR Code"
   - Point camera at QR code in terminal
   - Wait for app to load

### Method 2: Manual URL Entry

1. **Get the URL:**
   - Look in terminal for `exp://` URL
   - Copy the entire URL

2. **Enter in Expo Go:**
   - Open Expo Go app
   - Tap "Enter URL manually"
   - Paste the URL
   - Tap "Connect"

### Method 3: Share via Email/Link

1. **Get Shareable Link:**
   - In Expo terminal, press `s` to get shareable link
   - Copy the link

2. **Send to Phone:**
   - Email it to yourself
   - Or use messaging app
   - Open link on phone (will open in Expo Go)

---

## 🔧 Advanced Troubleshooting

### Check Expo is Running Correctly

```powershell
# Test if Expo server is accessible
Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing
```

### Reset Expo Cache

```powershell
cd KonsultabotMobileNew
npx expo start --clear
# Or
npm start -- --reset-cache
```

### Check Network Configuration

```powershell
# Get your IP address
ipconfig | findstr IPv4

# Test if port 8081 is open
Test-NetConnection -ComputerName localhost -Port 8081
```

### Use Different Port

If port 8081 is blocked:

```powershell
npx expo start --port 8082
```

---

## ✅ Quick Checklist

Before asking for help, check:

- [ ] Expo Go app is installed on phone
- [ ] Backend is running (`python manage.py runserver 0.0.0.0:8000`)
- [ ] Ngrok is running (if using Ngrok)
- [ ] Phone and computer on same WiFi (for LAN mode) OR using tunnel mode
- [ ] Windows Firewall allows port 8081
- [ ] Expo started with `--clear` flag
- [ ] Tried both tunnel and LAN mode
- [ ] Tried manual URL entry

---

## 🆘 Still Not Working?

1. **Check Expo Logs:**
   - Look for error messages in terminal
   - Check for network errors

2. **Try Different Network:**
   - Switch to mobile hotspot
   - Or use tunnel mode

3. **Reinstall Expo Go:**
   - Uninstall and reinstall Expo Go app
   - Clear app cache

4. **Check Backend Connection:**
   - Make sure backend is accessible
   - Test health endpoint from phone browser

---

## 📞 Need More Help?

Common error messages and solutions:

- **"Unable to connect to server"** → Use tunnel mode or check firewall
- **"Network request failed"** → Check backend is running and Ngrok URL is correct
- **"Metro bundler error"** → Clear cache with `--clear` flag
- **"Module not found"** → Run `npm install` in KonsultabotMobileNew folder

