# KonsultaBot Node.js Backend Server

Production-ready Node.js/Express.js backend server for the KonsultaBot mobile application.

## Features

- ✅ Express.js REST API
- ✅ CORS configuration for mobile apps
- ✅ Rate limiting
- ✅ Error handling
- ✅ Django backend integration
- ✅ Voice processing endpoints
- ✅ Authentication endpoints
- ✅ Chat endpoints

## Installation

```bash
cd node_server
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and set your Django backend URL:
```
DJANGO_BACKEND_URL=http://localhost:8000
```

## Running

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### Voice Processing
- `POST /api/voice/transcribe` - Transcribe audio to text
- `POST /api/voice/process` - Process voice command
- `GET /api/voice/status` - Voice service status

### Chat
- `POST /api/chat/send` - Send chat message
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/clear` - Clear chat history
- `GET /api/chat/sessions` - Get chat sessions

## Architecture

```
node_server/
├── server.js              # Main server file
├── routes/                # Route definitions
│   ├── auth.js
│   ├── voice.js
│   └── chat.js
├── controllers/           # Business logic
│   ├── authController.js
│   ├── voiceController.js
│   └── chatController.js
├── config/                # Configuration files
│   └── cors.js
└── utils/                 # Utility functions
```

## Integration with Django

This Node.js server acts as a proxy/middleware layer that:
1. Receives requests from mobile app
2. Forwards requests to Django backend
3. Handles errors and provides better error messages
4. Can add additional features (rate limiting, caching, etc.)

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use PM2 or similar process manager:
```bash
pm2 start server.js --name konsultabot-node
```
3. Configure reverse proxy (nginx) if needed
4. Set up SSL/TLS certificates

## Notes

- Server binds to `0.0.0.0` to accept connections from all interfaces
- CORS is configured for mobile apps and ngrok URLs
- Rate limiting: 100 requests per 15 minutes per IP
- All endpoints forward to Django backend for actual processing

