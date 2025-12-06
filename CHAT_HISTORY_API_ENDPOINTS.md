# 📋 Chat History API Endpoints

Based on your current setup, here are the API endpoints to fetch chat history from the backend database.

## 🌐 Base URL
```
https://unmutated-nondeprecatively-bonnie.ngrok-free.dev
```

---

## 💬 Chat History Endpoints

### 1. Get All Chat History
**Get chat history for all sessions (last 50 messages)**

**Endpoint:**
```
GET https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN (optional - currently public)
ngrok-skip-browser-warning: true
```

**Query Parameters (Optional):**
- `session_id` - Get history for a specific session

**Example Request:**
```bash
# Get all chat history
curl -X GET "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true"
```

**Example Response:**
```json
{
  "status": "success",
  "history": [
    {
      "id": 1,
      "session": {
        "session_id": "abc123",
        "user": 4,
        "created_at": "2025-01-15T10:30:00Z"
      },
      "message": "Hello, how can I help?",
      "response": "I can help you with...",
      "timestamp": "2025-01-15T10:30:15Z",
      "language": "english",
      "source": "backend"
    },
    {
      "id": 2,
      "session": {
        "session_id": "abc123",
        "user": 4,
        "created_at": "2025-01-15T10:30:00Z"
      },
      "message": "What is Python?",
      "response": "Python is a programming language...",
      "timestamp": "2025-01-15T10:31:00Z",
      "language": "english",
      "source": "backend"
    }
  ],
  "count": 2
}
```

---

### 2. Get Chat History for Specific Session
**Get chat history for a specific session ID**

**Endpoint:**
```
GET https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/?session_id=YOUR_SESSION_ID
```

**Example Request:**
```bash
curl -X GET "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/?session_id=abc123" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true"
```

**Example Response:**
```json
{
  "status": "success",
  "history": [
    {
      "id": 1,
      "session": {
        "session_id": "abc123",
        "user": 4,
        "created_at": "2025-01-15T10:30:00Z"
      },
      "message": "Hello",
      "response": "Hi there!",
      "timestamp": "2025-01-15T10:30:15Z",
      "language": "english",
      "source": "backend"
    }
  ],
  "count": 1
}
```

**Error Response (Session Not Found):**
```json
{
  "status": "error",
  "message": "Session not found",
  "code": "SESSION_NOT_FOUND"
}
```

---

### 3. Get Session History (Alternative Endpoint)
**Get history for a specific session using path parameter**

**Endpoint:**
```
GET https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/sessions/{session_id}/history/
```

**Example Request:**
```bash
curl -X GET "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/sessions/abc123/history/" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true"
```

---

## 🔧 Using in Frontend (Current Implementation)

Your frontend already uses this endpoint in `apiService.js`:

```javascript
// Get conversation history
async getConversationHistory() {
  return this.api.get('/chat/history/');
}

// Get chat sessions
async getChatSessions() {
  return this.api.get('/chat/sessions/');
}
```

**Note:** The frontend uses `/chat/history/` which maps to `/api/v1/chat/history/` because the base URL already includes `/api`.

---

## 📝 Using in Code

### JavaScript/Fetch
```javascript
// Get all chat history
fetch('https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    // Optional: Add auth token if needed
    // 'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Chat History:', data.history);
  console.log('Count:', data.count);
})
.catch(error => {
  console.error('Error:', error);
});
```

### Python/Requests
```python
import requests

url = "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/"
headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
}

response = requests.get(url, headers=headers)
data = response.json()

print(f"Status: {data['status']}")
print(f"Count: {data['count']}")
for message in data['history']:
    print(f"Message: {message['message']}")
    print(f"Response: {message['response']}")
```

### PowerShell
```powershell
$url = "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/"
$headers = @{
    "Content-Type" = "application/json"
    "ngrok-skip-browser-warning" = "true"
}

$response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
Write-Host "Status: $($response.status)"
Write-Host "Count: $($response.count)"
$response.history | ForEach-Object {
    Write-Host "Message: $($_.message)"
    Write-Host "Response: $($_.response)"
}
```

---

## 🔍 Response Fields

Each message in the history array contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Message ID |
| `session` | object | Session information |
| `session.session_id` | string | Unique session identifier |
| `session.user` | integer | User ID |
| `session.created_at` | string | Session creation timestamp |
| `message` | string | User's message |
| `response` | string | Bot's response |
| `timestamp` | string | Message timestamp (ISO 8601) |
| `language` | string | Language code (e.g., "english") |
| `source` | string | Response source (e.g., "backend", "gemini") |

---

## ⚠️ Important Notes

1. **Current Status:** The endpoint is **PUBLIC** (no authentication required) based on your backend configuration.

2. **Ngrok Header:** Always include `ngrok-skip-browser-warning: true` header to bypass ngrok's browser warning page.

3. **Rate Limiting:** The endpoint returns the last 50 messages by default when no `session_id` is provided.

4. **User Filtering:** Currently, the endpoint returns all messages. To filter by user, you may need to:
   - Add user filtering in the backend
   - Filter client-side using the `session.user` field

5. **Session Management:** Use `session_id` to get history for a specific conversation session.

---

## 🔄 Related Endpoints

### Get Chat Sessions
```
GET https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/sessions/
```

### End Chat Session
```
POST https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/sessions/end/
Body: {"session_id": "abc123"}
```

---

## 📊 Example: Get User's Chat History

To get chat history for a specific user (e.g., user ID 4), you would need to filter client-side:

```javascript
// Get all history
const response = await fetch('https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/', {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

const data = await response.json();

// Filter by user ID
const userId = 4;
const userHistory = data.history.filter(msg => 
  msg.session && msg.session.user === userId
);

console.log(`User ${userId} has ${userHistory.length} messages`);
```

---

## 🎯 Quick Reference

**Main Endpoint:**
```
GET https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/
```

**With Session ID:**
```
GET https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/history/?session_id=YOUR_SESSION_ID
```

**Alternative (Path Parameter):**
```
GET https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api/v1/chat/sessions/{session_id}/history/
```

---

**Last Updated:** Based on current setup with ngrok URL: `unmutated-nondeprecatively-bonnie.ngrok-free.dev`

