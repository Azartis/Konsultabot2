# 🚀 Quick Start: Ngrok Setup

## Problem: `ngrok` command not found

If you see `ngrok : The term 'ngrok' is not recognized`, use one of these solutions:

---

## ✅ **Solution 1: Use the Automated Script (RECOMMENDED)**

The repository has an automated script that handles everything:

```powershell
# From repository root
cd backend
.\start_backend_and_ngrok.ps1
```

This script will:
1. ✅ Start Django on `0.0.0.0:8000`
2. ✅ Start Ngrok automatically
3. ✅ Get the public Ngrok URL
4. ✅ Update mobile app config automatically

**Note:** The script looks for `ngrok.exe` in the `backend/` folder. If it's not there, copy it from `KonsultabotMobileNew/ngrok.exe`.

---

## ✅ **Solution 2: Copy ngrok.exe to Backend Folder**

If you have `ngrok.exe` in `KonsultabotMobileNew/`, copy it to `backend/`:

```powershell
# From repository root
Copy-Item "KonsultabotMobileNew\ngrok.exe" -Destination "backend\ngrok.exe"
cd backend
.\start_backend_and_ngrok.ps1
```

---

## ✅ **Solution 3: Use Full Path to ngrok.exe**

If `ngrok.exe` is in `KonsultabotMobileNew/`:

```powershell
# From backend/django_konsultabot directory
cd ..\..
.\KonsultabotMobileNew\ngrok.exe http 8000
```

---

## ✅ **Solution 4: Download & Install Ngrok**

1. **Download Ngrok:**
   - Visit: https://ngrok.com/download
   - Download Windows version
   - Extract `ngrok.exe`

2. **Option A: Add to PATH**
   - Copy `ngrok.exe` to a folder in your PATH (e.g., `C:\Windows\System32`)
   - Or add the folder to PATH in System Environment Variables

3. **Option B: Place in Backend Folder**
   - Copy `ngrok.exe` to `backend/ngrok.exe`
   - Use the automated script: `.\start_backend_and_ngrok.ps1`

---

## 🎯 **Recommended: Use Automated Script**

The easiest way is to use the automated script:

```powershell
# Step 1: Copy ngrok.exe to backend (if needed)
cd backend
if (-not (Test-Path ".\ngrok.exe")) {
    Copy-Item "..\KonsultabotMobileNew\ngrok.exe" -Destination ".\ngrok.exe"
}

# Step 2: Run the automated script
.\start_backend_and_ngrok.ps1
```

This will:
- ✅ Start Django automatically
- ✅ Start Ngrok automatically
- ✅ Get the public URL
- ✅ Update mobile app config
- ✅ Save URL to `.ngrok-last-url`

---

## 📝 **Manual Start (If Script Doesn't Work)**

If you prefer to start manually:

```powershell
# Terminal 1: Start Django
cd backend\django_konsultabot
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Start Ngrok (use full path)
cd ..\..
.\KonsultabotMobileNew\ngrok.exe http 8000
```

Then copy the HTTPS URL (e.g., `https://abc123.ngrok-free.dev`) and update:
- `KonsultabotMobileNew/.env`: `EXPO_PUBLIC_NGROK_URL=https://abc123.ngrok-free.dev`
- `backend/django_konsultabot/.env`: `NGROK_URL=https://abc123.ngrok-free.dev`

---

## ✅ **Verify Ngrok is Running**

After starting Ngrok, check:
- Open: http://localhost:4040 (Ngrok web interface)
- Look for the HTTPS URL (e.g., `https://abc123.ngrok-free.dev`)
- Test: `https://abc123.ngrok-free.dev/api/health/` (should return JSON)

---

## 🆘 **Troubleshooting**

**"ngrok.exe not found"**
- Copy `ngrok.exe` from `KonsultabotMobileNew/` to `backend/`
- Or download from https://ngrok.com/download

**"Port 8000 already in use"**
- Stop Django if it's already running
- Or use a different port: `ngrok http 8001` (and update Django port)

**"Ngrok URL not accessible"**
- Make sure Django is running on `0.0.0.0:8000` (not `127.0.0.1:8000`)
- Check Windows Firewall allows port 8000
- Verify Ngrok is running: http://localhost:4040

---

**The automated script (`start_backend_and_ngrok.ps1`) is the easiest way!** 🎯

