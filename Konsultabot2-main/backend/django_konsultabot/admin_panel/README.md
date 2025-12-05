# KonsultaBot Admin Panel - Complete Documentation

## Overview

A comprehensive Admin Panel system for managing the KonsultaBot chatbot platform. This system provides full CRUD operations for managing users, intents, keywords, knowledge base, tickets, notifications, and system settings.

## Features Implemented

### ✅ 1. Dashboard
- **Endpoint**: `GET /api/v1/admin/dashboard/stats/`
- **Features**:
  - Total users count
  - Total conversations count
  - Total tickets count (open/resolved)
  - Total queries count
  - Most common intents
  - Usage chart data (last 7/30 days)
  - Recent admin activities

### ✅ 2. User Management
- **Endpoint**: `GET /api/v1/admin/api/users/`
- **Features**:
  - List all users with pagination
  - Search and filter users (by role, active status, name, email)
  - View user details with conversation history
  - Activate/deactivate users
  - View user's conversation count

### ✅ 3. Knowledge Base Manager
- **Endpoint**: `GET /api/v1/admin/api/knowledge-base/`
- **Features**:
  - CRUD operations for FAQs, troubleshooting steps, device guides
  - Add tags/categories
  - Markdown/rich text support
  - Search and filter by category, language, active status
  - View count tracking
  - Helpful/not helpful feedback tracking

### ✅ 4. Intent & Keyword Manager
- **Endpoints**:
  - `GET /api/v1/admin/api/intents/` - List all intents
  - `POST /api/v1/admin/api/intents/{id}/add_keyword/` - Add keyword to intent
  - `GET /api/v1/admin/api/keywords/` - List all keywords
- **Features**:
  - Add/edit/delete intents
  - Add/edit/delete keywords
  - Map keywords to intents
  - Priority ordering
  - Usage tracking and success rate

### ✅ 5. Chatbot Settings
- **Endpoint**: `GET /api/v1/admin/api/settings/`
- **Features**:
  - Configure greeting messages
  - Clarification prompts
  - Unknown response messages
  - Escalation settings
  - AI auto-learning toggle
  - System-wide configuration

### ✅ 6. Conversation Logs
- **Endpoints**:
  - `GET /api/v1/admin/conversations/` - List conversations
  - `GET /api/v1/admin/conversations/{session_id}/` - Conversation detail
  - `GET /api/v1/admin/conversations/export/csv/` - Export to CSV
- **Features**:
  - Searchable table of all conversations
  - Filter by user, date range
  - Detail view with all messages
  - Export to CSV

### ✅ 7. Ticketing System
- **Endpoint**: `GET /api/v1/admin/api/tickets/`
- **Features**:
  - View all reported issues
  - Assign tickets to admins
  - Add internal notes
  - Change ticket status
  - Timeline history per ticket
  - Export to CSV

### ✅ 8. Notifications Manager
- **Endpoints**:
  - `GET /api/v1/admin/api/notification-templates/` - Templates
  - `POST /api/v1/admin/api/notifications/send_bulk/` - Send bulk notifications
- **Features**:
  - Create notification templates
  - Send announcements to users
  - Track delivery status
  - In-app notifications

### ✅ 9. Admin & Role Management
- **Endpoints**:
  - `GET /api/v1/admin/api/activities/` - Admin activity logs
- **Features**:
  - Admin activity tracking
  - Role-based access control
  - Permissions system
  - Audit trail

### ✅ 10. System Settings
- **Endpoint**: `GET /api/v1/admin/api/settings/`
- **Features**:
  - App configuration
  - API keys management
  - Branding settings
  - Model selection

## Database Structure

### Rule-Based System

**Current Status**: The project currently uses **pure Gemini Flash** (no rule-based keyword matching). However, the Admin Panel includes models for a **rule-based system** that can be integrated:

#### Intent Model
- Stores intent classifications (tech_support, general, chit_chat, etc.)
- Maps to keywords for rule-based matching
- Tracks usage and success rates

#### Keyword Model
- Maps keywords to intents
- Supports weight-based matching
- Exact match and case-sensitive options

#### Integration Point
The rule-based system can be integrated into `chatbot_core/chatbot_flow.py` or `chatbot_core/ai_handler.py` to:
1. Check keywords before calling Gemini
2. Use intent-based responses for common queries
3. Fall back to Gemini for unmatched queries

### Models Created

1. **Intent** - Intent classifications
2. **Keyword** - Keywords mapped to intents
3. **KnowledgeBaseItem** - FAQs, guides, troubleshooting
4. **Ticket** - Support tickets
5. **TicketNote** - Internal notes on tickets
6. **TicketHistory** - Ticket status change history
7. **NotificationTemplate** - Notification templates
8. **Notification** - Sent notifications
9. **ChatbotSettings** - System configuration
10. **AdminActivity** - Admin action logs
11. **AdminRole** - Custom admin roles
12. **AdminUserRole** - User-role assignments

