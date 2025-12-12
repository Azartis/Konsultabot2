# 📋 Complete API Endpoints Reference

**Base URL:** `http://your-server:8000` or `https://your-ngrok-url.ngrok-free.dev`

All endpoints are **PUBLIC** (no authentication required).

---

## 🏠 Root & Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API root - shows all available endpoints |
| `GET` | `/api/` | API root - shows all available endpoints |
| `GET` | `/api/health/` | Health check endpoint |
| `GET` | `/health/` | Health check redirect |

---

## 🔐 Authentication Endpoints (`/api/auth/`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/auth/login/` | User login | `{"username": "user", "password": "pass"}` |
| `POST` | `/api/auth/register/` | User registration | `{"username": "user", "email": "email@example.com", "password": "pass"}` |
| `POST` | `/api/auth/logout/` | User logout | `{}` |
| `POST` | `/api/auth/token/` | Get JWT token pair | `{"username": "user", "password": "pass"}` |
| `POST` | `/api/auth/token/refresh/` | Refresh JWT token | `{"refresh": "token"}` |
| `GET` | `/api/auth/profile/` | Get user profile | - |
| `PUT` | `/api/auth/profile/` | Update user profile | `{"first_name": "John", ...}` |
| `POST` | `/api/auth/change-password/` | Change password | `{"old_password": "old", "new_password": "new"}` |
| `GET` | `/api/auth/users/` | List all users | - |
| `GET` | `/api/auth/users/<user_id>/` | Get user by ID | - |
| `GET` | `/api/auth/users/stats/` | Get user statistics | - |
| `GET` | `/api/auth/permissions/` | Check permissions | - |
| `GET` | `/api/auth/check-username/` | Check username availability | `?username=test` |

---

## 💬 Chat Endpoints (`/api/v1/chat/`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/v1/chat/` | Main chat endpoint | `{"query": "Hello", "language": "english", "session_id": "uuid"}` |
| `POST` | `/api/v1/chat/speech-to-text/` | Convert speech to text | `{"audio": "base64_audio_data"}` |
| `POST` | `/api/v1/chat/text-to-speech/` | Convert text to speech | `{"text": "Hello", "language": "english"}` |
| `POST` | `/api/v1/chat/translate/` | Translate text | `{"text": "Hello", "source": "en", "target": "es"}` |
| `POST` | `/api/v1/chat/feedback/` | Submit feedback | `{"message_id": "id", "rating": 5, "comment": "Great!"}` |
| `GET` | `/api/v1/chat/sessions/<session_id>/history/` | Get session history | - |
| `GET` | `/api/v1/chat/history/` | Get chat history | `?session_id=uuid&limit=10` |
| `GET` | `/api/v1/chat/health/` | Chat health check | - |
| `GET` | `/api/v1/chat/languages/` | Get supported languages | - |
| `GET` | `/api/v1/chat/ping/` | Test ping endpoint | - |
| `GET` | `/api/v1/chat/test-simple/` | Simple test endpoint | - |
| `GET` | `/api/v1/chat/test-gemini/` | Test Gemini connection | - |

### Gemini Endpoints (`/api/v1/chat/gemini/`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/v1/chat/gemini/` | Gemini AI chat | `{"query": "Hello", "context": null}` |
| `POST` | `/api/v1/chat/gemini/translate/` | Gemini translation | `{"text": "Hello", "target_lang": "es"}` |
| `POST` | `/api/v1/chat/gemini/image/` | Generate image with Gemini | `{"prompt": "A cat"}` |

---

## 📚 Knowledge Base Endpoints (`/api/v1/knowledge/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/knowledge/` | Knowledge Base API (placeholder) |

---

## 📊 Analytics Endpoints (`/api/v1/analytics/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/` | Analytics API (placeholder) |

---

## 🛠️ Admin Panel Endpoints (`/api/v1/admin/`)

### Dashboard

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/dashboard/stats/` | Get dashboard statistics | `?days=30` |

### Conversations

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/conversations/` | List all conversations | `?page=1&limit=20` |
| `GET` | `/api/v1/admin/conversations/<session_id>/` | Get conversation details | - |
| `GET` | `/api/v1/admin/conversations/export/csv/` | Export conversations to CSV | `?start_date=2024-01-01&end_date=2024-12-31` |

### Users (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/users/` | List all users | - |
| `POST` | `/api/v1/admin/api/users/` | Create user | `{"username": "user", "email": "email@example.com", ...}` |
| `GET` | `/api/v1/admin/api/users/<id>/` | Get user by ID | - |
| `PUT` | `/api/v1/admin/api/users/<id>/` | Update user (full) | `{"username": "user", ...}` |
| `PATCH` | `/api/v1/admin/api/users/<id>/` | Update user (partial) | `{"first_name": "John"}` |
| `DELETE` | `/api/v1/admin/api/users/<id>/` | Delete user | - |

### Intents (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/intents/` | List all intents | - |
| `POST` | `/api/v1/admin/api/intents/` | Create intent | `{"name": "greeting", "description": "..."}` |
| `GET` | `/api/v1/admin/api/intents/<id>/` | Get intent by ID | - |
| `PUT` | `/api/v1/admin/api/intents/<id>/` | Update intent (full) | - |
| `PATCH` | `/api/v1/admin/api/intents/<id>/` | Update intent (partial) | - |
| `DELETE` | `/api/v1/admin/api/intents/<id>/` | Delete intent | - |

