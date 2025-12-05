# KonsultaBot Admin Panel - React Frontend

## Overview

Modern React-based admin panel for managing the KonsultaBot platform. Built with Material-UI, React Router, and Axios.

## Features

- ✅ Dashboard with statistics and charts
- ✅ User Management
- ✅ Knowledge Base Manager
- ✅ Intent & Keyword Manager
- ✅ Ticket Management System
- ✅ Conversation Logs Viewer
- ✅ Notification Templates
- ✅ System Settings
- ✅ Activity Logs

## Installation

```bash
cd admin-panel-frontend
npm install
```

## Configuration

Create a `.env` file in the root directory:

```
REACT_APP_API_BASE_URL=http://localhost:8000
```

## Running the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   └── Layout/
│       ├── Sidebar.js
│       ├── Header.js
│       └── MainLayout.js
├── pages/
│   ├── Login.js
│   ├── Dashboard.js
│   ├── Users.js
│   ├── KnowledgeBase.js
│   ├── Intents.js
│   ├── Tickets.js
│   ├── Conversations.js
│   ├── Notifications.js
│   ├── Settings.js
│   └── Activities.js
├── services/
│   └── apiService.js
├── context/
│   └── AuthContext.js
├── config/
│   └── api.js
└── App.js
```

## Authentication

The admin panel uses JWT token authentication. Users must:
1. Have `role='admin'` or `is_staff=True` in the Django backend
2. Login with valid credentials
3. Token is stored in localStorage

## API Integration

All API calls are handled through `apiService.js` which:
- Automatically adds JWT token to requests
- Handles authentication errors
- Provides typed methods for all endpoints

## Building for Production

```bash
npm run build
```

The build folder will contain the production-ready files.

## Dependencies

- React 18
- Material-UI (MUI) 5
- React Router DOM 6
- Axios
- Recharts (for charts)

## Notes

- The frontend expects the Django backend to be running on `http://localhost:8000`
- All API endpoints are prefixed with `/api/v1/admin/`
- The app uses a dark theme matching the KonsultaBot design