## Installation

### 1. Run Migrations

```bash
cd backend/django_konsultabot
python manage.py migrate admin_panel
```

### 2. Create Admin User

```bash
python manage.py createsuperuser
```

Or set user role to 'admin' in Django admin:
- Go to `/admin/`
- Edit user → Set role to 'admin'

### 3. Access Admin Panel API

All endpoints are available at:
- Base URL: `http://localhost:8000/api/v1/admin/`
- Dashboard: `http://localhost:8000/api/v1/admin/dashboard/stats/`

## API Authentication

All endpoints require:
1. **Authentication**: JWT token (from `/api/auth/login/`)
2. **Authorization**: User must have `role='admin'` or `is_staff=True`

### Example Request

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8000/api/v1/admin/dashboard/stats/
```

## Frontend Integration

The backend is ready for React frontend integration. Example API calls:

```javascript
// Dashboard stats
const response = await fetch('http://localhost:8000/api/v1/admin/dashboard/stats/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Users list
const users = await fetch('http://localhost:8000/api/v1/admin/api/users/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create intent
await fetch('http://localhost:8000/api/v1/admin/api/intents/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'wifi_issue',
    intent_type: 'tech_support',
    priority: 8,
    default_response: 'I can help you with WiFi issues...'
  })
});
```

## Seeding Demo Data

Create a management command to seed demo data:

```python
# admin_panel/management/commands/seed_admin_data.py
from django.core.management.base import BaseCommand
from admin_panel.models import Intent, Keyword, KnowledgeBaseItem

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Create intents
        intent1 = Intent.objects.create(
            name='wifi_issue',
            intent_type='tech_support',
            priority=8,
            default_response='I can help you troubleshoot WiFi connectivity issues.'
        )
        
        # Add keywords
        Keyword.objects.create(
            intent=intent1,
            keyword='wifi',
            weight=2.0
        )
        Keyword.objects.create(
            intent=intent1,
            keyword='internet',
            weight=1.5
        )
        
        # Create KB items
        KnowledgeBaseItem.objects.create(
            title='WiFi Connection Issues',
            category='troubleshooting',
            question='How to fix WiFi connection problems?',
            answer='1. Restart your router\n2. Check WiFi password\n3. Restart device',
            tags='wifi,network,connectivity',
            keywords='wifi,internet,connection'
        )
```

Run with:
```bash
python manage.py seed_admin_data
```

## Next Steps

1. **Create React Frontend**: Build a React admin panel UI
2. **Integrate Rule-Based System**: Add keyword matching to chatbot flow
3. **Add Real-time Updates**: WebSocket support for live updates
4. **Export Features**: Add more export formats (PDF, Excel)
5. **Analytics Dashboard**: Enhanced charts and visualizations

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/dashboard/stats/` | GET | Dashboard statistics |
| `/api/v1/admin/api/users/` | GET | List users |
| `/api/v1/admin/api/users/{id}/` | GET | User details |
| `/api/v1/admin/api/users/{id}/toggle_active/` | POST | Activate/deactivate user |
| `/api/v1/admin/api/intents/` | GET, POST | Intents CRUD |
| `/api/v1/admin/api/keywords/` | GET, POST | Keywords CRUD |
| `/api/v1/admin/api/knowledge-base/` | GET, POST | Knowledge base CRUD |
| `/api/v1/admin/api/tickets/` | GET, POST | Tickets CRUD |
| `/api/v1/admin/api/tickets/{id}/assign/` | POST | Assign ticket |
| `/api/v1/admin/api/tickets/{id}/resolve/` | POST | Resolve ticket |
| `/api/v1/admin/api/tickets/export/csv/` | GET | Export tickets CSV |
| `/api/v1/admin/api/notification-templates/` | GET, POST | Notification templates |
| `/api/v1/admin/api/notifications/send_bulk/` | POST | Send bulk notifications |
| `/api/v1/admin/api/settings/` | GET, POST | System settings |
| `/api/v1/admin/api/activities/` | GET | Admin activity logs |
| `/api/v1/admin/conversations/` | GET | Conversation logs |
| `/api/v1/admin/conversations/{session_id}/` | GET | Conversation detail |
| `/api/v1/admin/conversations/export/csv/` | GET | Export conversations CSV |

## Permissions

- **IsAdminOrStaff**: Admin or staff users
- **IsAdmin**: Admin users only
- **IsAdminOrITStaff**: Admin or IT staff users

## Notes

- All timestamps are in UTC
- Pagination is available on list endpoints (use `?page=1&page_size=20`)
- Search and filtering available on most list endpoints
- All create/update/delete operations are logged in AdminActivity

