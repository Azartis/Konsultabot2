# 📶 Campus Free WiFi Setup Guide

## Making KonsultaBot Work on Campus Free WiFi

### 🎯 Problem
The app doesn't work on campus free WiFi because:
1. Network restrictions block certain ports
2. Firewall blocks direct connections
3. Need to bypass captive portals

### ✅ Solutions Implemented

---

## Solution 1: Use Expo Tunnel Mode (RECOMMENDED)

Expo tunnel bypasses local network restrictions completely!

```bash
# Always start with tunnel mode on campus WiFi:
npx expo start --tunnel
```

**Why this works:**
- Routes through Expo's cloud servers
- Bypasses campus firewall
- Works on ANY WiFi network
- No port forwarding needed

---

## Solution 2: Update Backend for Public Access

Make your Django backend accessible from campus WiFi:

### Step 1: Find Your Computer's IP
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

### Step 2: Update Backend Settings

Edit `backend/django_konsultabot/django_konsultabot/settings.py`:

```python
# Add campus WiFi IP to ALLOWED_HOSTS
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '192.168.1.17',  # Your home network
    '10.0.0.0/8',    # Campus network range
    '*',             # Allow all (for development only!)
]

# Update CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://10.0.0.0:8081",  # Campus network
]

CORS_ALLOW_ALL_ORIGINS = True  # For development
```

### Step 3: Start Backend with 0.0.0.0
```bash
cd backend\django_konsultabot
python manage.py runserver 0.0.0.0:8000
```

This makes the backend accessible from any device on the network!

---

## Solution 3: Update Mobile App Config

Make the app auto-detect campus network:

Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "auto-detect"
    }
  }
}
```

The app will automatically find the backend server!

---

## Solution 4: Use Mobile Hotspot (Backup)

If campus WiFi still blocks:
1. Use your mobile data hotspot
2. Connect both PC and phone to the hotspot
3. Run the app normally

---

## 🚀 Quick Campus Setup

### On Campus WiFi:

**Step 1: Start Backend**
```bash
cd backend\django_konsultabot
python manage.py runserver 0.0.0.0:8000
```

**Step 2: Start Mobile App with Tunnel**
```bash
cd KonsultabotMobileNew
npx expo start --tunnel --go
```

**Step 3: Connect Phone**
1. Connect phone to campus WiFi
2. Open Expo Go app
3. Scan QR code
4. App loads! ✅

---

## 🔍 Troubleshooting Campus WiFi

### Issue: "Cannot connect to server"

**Solution 1: Check Firewall**
- Windows Firewall might block Python/Node.js
- Allow through firewall:
  ```
  Windows Security → Firewall → Allow an app
  ✓ Python
  ✓ Node.js
  ```

**Solution 2: Use Different Port**
If port 8000 is blocked on campus:
```bash
# Try port 8080 instead:
python manage.py runserver 0.0.0.0:8080

# Update app.json:
"apiUrl": "http://YOUR_IP:8080/api"
```

**Solution 3: Use HTTPS (Advanced)**
Some campus networks require HTTPS. Set up with ngrok:
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 8000

# Use the https URL provided by ngrok
```

---

## 📱 Mobile Data Alternative

If all else fails, use mobile data:
1. Enable mobile hotspot on your phone
2. Connect your PC to the phone's hotspot  
3. Run the app normally
4. Backend will be accessible via hotspot network

---

## ✅ Verification Steps

1. **Check Backend Accessible:**
   - On phone, open browser
   - Visit: `http://YOUR_PC_IP:8000/api/health/`
   - Should see: `{"status": "ok"}`

2. **Check Expo Tunnel:**
   - Terminal shows: "Tunnel connected"
   - QR code displays properly
   - URL starts with `exp://`

3. **Test Connection:**
   - Scan QR code
   - App loads
   - Chat works
   - ✅ Success!

---

## 🎓 Campus Network Tips

1. **Use Tunnel Mode Always**
   - Most reliable on campus WiFi
   - Bypasses all restrictions

2. **Backend on 0.0.0.0**
   - Makes it accessible from any device
   - Essential for campus networks

3. **Check Ports**
   - Some ports might be blocked
   - Try: 8000, 8080, 3000, 5000

4. **Mobile Hotspot Backup**
   - Always works
   - Use when WiFi fails

---

## 🔧 Quick Fix Commands

**Stuck on Campus WiFi?**
```bash
# Terminal 1 - Backend with public access:
cd backend\django_konsultabot
python manage.py runserver 0.0.0.0:8000

# Terminal 2 - Mobile with tunnel:
cd KonsultabotMobileNew
npx expo start --tunnel --go --clear
```

**Still not working?**
```bash
# Use ngrok for HTTPS:
ngrok http 8000
# Copy the https URL and update app.json
```

---

## 📋 Checklist for Campus Demo

- [ ] Backend running on 0.0.0.0:8000
- [ ] Expo started with --tunnel flag
- [ ] Phone connected to campus WiFi
- [ ] Firewall allows Python and Node.js
- [ ] Expo Go app installed
- [ ] QR code scans successfully
- [ ] App loads and chat works

---

**Your app is now campus WiFi ready!** 🎉
