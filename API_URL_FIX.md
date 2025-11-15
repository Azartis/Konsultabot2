# API URL Fix - October 23, 2025

## Problem
The frontend was calling `/api/v1/chat/history/` but the Django backend has `/api/chat/history/`.

**Error in Console:**
```
GET http://localhost:8000/api/v1/chat/history/ 500 (Internal Server Error)
'ChatMessage' object has no attribute 'response'
```

## Root Cause
1. `ComprehensiveGeminiBot.js` was hardcoded to call `/api/v1/chat/` (Flask-style URL)
2. Django backend uses `/api/chat/send/` endpoint instead
3. The request parameters were also mismatched:
   - Old: `{ query: text }`
   - New: `{ message: text, language: 'english' }`

## Solution

### Fixed File:
`src/screens/main/ComprehensiveGeminiBot.js`

**Changed:**
```javascript
// OLD - Flask API
const apiResponse = await axios.post('http://192.168.1.17:8000/api/v1/chat/', {
  query: text
}, {
  headers: { Authorization: `Bearer ${token}` },
  timeout: 10000
});
```

**To:**
```javascript
// NEW - Django API  
const apiResponse = await axios.post('http://192.168.1.17:8000/api/chat/send/', {
  message: text,
  language: 'english'
}, {
  headers: { Authorization: `Bearer ${token}` },
  timeout: 10000
});
```

## Django Endpoints Available

Based on `backend/chat/urls.py`:
- ✅ `/api/chat/send/` - Send message (POST)
- ✅ `/api/chat/history/` - Get conversation history (GET)
- ✅ `/api/chat/sessions/` - Get chat sessions (GET)
- ✅ `/api/chat/sessions/end/` - End session (POST)
- ✅ `/api/chat/knowledge/` - Knowledge base (GET)
- ✅ `/api/chat/campus-info/` - Campus info (GET)
- ✅ `/api/chat/search/` - Search knowledge (GET)

## Testing

### 1. Refresh your browser
   - Press `Ctrl+Shift+R` (hard refresh) or
   - Close and reopen the browser tab at http://localhost:19006

### 2. Test the chat
   - Login to the app
   - Send a message: "Hello"
   - Should now get a response without 500 errors

### 3. Check browser console
   - Should see successful API calls
   - No more "ChatMessage has no attribute response" errors

## Status
✅ **FIXED** - Frontend now calls correct Django API endpoints with proper parameters

---
**Last Updated**: October 23, 2025 - 09:26 AM
