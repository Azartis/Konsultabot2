# Phone Connection Setup Guide

## Problem
When scanning the QR code on your phone, the app can't connect to the backend because it's trying to use the wrong IP address.

## Solution

### Step 1: Find Your Computer's IP Address

Run this command in PowerShell:
```powershell
.\GET_IP_ADDRESS.ps1
```

Or manually:
1. Open Command Prompt
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
4. Note the IP (e.g., `192.168.1.17` or `10.143.17.242`)

### Step 2: Start Backend on Network Interface

**IMPORTANT**: The backend must run on `0.0.0.0:8000` (not `localhost:8000`) to be accessible from your phone.

**Option A: Use the helper script**
```batch
.\START_BACKEND_FOR_PHONE.bat
```

**Option B: Manual start**
```batch
cd ..\backend\konsultabot_backend
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Verify Backend is Accessible

1. On your computer, open browser and go to: `http://YOUR_IP:8000/api/health/`
   - Replace `YOUR_IP` with the IP from Step 1
   - You should see: `{"status":"healthy","message":"Server is running",...}`

2. On your phone's browser, try the same URL
   - If it works, the backend is accessible
   - If it doesn't, check:
     - Phone and computer are on the same WiFi network
     - Windows Firewall isn't blocking port 8000
     - Backend is running on `0.0.0.0:8000` (not `localhost`)

### Step 4: Update API Service (if needed)

If your IP is not in the discovery list, you can add it:

1. Open `src/services/apiService.js`
2. Find the `getPossibleBackendURLs()` function
3. Add your IP to the list:
   ```javascript
   urls.push(
     'http://YOUR_IP:8000/api',  // Add this line
     'http://10.143.17.242:8000/api',
     // ... rest of the list
   );
   ```

### Step 5: Start Expo and Scan QR Code

```batch
npm start
```

Then scan the QR code with Expo Go on your phone.

## Troubleshooting

### "Network Error" on Phone

1. **Check Backend is Running**
   - Look for Django server output showing `0.0.0.0:8000`
   - If it shows `127.0.0.1:8000` or `localhost:8000`, restart with `0.0.0.0:8000`

2. **Check Same Network**
   - Phone and computer must be on the same WiFi network
   - Mobile data won't work (use WiFi)

3. **Check Windows Firewall**
   - Windows might be blocking port 8000
   - Allow Python through firewall or add port 8000 exception

4. **Check IP Address**
   - Run `.\GET_IP_ADDRESS.ps1` to verify your current IP
   - IP might change if you reconnect to WiFi

### Backend Discovery Keeps Failing

The app tries multiple IPs automatically. If none work:

1. Clear the app cache in Expo Go (shake device → "Reload")
2. Check backend logs for connection attempts
3. Verify backend health endpoint: `http://YOUR_IP:8000/api/health/`

### Still Not Working?

1. **Test from phone browser first**
   - Open `http://YOUR_IP:8000/api/health/` on phone browser
   - If this works, the backend is accessible
   - If not, fix network/firewall issues first

2. **Check Expo Metro bundler**
   - Make sure Metro is running
   - Check the QR code is for the correct network

3. **Restart everything**
   - Stop backend (Ctrl+C)
   - Stop Expo (Ctrl+C)
   - Start backend: `.\START_BACKEND_FOR_PHONE.bat`
   - Start Expo: `npm start`
   - Reload app on phone

## Quick Checklist

- [ ] Backend running on `0.0.0.0:8000` (not localhost)
- [ ] Phone and computer on same WiFi network
- [ ] Can access `http://YOUR_IP:8000/api/health/` from phone browser
- [ ] Windows Firewall allows port 8000
- [ ] Expo Metro bundler is running
- [ ] App reloaded after backend started

## Common IP Addresses

- **Home WiFi**: Usually `192.168.1.x` or `192.168.0.x`
- **Campus WiFi**: Usually `10.x.x.x` or `172.x.x.x`
- **Mobile Hotspot**: Usually `192.168.43.x` or `172.20.10.x`
- **Android Emulator**: Always `10.0.2.2` (only works in emulator)