### Keywords (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/keywords/` | List all keywords | - |
| `POST` | `/api/v1/admin/api/keywords/` | Create keyword | `{"word": "hello", "intent_id": 1}` |
| `GET` | `/api/v1/admin/api/keywords/<id>/` | Get keyword by ID | - |
| `PUT` | `/api/v1/admin/api/keywords/<id>/` | Update keyword (full) | - |
| `PATCH` | `/api/v1/admin/api/keywords/<id>/` | Update keyword (partial) | - |
| `DELETE` | `/api/v1/admin/api/keywords/<id>/` | Delete keyword | - |

### Knowledge Base Items (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/knowledge-base/` | List all KB items | - |
| `POST` | `/api/v1/admin/api/knowledge-base/` | Create KB item | `{"title": "FAQ", "content": "...", "category": "general"}` |
| `GET` | `/api/v1/admin/api/knowledge-base/<id>/` | Get KB item by ID | - |
| `PUT` | `/api/v1/admin/api/knowledge-base/<id>/` | Update KB item (full) | - |
| `PATCH` | `/api/v1/admin/api/knowledge-base/<id>/` | Update KB item (partial) | - |
| `DELETE` | `/api/v1/admin/api/knowledge-base/<id>/` | Delete KB item | - |

### Notification Templates (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/notification-templates/` | List all templates | - |
| `POST` | `/api/v1/admin/api/notification-templates/` | Create template | `{"name": "Welcome", "subject": "...", "body": "..."}` |
| `GET` | `/api/v1/admin/api/notification-templates/<id>/` | Get template by ID | - |
| `PUT` | `/api/v1/admin/api/notification-templates/<id>/` | Update template (full) | - |
| `PATCH` | `/api/v1/admin/api/notification-templates/<id>/` | Update template (partial) | - |
| `DELETE` | `/api/v1/admin/api/notification-templates/<id>/` | Delete template | - |

### Notifications (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/notifications/` | List all notifications | - |
| `POST` | `/api/v1/admin/api/notifications/` | Create notification | `{"user_id": 1, "template_id": 1, "data": {}}` |
| `GET` | `/api/v1/admin/api/notifications/<id>/` | Get notification by ID | - |
| `PUT` | `/api/v1/admin/api/notifications/<id>/` | Update notification (full) | - |
| `PATCH` | `/api/v1/admin/api/notifications/<id>/` | Update notification (partial) | - |
| `DELETE` | `/api/v1/admin/api/notifications/<id>/` | Delete notification | - |

### Settings (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/settings/` | List all settings | - |
| `POST` | `/api/v1/admin/api/settings/` | Create setting | `{"key": "max_sessions", "value": "10"}` |
| `GET` | `/api/v1/admin/api/settings/<id>/` | Get setting by ID | - |
| `PUT` | `/api/v1/admin/api/settings/<id>/` | Update setting (full) | - |
| `PATCH` | `/api/v1/admin/api/settings/<id>/` | Update setting (partial) | - |
| `DELETE` | `/api/v1/admin/api/settings/<id>/` | Delete setting | - |

### Activities (ViewSet - CRUD)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/admin/api/activities/` | List all admin activities | - |
| `POST` | `/api/v1/admin/api/activities/` | Create activity log | `{"action": "create", "resource": "user", "details": {}}` |
| `GET` | `/api/v1/admin/api/activities/<id>/` | Get activity by ID | - |
| `PUT` | `/api/v1/admin/api/activities/<id>/` | Update activity (full) | - |
| `PATCH` | `/api/v1/admin/api/activities/<id>/` | Update activity (partial) | - |
| `DELETE` | `/api/v1/admin/api/activities/<id>/` | Delete activity | - |

---

## 📝 Example Requests

### Chat Example
```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hello, how are you?",
    "language": "english",
    "session_id": "optional-session-id"
  }'
```

### Login Example
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ace@evsu.edu.ph",
    "password": "your-password"
  }'
```

### Get All Users Example
```bash
curl -X GET http://localhost:8000/api/v1/admin/api/users/
```

### Create Intent Example
```bash
curl -X POST http://localhost:8000/api/v1/admin/api/intents/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "greeting",
    "description": "User greeting intent"
  }'
```

---

## 🔗 Quick Reference

**Replace `http://localhost:8000` with your actual server URL or ngrok URL**

- **Local:** `http://localhost:8000`
- **Network:** `http://192.168.x.x:8000`
- **Ngrok:** `https://your-subdomain.ngrok-free.dev`

All endpoints are **PUBLIC** - no authentication tokens required!

---

## 📌 Notes

1. **All endpoints are PUBLIC** - No authentication required
2. **CORS enabled** - Accessible from any origin
3. **CSRF disabled** - No CSRF tokens needed for API routes
4. **JSON format** - All requests/responses use JSON
5. **ViewSets** - Support standard REST operations (GET, POST, PUT, PATCH, DELETE)

