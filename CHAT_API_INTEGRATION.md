# ✅ Chat API Integration with Ngrok - Complete

## Overview
The frontend chat is now configured to use the ngrok backend URL: `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/`

## API Endpoint
**URL:** `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Format
```json
{
  "message": "my phone is not turning on",
  "language": "english"
}
```

**Optional Fields:**
- `session_id`: For maintaining conversation context
- `is_satisfied`: User satisfaction feedback
- Other additional data fields

## Response Format
```json
{
  "status": "success",
  "response": "Oh no, that's definitely frustrating! A phone not turning on...",
  "language": "english",
  "mode": "online"
}
```

## Changes Made

### 1. ✅ Updated `sendV1ChatMessage` Function
- **File:** `KonsultabotMobileNew/src/services/apiService.js`
- **Changes:**
  - Changed payload field from `query` to `message` (matches backend API)
  - Added `ensureBackendURL()` call to ensure ngrok URL is used
  - Added response transformation to map backend format to frontend format:
    - Backend: `{status, response, language, mode}`
    - Frontend: `{text, message, status, language, mode, ...}`
  - Added better error handling and retry logic
  - Added logging for debugging

### 2. ✅ Response Transformation
The function now automatically transforms the backend response:
```javascript
// Backend returns:
{
  status: "success",
  response: "Answer text here...",
  language: "english",
  mode: "online"
}

// Transformed to (for compatibility):
{
  status: "success",
  response: "Answer text here...",
  text: "Answer text here...",      // ← Added for compatibility
  message: "Answer text here...",   // ← Added for compatibility
  language: "english",
  mode: "online"
}
```

### 3. ✅ Ngrok URL Integration
- Uses ngrok URL from `app.json` via `discoverBackendURL()`
- Automatically adds `ngrok-skip-browser-warning` header
- Falls back to cached URL if discovery fails
- Retries with new URL if network error occurs

## How It Works

1. **User Sends Message:**
   - User types message in chat screen
   - `ImprovedChatScreen` calls `apiService.sendV1ChatMessage(text, 'english', null, {...})`

2. **API Service:**
   - Ensures backend URL is discovered (uses ngrok URL from `app.json`)
   - Sends POST request to `/api/v1/chat/` with:
     ```json
     {
       "message": "my phone is not turning on",
       "language": "english"
     }
     ```
   - Includes auth token if user is logged in
   - Includes `ngrok-skip-browser-warning` header

3. **Backend Response:**
   - Backend processes message and returns:
     ```json
     {
       "status": "success",
       "response": "Oh no, that's definitely frustrating!...",
       "language": "english",
       "mode": "online"
     }
     ```

4. **Response Transformation:**
   - API service transforms response to include `text` and `message` fields
   - Maintains original `status`, `language`, and `mode` fields

5. **Chat Screen:**
   - Receives transformed response
   - Extracts `data.text || data.message` for display
   - Shows bot message in chat interface

## Code Flow

```
User Input
  ↓
ImprovedChatScreen.sendMessage()
  ↓
apiService.sendV1ChatMessage(message, language, sessionId, additionalData)
  ↓
ensureBackendURL() → Uses ngrok URL from app.json
  ↓
POST /api/v1/chat/ with {message, language, ...}
  ↓
Backend Response: {status, response, language, mode}
  ↓
Transform: Add {text, message} fields
  ↓
Return to Chat Screen
  ↓
Display bot message
```

## Testing

### Test Chat:
1. Open the app
2. Navigate to Chat screen
3. Type a message: "my phone is not turning on"
4. Send the message
5. Should receive a response from the backend

### Verify API Call:
Check the console logs for:
```
💬 Sending chat message to: https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/
Making API request to: https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/
API response received: 200
```

## Example Request/Response

### Request:
```http
POST https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/
Content-Type: application/json
Authorization: Bearer <access_token>
ngrok-skip-browser-warning: true

{
  "message": "my phone is not turning on",
  "language": "english"
}
```

### Response:
```json
{
  "status": "success",
  "response": "Oh no, that's definitely frustrating! A phone not turning on can be caused by several things...",
  "language": "english",
  "mode": "online"
}
```

### Transformed Response (for frontend):
```json
{
  "status": "success",
  "response": "Oh no, that's definitely frustrating!...",
  "text": "Oh no, that's definitely frustrating!...",
  "message": "Oh no, that's definitely frustrating!...",
  "language": "english",
  "mode": "online"
}
```

## Troubleshooting

### If chat fails:

1. **Check Backend is Running:**
   - Verify Django server: `python manage.py runserver 0.0.0.0:8000`
   - Verify ngrok tunnel: Check `http://localhost:4040/api/tunnels`

2. **Check Ngrok URL:**
   - Verify ngrok URL in `app.json` matches active tunnel
   - Update if changed: `scripts/update-ngrok-url.ps1`

3. **Check Network:**
   - Ensure device has internet
   - Test endpoint: `https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/?message=test`

4. **Check Console Logs:**
   - Look for error messages in Metro bundler
   - Check for CORS or network errors
   - Verify response transformation is working

5. **Check Authentication:**
   - Ensure user is logged in (if auth required)
   - Check access token is valid

## Files Modified

1. ✅ `KonsultabotMobileNew/src/services/apiService.js`
   - Updated `sendV1ChatMessage()` to use `message` field
   - Added response transformation
   - Enhanced error handling and retry logic

2. ✅ `KonsultabotMobileNew/app.json`
   - Already configured with ngrok URL (no changes needed)

3. ✅ `KonsultabotMobileNew/src/screens/main/ImprovedChatScreen.js`
   - Already handles response correctly (no changes needed)

## Compatibility

The response transformation ensures backward compatibility:
- Old code expecting `data.text` → ✅ Works
- Old code expecting `data.message` → ✅ Works
- New code using `data.response` → ✅ Works
- New code using `data.status`, `data.mode` → ✅ Works

## Next Steps

1. ✅ Chat API integrated with ngrok
2. ✅ Response format handled correctly
3. ✅ Error handling and retry logic implemented
4. ✅ Backward compatibility maintained

**The chat is now fully functional with the ngrok backend!** 🎉

