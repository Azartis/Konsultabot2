# API Auth Login Endpoint Documentation

## Endpoint
**GET** or **POST** `/api/auth/login/`

## Description
User authentication endpoint that accepts email and password, and returns JWT tokens and user information as JSON.

## Authentication
No authentication required (public endpoint for login).

## Request Format

The endpoint supports **two methods** to send credentials:

### Method 1: POST with JSON Body (Recommended)

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
    "email": "user@example.com",
    "password": "your_password"
}
```

**Note:** You can also use `"username"` instead of `"email"` for backward compatibility.

### Method 2: GET/POST with Query Parameters

You can send credentials as URL query parameters:

```
GET /api/auth/login/?email=user@example.com&password=your_password
```

or

```
POST /api/auth/login/?email=user@example.com&password=your_password
```

**Query Parameters:**
- `email` or `username`: User's email address or username (required)
- `password`: User's password (required)

### Required Fields
- `email` or `username`: User's email address or username (string, required)
- `password`: User's password (string, required)

## Response Format

### Success Response (200 OK)
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
        "id": 1,
        "username": "johndoe",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "student",
        "role_display": "Student",
        "department": "Computer Science",
        "student_id": "2024-001",
        "phone_number": "+1234567890",
        "profile_picture": null,
        "bio": null,
        "date_joined": "2024-01-15T10:30:00Z",
        "last_login": "2024-01-20T14:20:00Z",
        "permissions": ["use_chatbot", "view_own_conversations"]
    },
    "message": "Login successful"
}
```

### Error Responses

#### 400 Bad Request - Missing Credentials
```json
{
    "email": ["Either email or username is required."],
    "password": ["Password is required."]
}
```

#### 400 Bad Request - Invalid Credentials
```json
{
    "non_field_errors": [
        "Invalid credentials. Please check your email/username and password."
    ]
}
```

#### 400 Bad Request - Account Disabled
```json
{
    "non_field_errors": [
        "User account is disabled."
    ]
}
```

## Sample HTTP Requests

### Using cURL - POST with JSON Body
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

### Using cURL - GET with Query Parameters
```bash
curl "http://localhost:8000/api/auth/login/?email=user@example.com&password=your_password"
```

### Using cURL - POST with Query Parameters
```bash
curl -X POST "http://localhost:8000/api/auth/login/?email=user@example.com&password=your_password"
```

### Using PowerShell (Windows) - POST with JSON Body
```powershell
$body = @{
    email = "user@example.com"
    password = "your_password"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Using PowerShell (Windows) - GET with Query Parameters
```powershell
$email = [System.Web.HttpUtility]::UrlEncode("user@example.com")
$password = [System.Web.HttpUtility]::UrlEncode("your_password")
$uri = "http://localhost:8000/api/auth/login/?email=$email&password=$password"

Invoke-RestMethod -Uri $uri -Method GET
```

### Using Python (requests)
```python
import requests

url = "http://localhost:8000/api/auth/login/"
headers = {"Content-Type": "application/json"}
data = {
    "email": "user@example.com",
    "password": "your_password"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()

# Access tokens
access_token = result['access']
refresh_token = result['refresh']
user_data = result['user']

print(f"Access Token: {access_token}")
print(f"User: {user_data['username']}")
```

### Using JavaScript (fetch)
```javascript
fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'your_password'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Access Token:', data.access);
  console.log('User:', data.user);
  // Store tokens for authenticated requests
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
})
.catch(error => console.error('Error:', error));
```

### Using Postman - Method 1: POST with JSON Body
1. Method: **POST**
2. URL: `http://localhost:8000/api/auth/login/`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
    "email": "user@example.com",
    "password": "your_password"
}
```

### Using Postman - Method 2: GET with Query Parameters
1. Method: **GET**
2. URL: `http://localhost:8000/api/auth/login/?email=user@example.com&password=your_password`
3. No headers or body needed

## Using the Access Token

After successful login, use the `access` token in subsequent authenticated requests:

### Example: Authenticated Request
```bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Example: Using Token in JavaScript
```javascript
fetch('http://localhost:8000/api/auth/profile/', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(response => response.json())
.then(data => console.log('Profile:', data));
```

## Token Refresh

When the access token expires, use the refresh token to get a new access token:

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

## Notes
- The endpoint accepts both `email` and `username` for login
- Tokens are JWT (JSON Web Tokens) and should be stored securely
- Access tokens typically expire after a set time (check your JWT settings)
- Use the refresh token to obtain new access tokens without re-login
- Replace `localhost:8000` with your actual server IP/domain if accessing remotely
- The `user` object in the response contains all user profile information and permissions

