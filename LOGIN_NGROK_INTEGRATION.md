# ✅ Login API Integration with Ngrok - Complete

## Overview
The frontend login is now configured to use the ngrok backend URL: `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev`

## API Endpoint
**URL:** `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/auth/login/`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Format
```json
{
  "email": "ace@evsu.edu.ph",
  "username": "ace@evsu.edu.ph",
  "password": "Calupas#1"
}
```

**Note:** The backend accepts both `email` and `username` fields. The frontend sends both for compatibility.

## Response Format
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 4,
    "username": "ace@evsu.edu.ph",
    "email": "ace@evsu.edu.ph",
    "first_name": "Ace",
    "last_name": "Calupas",
    "role": "student",
    "role_display": "Student",
    "department": "BSIT",
    "student_id": "2022-63028",
    "phone_number": "",
    "profile_picture": null,
    "bio": null,
    "date_joined": "2025-10-23T12:05:54.485857+08:00",
    "last_login": null,
    "permissions": [
      "use_chatbot",
      "view_own_conversations"
    ]
  },
  "message": "Login successful"
}
```

## Changes Made

### 1. ✅ Updated `app.json`
- **File:** `KonsultabotMobileNew/app.json`
- **Change:** Already configured with ngrok URL:
  ```json
  "extra": {
    "apiUrl": "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/"
  }
  ```

### 2. ✅ Enhanced Backend URL Discovery
- **File:** `KonsultabotMobileNew/src/services/apiService.js`
- **Changes:**
  - Improved ngrok URL detection from `app.json` (`Constants.expoConfig.extra.apiUrl`)
  - Added support for `Constants.manifest.extra.apiUrl` (legacy manifest)
  - Better URL cleaning (removes trailing slashes and `/api` suffix)
  - Even if health check fails, still uses ngrok URL (temporary network issues)

### 3. ✅ Updated Login Function
- **File:** `KonsultabotMobileNew/src/services/apiService.js`
- **Changes:**
  - Login now sends both `email` and `username` fields
  - Added `ngrok-skip-browser-warning` header to bypass ngrok browser verification
  - Endpoint: `POST /api/auth/login/` with JSON body

### 4. ✅ Added Ngrok Header to All Requests
- **File:** `KonsultabotMobileNew/src/services/apiService.js`
- **Changes:**
  - Added `ngrok-skip-browser-warning: true` to default headers
  - Request interceptor also adds this header for ngrok URLs
  - Prevents ngrok browser warning page from blocking API requests

### 5. ✅ Response Handling
- **File:** `KonsultabotMobileNew/src/context/AuthContext.js`
- **Status:** Already correctly handles the response format:
  - Extracts `access` token
  - Extracts `refresh` token
  - Extracts `user` object
  - Stores tokens and user data in AsyncStorage
  - Sets auth token in API service

## How It Works

1. **App Startup:**
   - Reads ngrok URL from `app.json` → `Constants.expoConfig.extra.apiUrl`
   - Sets initial base URL to `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api`
   - Attempts health check to verify connectivity

2. **Login Flow:**
   - User enters email and password
   - `LoginScreen` calls `useAuth().login(email, password)`
   - `AuthContext.login()` calls `apiService.login(email, password)`
   - `apiService.login()` sends POST to `/api/auth/login/` with:
     ```json
     {
       "email": "ace@evsu.edu.ph",
       "username": "ace@evsu.edu.ph",
       "password": "Calupas#1"
     }
     ```
   - Backend responds with tokens and user data
   - `AuthContext` stores tokens and user data
   - User is logged in and navigated to main app

3. **Subsequent Requests:**
   - All API requests include `Authorization: Bearer <access_token>` header
   - All requests include `ngrok-skip-browser-warning: true` header
   - Base URL is cached for faster subsequent requests

## Testing

### Test Login:
1. Open the app
2. Navigate to Login screen
3. Enter:
   - **Email:** `ace@evsu.edu.ph`
   - **Password:** `Calupas#1`
4. Tap "Sign In"
5. Should successfully login and navigate to main screen

### Verify API Call:
Check the console logs for:
```
🔐 Attempting login... { username: 'ace@evsu.edu.ph', backendURL: 'https://...ngrok-free.dev/api', passwordLength: 10 }
Making API request to: https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/auth/login/
✅ Login response received: { status: 200, hasToken: true, hasUser: true }
```

## Troubleshooting

### If login fails:

1. **Check Backend is Running:**
   - Verify Django server is running: `python manage.py runserver 0.0.0.0:8000`
   - Verify ngrok tunnel is active: Check `http://localhost:4040/api/tunnels`

2. **Check Ngrok URL:**
   - Verify ngrok URL in `app.json` matches active ngrok tunnel
   - Update if ngrok URL changed: `scripts/update-ngrok-url.ps1`

3. **Check Network:**
   - Ensure device has internet connection
   - Try accessing ngrok URL in browser: `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/health/`

4. **Check Console Logs:**
   - Look for error messages in Metro bundler console
   - Check for CORS or network errors

5. **Clear Cache:**
   - Clear AsyncStorage: Uninstall and reinstall app
   - Clear Metro cache: `npx expo start --clear`

## Files Modified

1. ✅ `KonsultabotMobileNew/src/services/apiService.js`
   - Enhanced ngrok URL discovery
   - Updated login to send email field
   - Added ngrok header to all requests

2. ✅ `KonsultabotMobileNew/app.json`
   - Already configured with ngrok URL (no changes needed)

3. ✅ `KonsultabotMobileNew/src/context/AuthContext.js`
   - Already handles response correctly (no changes needed)

## Next Steps

1. ✅ Login API integrated with ngrok
2. ✅ Response handling configured
3. ✅ Token storage implemented
4. ✅ User data storage implemented

**The login is now fully functional with the ngrok backend!** 🎉

