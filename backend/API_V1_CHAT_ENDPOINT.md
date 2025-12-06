# API v1 Chat Endpoint Documentation

## Endpoint
**GET** or **POST** `/api/v1/chat/`

## Description
Simple chat endpoint that accepts chat messages and returns AI-generated responses using Gemini.

## Authentication
No authentication required (public endpoint).

## Request Format

The endpoint supports **three methods** to send data:

### Method 1: POST with JSON Body (Recommended)

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
    "query": "Your question or message here",
    "language": "english"  // optional: "english", "tagalog", "bisaya", "waray" (default: "english")
}
```

**Note:** You can also use `"message"` instead of `"query"` - both are accepted.

### Method 2: GET/POST with Query Parameters

You can send the message as URL query parameters:

```
GET /api/v1/chat/?message=Your question here&language=english
```

or

```
POST /api/v1/chat/?message=Your question here&language=english
```

**Query Parameters:**
- `message` or `query`: Your chat message (required)
- `language`: Language preference (optional, default: "english")

### Required Fields
- `query` or `message`: The chat message/question (string, required)

### Optional Fields
- `language`: Language preference (string, optional, default: "english")

## Response Format

### Success Response (200 OK)
```json
{
    "status": "success",
    "response": "AI-generated response text",
    "language": "english",
    "mode": "online"
}
```

### Error Responses

#### 400 Bad Request - Missing Body
```json
{
    "status": "error",
    "message": "Request body is required",
    "code": "MISSING_BODY"
}
```

#### 400 Bad Request - Invalid JSON
```json
{
    "status": "error",
    "message": "Invalid JSON in request body",
    "code": "INVALID_JSON"
}
```

#### 400 Bad Request - Missing Query
```json
{
    "status": "error",
    "message": "Query or message is required",
    "code": "MISSING_QUERY"
}
```

#### 500 Internal Server Error
```json
{
    "status": "error",
    "message": "Unable to generate response. Please try again.",
    "code": "RESPONSE_GENERATION_FAILED"
}
```

## Sample HTTP Requests

### Using cURL - POST with JSON Body
```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I connect to WiFi?",
    "language": "english"
  }'
```

### Using cURL - GET with Query Parameters
```bash
curl "http://localhost:8000/api/v1/chat/?message=How%20do%20I%20connect%20to%20WiFi?&language=english"
```

### Using cURL - POST with Query Parameters
```bash
curl -X POST "http://localhost:8000/api/v1/chat/?message=How%20do%20I%20connect%20to%20WiFi?&language=english"
```

### Using PowerShell (Windows) - POST with JSON Body
```powershell
$body = @{
    query = "How do I connect to WiFi?"
    language = "english"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Using PowerShell (Windows) - GET with Query Parameters
```powershell
$message = "How do I connect to WiFi?"
$language = "english"
$uri = "http://localhost:8000/api/v1/chat/?message=$([System.Web.HttpUtility]::UrlEncode($message))&language=$language"

Invoke-RestMethod -Uri $uri -Method GET
```

### Using Python (requests)
```python
import requests

url = "http://localhost:8000/api/v1/chat/"
headers = {"Content-Type": "application/json"}
data = {
    "query": "How do I connect to WiFi?",
    "language": "english"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### Using JavaScript (fetch)
```javascript
fetch('http://localhost:8000/api/v1/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'How do I connect to WiFi?',
    language: 'english'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Using Postman - Method 1: POST with JSON Body
1. Method: **POST**
2. URL: `http://localhost:8000/api/v1/chat/`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
    "query": "How do I connect to WiFi?",
    "language": "english"
}
```

### Using Postman - Method 2: GET with Query Parameters
1. Method: **GET**
2. URL: `http://localhost:8000/api/v1/chat/?message=How do I connect to WiFi?&language=english`
3. No headers or body needed

## Example Responses

### Successful Response
```json
{
    "status": "success",
    "response": "To connect to WiFi, you need to:\n\n1. Open your device's WiFi settings\n2. Look for the network name (SSID)\n3. Enter the password when prompted\n4. Wait for the connection to be established\n\nIf you're having trouble, make sure you're within range of the WiFi router and that you have the correct password.",
    "language": "english",
    "mode": "online"
}
```

## Notes
- The endpoint uses Gemini AI to generate responses
- Internet connection is required for the AI to work
- The endpoint is rate-limited by default Django settings
- Replace `localhost:8000` with your actual server IP/domain if accessing remotely

