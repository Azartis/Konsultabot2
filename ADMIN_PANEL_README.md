# KonsultaBot Admin Panel

A comprehensive admin panel system for managing the KonsultaBot chatbot platform. This admin panel provides full CRUD operations for knowledge base items, intents, tickets, users, conversations, and system settings.

## Features

### 1. Dashboard
- Real-time metrics (total users, conversations, tickets, KB items)
- Usage charts (last 7/30 days)
- Most common intents visualization
- Recent activities and tickets

### 2. User Management
- List all users with pagination
- View user profiles and conversation history
- Activate/deactivate users
- Search and filter users

### 3. Knowledge Base Manager
- CRUD operations for FAQs, troubleshooting steps, and device guides
- Add tags and categories
- Markdown/rich text editor support
- Publish/unpublish items
- Track usage statistics

### 4. Intent & Keyword Manager
- Add/edit/delete intents
- Manage keywords and patterns
- Map responses to KB items
- Priority ordering
- Preview testing tool

### 5. Chatbot Settings
- Configure greeting messages
- Set clarification prompts
- Unknown response messages
- Escalation settings
- AI auto-learning toggle

### 6. Conversation Logs
- Searchable table of all conversations
- Filter by user, date, keyword
- Detail view of each chat
- Export to CSV

### 7. Ticketing System
- View all reported issues
- Assign tickets to admins
- Add internal notes
- Change ticket status
- Timeline history per ticket

### 8. Notifications Manager
- Create notification templates
- Send announcements to users
- Push/FCM integration ready

### 9. Admin & Role Management
- Admin CRUD operations
- Role-based access control
- Permissions system
- Admin activity logs

### 10. System Settings
- App configuration
- API keys management
- Branding (logo, colors)
- Backup/restore
- Model selection

## Installation

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend/django_konsultabot
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Run migrations:**
```bash
python manage.py makemigrations admin_panel
python manage.py migrate
```

4. **Create superuser (if needed):**
```bash
python manage.py createsuperuser
```

5. **Start Django server:**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd admin-panel-frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3000`

## API Endpoints

All admin panel APIs are prefixed with `/api/v1/admin/`:

- `GET /api/v1/admin/dashboard/` - Dashboard statistics
- `GET /api/v1/admin/knowledge-base/` - List KB items
- `POST /api/v1/admin/knowledge-base/` - Create KB item
- `GET /api/v1/admin/knowledge-base/{id}/` - Get KB item
- `PATCH /api/v1/admin/knowledge-base/{id}/` - Update KB item
- `DELETE /api/v1/admin/knowledge-base/{id}/` - Delete KB item
- `POST /api/v1/admin/knowledge-base/{id}/publish/` - Publish KB item

- `GET /api/v1/admin/intents/` - List intents
- `POST /api/v1/admin/intents/` - Create intent
- `GET /api/v1/admin/intents/{id}/test/` - Test intent matching

- `GET /api/v1/admin/tickets/` - List tickets
- `POST /api/v1/admin/tickets/{id}/assign/` - Assign ticket
- `POST /api/v1/admin/tickets/{id}/resolve/` - Resolve ticket

- `GET /api/v1/admin/users/` - List users
- `POST /api/v1/admin/users/{id}/activate/` - Activate user
- `POST /api/v1/admin/users/{id}/deactivate/` - Deactivate user

- `GET /api/v1/admin/conversations/` - List conversations
- `GET /api/v1/admin/conversations/{id}/messages/` - Get conversation messages

- `GET /api/v1/admin/query-logs/` - List query logs
- `GET /api/v1/admin/query-logs/export_csv/` - Export logs to CSV

- `GET /api/v1/admin/system-settings/` - List settings
- `PATCH /api/v1/admin/system-settings/{id}/` - Update setting

## Authentication

The admin panel uses JWT authentication. To login:

1. Navigate to `/login`
2. Enter admin username and password
3. Token is stored in localStorage

**Note:** Only users with `role='admin'` or `role='it_staff'` can access the admin panel.

## Database Models

### KnowledgeBaseItem
- Stores FAQs, troubleshooting steps, and device guides
- Categories: FAQ, Troubleshooting, Device Guide, General
- Status: Draft, Published, Archived

### Intent
- Defines chatbot intents and keywords
- Maps to KB items for responses
- Priority-based ordering

### Ticket
- Support tickets from users
- Status: Open, In Progress, Resolved, Closed, Escalated
- Priority: Low, Medium, High, Urgent

### NotificationTemplate
- Reusable notification templates
- Supports email, push, SMS

### SystemSettings
- System-wide configuration
- Categories: Chatbot, AI, Notifications, Branding, Security, General

### AdminActivity
- Audit log of all admin actions
- Tracks changes and IP addresses

## Adding Knowledge Base Items

1. Navigate to **Knowledge Base** in the admin panel
2. Click **Add Item**
3. Fill in:
   - Title
   - Category (FAQ, Troubleshooting, Device Guide, General)
   - Question
   - Answer (supports markdown)
   - Tags (comma-separated)
   - Priority (1-10)
4. Set status to **Published** to make it live
5. Click **Create**

## Managing Intents & Keywords

1. Navigate to **Intents & Keywords**
2. Click **Add Intent**
3. Fill in:
   - Name (slug, e.g., `wifi_issue`)
   - Display Name (e.g., "WiFi Connection Issue")
   - Keywords (comma-separated, e.g., "wifi, network, connection")
   - Priority (1-10)
4. Map to KB items if needed
5. Use **Test** button to preview matching

## How Chatbot Uses Intents & Keywords

1. User sends a message
2. System extracts keywords from the message
3. Matches keywords against intent definitions
4. If match found:
   - Uses mapped KB item response (if available)
   - Or uses intent's response template
   - Or escalates to Konsultabot AI
5. Response is logged for analytics

## Permissions

- **Admin**: Full access to all features
- **IT Staff**: Can view dashboard, edit KB, view analytics, manage tickets
- **Student**: No admin panel access

## Development

### Backend Structure
```
backend/django_konsultabot/
├── admin_panel/
│   ├── models.py          # Database models
│   ├── serializers.py     # API serializers
│   ├── views.py           # API viewsets
│   ├── urls.py            # URL routing
│   └── admin.py           # Django admin integration
```

### Frontend Structure
```
admin-panel-frontend/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   ├── services/          # API service layer
│   └── App.jsx            # Main app component
```

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure Django settings include:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Development only
CORS_ALLOW_CREDENTIALS = True
```

### Authentication Issues
- Verify JWT token is being sent in Authorization header
- Check token expiration (default: 60 minutes)
- Ensure user has admin or it_staff role

### Database Issues
- Run migrations: `python manage.py migrate`
- Check database connection in settings.py
- Verify AUTH_USER_MODEL is set correctly

## Production Deployment

1. Set `DEBUG = False` in settings.py
2. Configure proper CORS origins
3. Use environment variables for sensitive data
4. Set up proper database (PostgreSQL recommended)
5. Configure static file serving
6. Set up SSL/HTTPS
7. Configure backup strategy

## Support

For issues or questions, please contact the development team.

---

**Note:** Konsultabot (formerly Gemini) is the AI system powering the chatbot responses. All references to "Konsultabot" in user-facing content refer to the AI assistant.

