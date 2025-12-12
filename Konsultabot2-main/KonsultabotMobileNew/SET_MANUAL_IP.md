# Set Manual Backend IP

If automatic discovery isn't working, you can manually set the backend IP.

## Method 1: Using AsyncStorage (Recommended)

Add this code temporarily to your app to set the IP:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set your computer's IP address
await AsyncStorage.setItem('manual_backend_url', 'http://YOUR_IP:8000/api');
```

Replace `YOUR_IP` with your actual IP (e.g., `192.168.1.17` or `10.143.17.242`).

## Method 2: Update apiService.js Directly

Edit `src/services/apiService.js` and add your IP to the list:

```javascript
const getPossibleBackendURLs = () => {
  const urls = [];
  
  // Add your IP here (first in list = highest priority)
  urls.push('http://YOUR_IP:8000/api');
  
  // ... rest of the code
};
```

## Find Your IP

Run this in PowerShell:
```powershell
.\GET_IP_ADDRESS.ps1
```

Or manually:
```powershell
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

## Verify Backend is Running

1. Start backend: `.\START_BACKEND_FOR_PHONE.bat`
2. Test from phone browser: `http://YOUR_IP:8000/api/health/`
3. Should see: `{"status":"healthy",...}`

