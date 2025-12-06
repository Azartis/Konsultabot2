# API Auth Register Endpoint Documentation

## Endpoint
**GET** or **POST** `/api/auth/register/`

## Description
User registration endpoint that accepts user information and creates a new user account. Returns JWT tokens and user information as JSON.

## Authentication
No authentication required (public endpoint for registration).

## Request Format

The endpoint supports **two methods** to send data:

### Method 1: POST with JSON Body (Recommended)

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "department": "Computer Science",
    "student_id": "2024-001",
    "phone_number": "+1234567890"
}
```

### Method 2: GET/POST with Query Parameters

You can send data as URL query parameters:

```
GET /api/auth/register/?username=johndoe&email=john.doe@example.com&password=SecurePassword123!&password_confirm=SecurePassword123!&first_name=John&last_name=Doe&department=Computer%20Science&student_id=2024-001&phone_number=%2B1234567890
```

## Required Fields

The following fields are **REQUIRED** for registration:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `username` | string | Unique username for the user (max 150 characters) | `"johndoe"` |
| `email` | string | Valid email address | `"john.doe@example.com"` |
| `password` | string | User password (must meet Django password validation requirements) | `"SecurePassword123!"` |
| `password_confirm` | string | Password confirmation (must match password) | `"SecurePassword123!"` |

## Optional Fields

The following fields are **OPTIONAL** for registration:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `first_name` | string | User's first name | `"John"` |
| `last_name` | string | User's last name | `"Doe"` |
| `department` | string | User's department (max 100 characters) | `"Computer Science"` |
| `student_id` | string | Student ID number (max 20 characters) | `"2024-001"` |
| `phone_number` | string | Contact phone number (max 15 characters) | `"+1234567890"` |

**Note:** All new users are automatically assigned the role `"student"` by default.

## Response Format

### Success Response (201 Created)
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "student",
        "role_display": "Student",
        "department": "Computer Science",
        "student_id": "2024-001",
        "phone_number": "+1234567890",
        "profile_picture": null,
        "bio": null,
        "date_joined": "2024-01-20T14:30:00Z",
        "last_login": null,
        "permissions": ["use_chatbot", "view_own_conversations"]
    },
    "message": "Registration successful"
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields
```json
{
    "username": ["This field is required."],
    "email": ["This field is required."],
    "password": ["This field is required."],
    "password_confirm": ["This field is required."]
}
```

#### 400 Bad Request - Password Mismatch
```json
{
    "non_field_errors": [
        "Passwords don't match."
    ]
}
```

#### 400 Bad Request - Invalid Email
```json
{
    "email": ["Enter a valid email address."]
}
```

#### 400 Bad Request - Username Already Exists
```json
{
    "username": ["A user with that username already exists."]
}
```

#### 400 Bad Request - Email Already Exists
```json
{
    "email": ["User with this email already exists."]
}
```

#### 400 Bad Request - Weak Password
```json
{
    "password": [
        "This password is too short. It must contain at least 8 characters.",
        "This password is too common.",
        "This password is entirely numeric."
    ]
}
```

## Sample HTTP Requests

### Using cURL - POST with JSON Body
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "department": "Computer Science",
    "student_id": "2024-001",
    "phone_number": "+1234567890"
  }'
```

### Using cURL - GET with Query Parameters
```bash
curl "http://localhost:8000/api/auth/register/?username=johndoe&email=john.doe@example.com&password=SecurePassword123!&password_confirm=SecurePassword123!&first_name=John&last_name=Doe&department=Computer%20Science&student_id=2024-001&phone_number=%2B1234567890"
```

### Using PowerShell (Windows) - POST with JSON Body
```powershell
$body = @{
    username = "johndoe"
    email = "john.doe@example.com"
    password = "SecurePassword123!"
    password_confirm = "SecurePassword123!"
    first_name = "John"
    last_name = "Doe"
    department = "Computer Science"
    student_id = "2024-001"
    phone_number = "+1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Using PowerShell (Windows) - GET with Query Parameters
```powershell
$params = @{
    username = "johndoe"
    email = "john.doe@example.com"
    password = "SecurePassword123!"
    password_confirm = "SecurePassword123!"
    first_name = "John"
    last_name = "Doe"
    department = "Computer Science"
    student_id = "2024-001"
    phone_number = "+1234567890"
}

$queryString = ($params.GetEnumerator() | ForEach-Object { 
    "$($_.Key)=$([System.Web.HttpUtility]::UrlEncode($_.Value))" 
}) -join '&'

$uri = "http://localhost:8000/api/auth/register/?$queryString"
Invoke-RestMethod -Uri $uri -Method GET
```

### Using Python (requests) - POST with JSON Body
```python
import requests

url = "http://localhost:8000/api/auth/register/"
headers = {"Content-Type": "application/json"}
data = {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "department": "Computer Science",
    "student_id": "2024-001",
    "phone_number": "+1234567890"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()

print(f"Access Token: {result['access']}")
print(f"User: {result['user']['username']}")
```

### Using JavaScript (fetch) - POST with JSON Body
```javascript
fetch('http://localhost:8000/api/auth/register/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    password_confirm: 'SecurePassword123!',
    first_name: 'John',
    last_name: 'Doe',
    department: 'Computer Science',
    student_id: '2024-001',
    phone_number: '+1234567890'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Access Token:', data.access);
  console.log('User:', data.user);
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
})
.catch(error => console.error('Error:', error));
```

### Using Postman - Method 1: POST with JSON Body
1. Method: **POST**
2. URL: `http://localhost:8000/api/auth/register/`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "department": "Computer Science",
    "student_id": "2024-001",
    "phone_number": "+1234567890"
}
```

### Using Postman - Method 2: GET with Query Parameters
1. Method: **GET**
2. URL: `http://localhost:8000/api/auth/register/?username=johndoe&email=john.doe@example.com&password=SecurePassword123!&password_confirm=SecurePassword123!&first_name=John&last_name=Doe&department=Computer%20Science&student_id=2024-001&phone_number=%2B1234567890`

## Minimum Required Request

The absolute minimum required fields for registration:

**JSON Body:**
```json
{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!"
}
```

**Query Parameters:**
```
?username=johndoe&email=john.doe@example.com&password=SecurePassword123!&password_confirm=SecurePassword123!
```

## Password Requirements

The password must meet Django's password validation requirements:
- Minimum 8 characters (configurable)
- Cannot be too common
- Cannot be entirely numeric
- Should contain a mix of letters, numbers, and special characters (recommended)

## Notes
- All new users are automatically assigned the `"student"` role
- The endpoint returns JWT tokens (access and refresh) upon successful registration
- Users are automatically logged in after registration
- Username and email must be unique
- Replace `localhost:8000` with your actual server IP/domain if accessing remotely
- **Security Warning:** Sending passwords in URL query parameters is less secure. Use JSON body for production applications.

