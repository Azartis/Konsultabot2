# 🤖 KonsultaBot - Advanced AI Platform

KonsultaBot is a comprehensive AI-powered consultation platform with mobile app (React Native/Expo) and Django backend.

## 📁 Project Structure

```
KonsultaBot2-main/
├── KonsultabotMobileNew/    # Mobile app (React Native/Expo)
├── backend/                  # Django backend
│   └── django_konsultabot/  # Main Django project
├── admin-panel-frontend/     # Admin panel (React)
└── scripts/                  # Build and utility scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **JDK 17** (for Android builds)
- **Android Studio** (for mobile development)
- **PostgreSQL** (optional, SQLite for development)

### 1. Backend Setup

```bash
cd backend/django_konsultabot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### 2. Mobile App Setup

```bash
cd KonsultabotMobileNew

# Install dependencies
npm install

# Create .env file
# EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
# EXPO_PUBLIC_NGROK_URL=your-ngrok-url (optional)

# Start development server
npm start
```

### 3. First Native Build (Required for Voice Recognition)

```bash
cd KonsultabotMobileNew
npm run native:build
```

This will:
- Generate Android/iOS native code
- Build and install the app on your device/emulator
- Enable native modules like voice recognition

**Note**: This takes 5-15 minutes on first build. After this, use `npm start` for faster development.

## 📱 Development Workflow

### Daily Development (Fast)

```bash
# Mobile app
cd KonsultabotMobileNew
npm start  # Uses dev-client, no native rebuild

# Backend
cd backend/django_konsultabot
python manage.py runserver
```

### When Native Code Changes

```bash
cd KonsultabotMobileNew
npm run native:build  # Rebuilds native code
```

### Automated Full App Start

```bash
# Starts both backend and frontend
cd KonsultabotMobileNew
npm run start:full
```

## 🔧 Environment Variables

### Backend (.env)

```bash
# Required
DJANGO_SECRET_KEY=your-secret-key-here
APP_ENV=development

# Database (use SQLite for development)
DATABASE_URL=sqlite:///konsultabot_advanced.db

# AI
GEMINI_API_KEY=your-gemini-api-key

# Optional
DEBUG=True
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Mobile (.env in KonsultabotMobileNew/)

```bash
# Backend URL (use EXPO_PUBLIC_* prefix)
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EXPO_PUBLIC_NGROK_URL=https://your-ngrok-url.ngrok-free.dev
```

## 🏗️ Build Scripts

### Mobile App

- `npm start` - Fast development (dev-client)
- `npm run native:build` - Full native rebuild
- `npm run start:full` - Start backend + frontend

### Backend

- `python manage.py runserver` - Development server
- `python manage.py migrate` - Run migrations
- `python manage.py collectstatic` - Collect static files (production)

## 🔒 Security Features

- ✅ Password hashing (Django's PBKDF2)
- ✅ JWT authentication
- ✅ Rate limiting (login: 5/min, register: 3/hour)
- ✅ Input validation and sanitization
- ✅ CORS protection (configurable)
- ✅ SQL injection protection (parameterized queries)
- ✅ Structured error handling

## 📚 Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Mobile App README](./KonsultabotMobileNew/README.md)
- [Backend Documentation](./backend/django_konsultabot/README.md)

## 🛠️ Troubleshooting

### Database Connection Error

If you see "could not translate host name", the backend will automatically fall back to SQLite. To use PostgreSQL:

1. Set `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Run migrations: `python manage.py migrate`

### Voice Recognition Not Working

Voice recognition requires a **development build**, not Expo Go:

```bash
cd KonsultabotMobileNew
npm run native:build
```

### Build Performance

For faster builds on Windows:
1. Add Gradle/Android SDK to Windows Defender exclusions
2. See [Windows Defender Optimization](./KonsultabotMobileNew/docs/WINDOWS_DEFENDER_OPTIMIZATION.md)

### Native Module Errors

If you see "Native module is null":
1. Run `npm run native:build` to rebuild native code
2. Ensure you're using a development build, not Expo Go

## 🧹 Cleanup

Remove unnecessary files:

```bash
powershell -ExecutionPolicy Bypass -File ./scripts/cleanup-unnecessary-files.ps1
```

## 📦 Production Deployment

See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) for:
- Mobile APK/AAB builds
- Backend server setup
- SSL/HTTPS configuration
- Docker deployment
- CI/CD pipelines

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions:
- Check [Troubleshooting](#-troubleshooting) section
- Review documentation in respective folders
- Open an issue on GitHub

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-XX

