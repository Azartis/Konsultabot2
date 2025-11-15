# ✅ COMPLETE FIX GUIDE - Mobile Runtime Error & Backend Switching

## 🎯 WHAT THIS FIXES:
1. ✅ "Cannot read property 'S' of undefined" on mobile
2. ✅ Gesture handler initialization errors
3. ✅ Reanimated plugin errors
4. ✅ Automatic backend URL switching (web vs mobile)
5. ✅ Works on any WiFi/hotspot without code changes

---

## 📦 STEP 1: Dependencies Installed

```bash
✅ react-native-gesture-handler
✅ react-native-reanimated
✅ react-native-dotenv
✅ expo-constants
```

---

## 📝 STEP 2: Files Updated

### ✅ `index.js` - Entry Point Fixed
```javascript
// CRITICAL: These imports MUST be first
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

**Why:** These imports initialize the native modules before React Native starts.

---

### ✅ `babel.config.js` - Plugins Added
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',  // ✅ Reanimated
      [
        'module:react-native-dotenv',    // ✅ Environment variables
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
```

**Why:** 
- `reanimated/plugin` - Enables animations on mobile
- `dotenv` - Reads .env file for API URLs

---

### ✅ `.env` - Environment Configuration
```env
# Backend API URLs

# Local API URL - for web development (localhost)
LOCAL_API_URL=http://127.0.0.1:8000/api/

# Public API URL - for mobile (ngrok or deployed backend)
PUBLIC_API_URL=https://your-ngrok-url.ngrok.io/api/
```

**How to update:**
1. Start Django: `python manage.py runserver`
2. Start ngrok: `ngrok http 8000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update `PUBLIC_API_URL=https://abc123.ngrok.io/api/`
5. Restart Expo: `expo start -c`

---

### ✅ `src/config/api.js` - Auto-Switching API Config
```javascript
import { Platform } from 'react-native';
import { LOCAL_API_URL, PUBLIC_API_URL } from '@env';

let BASE_URL;

// Auto-detect platform
if (Platform.OS === 'web') {
  BASE_URL = LOCAL_API_URL;  // Web → localhost
} else {
  BASE_URL = PUBLIC_API_URL;  // Mobile → ngrok/public
}

export { BASE_URL };
```

**How it works:**
- **Web (browser):** Uses `http://127.0.0.1:8000/api/` (localhost)
- **Mobile (phone):** Uses `https://abc123.ngrok.io/api/` (ngrok)
- **Automatic:** No code changes needed when switching networks!

---

## 🚀 STEP 3: How to Use

### For Development (Daily Workflow):

#### 1. Start Backend:
```bash
cd backend
python manage.py runserver
```

#### 2. Start ngrok (for mobile):
```bash
ngrok http 8000
```

#### 3. Update .env:
```bash
# Copy the ngrok HTTPS URL and update .env:
PUBLIC_API_URL=https://abc123.ngrok.io/api/
```

#### 4. Clear Cache & Start Expo:
```bash
expo start -c
```

#### 5. Test:
- **Web:** Press `w` → Opens browser → Uses localhost
- **Mobile:** Scan QR → Opens on phone → Uses ngrok

---

## 📱 STEP 4: Using on Mobile

### First Time Setup:
1. ✅ Install Expo Go on your phone
2. ✅ Connect phone to same WiFi as computer
3. ✅ Start ngrok: `ngrok http 8000`
4. ✅ Update `.env` with ngrok URL
5. ✅ Start Expo: `expo start -c`
6. ✅ Scan QR code with Expo Go

### Daily Usage:
1. ✅ Start Django backend
2. ✅ Start ngrok (new URL each time)
3. ✅ Update `.env` with new ngrok URL
4. ✅ Restart Expo: `expo start -c`
5. ✅ Reload app on phone

---

## 🔧 STEP 5: How to Update Your Existing Code

### In your API calls, use the new config:

#### Before (Hardcoded):
```javascript
const response = await fetch('http://192.168.1.5:8000/api/endpoint/');
```

#### After (Auto-switching):
```javascript
import { BASE_URL } from '../config/api';

const response = await fetch(`${BASE_URL}endpoint/`);
```

### Example Login Function:
```javascript
import { BASE_URL } from '../config/api';

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  return response.json();
}
```

---

## ✅ WHAT WORKS NOW:

### On Web:
- ✅ Uses `http://127.0.0.1:8000/api/` automatically
- ✅ No changes needed when switching networks
- ✅ Works on any computer

### On Mobile:
- ✅ Uses ngrok URL automatically
- ✅ No crashes from gesture-handler/reanimated
- ✅ Works on any WiFi or hotspot
- ✅ Just update .env when ngrok restarts

---

## 🎯 TESTING CHECKLIST:

### Test on Web:
```bash
1. ✅ expo start
2. ✅ Press 'w' (web)
3. ✅ App loads in browser
4. ✅ Can login with test account
5. ✅ Backend responds (localhost)
```

### Test on Mobile:
```bash
1. ✅ Start ngrok: ngrok http 8000
2. ✅ Update .env with ngrok URL
3. ✅ expo start -c
4. ✅ Scan QR on phone
5. ✅ App loads without errors
6. ✅ Can login with test account
7. ✅ Backend responds (ngrok)
```

---

## 🆘 TROUBLESHOOTING:

### Error: "Cannot read property 'S'"
**Solution:** 
```bash
expo start -c
# This clears cache and rebuilds
```

### Error: "Network request failed"
**Solution:**
1. Check ngrok is running
2. Verify ngrok URL in `.env`
3. Restart Expo: `expo start -c`
4. Check phone and computer on same WiFi

### Error: "Module '@env' not found"
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

### ngrok URL Changes Every Time
**Solution:**
- Free ngrok gives new URL each time
- Just update `.env` and restart Expo
- OR get ngrok Pro for static URLs

---

## 💡 PRO TIPS:

### 1. Multiple Developers:
Each developer can use their own `.env`:
```bash
# Developer 1
LOCAL_API_URL=http://127.0.0.1:8000/api/
PUBLIC_API_URL=https://dev1.ngrok.io/api/

# Developer 2
LOCAL_API_URL=http://127.0.0.1:8000/api/
PUBLIC_API_URL=https://dev2.ngrok.io/api/
```

### 2. Production Deployment:
```env
# When you deploy backend to Render/Railway
PUBLIC_API_URL=https://your-app.onrender.com/api/
```

### 3. Team Shared Backend:
```env
# Use one ngrok URL for whole team
PUBLIC_API_URL=https://team-backend.ngrok.io/api/
```

---

## 📊 SUMMARY:

| Issue | Status | Solution |
|-------|--------|----------|
| Runtime error on mobile | ✅ FIXED | Added gesture-handler/reanimated imports |
| "property 'S' undefined" | ✅ FIXED | Proper plugin initialization |
| Hardcoded IPs | ✅ FIXED | .env with platform detection |
| Network changes break app | ✅ FIXED | Just update .env |
| Web vs Mobile different URLs | ✅ FIXED | Automatic platform detection |

---

## 🎉 RESULT:

- ✅ App works on web (localhost)
- ✅ App works on mobile (ngrok)
- ✅ No runtime errors
- ✅ Easy to switch networks
- ✅ One .env file to rule them all!

---

**Next Steps:**
1. Clear Expo cache: `expo start -c`
2. Test on web first
3. Start ngrok and test on mobile
4. Enjoy your working app! 🚀
