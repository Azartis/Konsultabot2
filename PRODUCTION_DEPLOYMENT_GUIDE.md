# 🚀 KonsultaBot Production Deployment Guide

This guide covers deploying KonsultaBot to production for both mobile (Android/iOS) and backend (Django).

---

## 📱 Mobile App Deployment

### Prerequisites

1. **EAS Account**: Sign up at [expo.dev](https://expo.dev)
2. **Android Keystore**: Generate signing key for production
3. **Environment Variables**: Configure `EXPO_PUBLIC_*` variables

### Step 1: Configure Environment Variables

Create `.env` in `KonsultabotMobileNew/`:

```bash
EXPO_PUBLIC_BACKEND_URL=https://your-backend-domain.com
EXPO_PUBLIC_NGROK_URL=https://your-ngrok-url.ngrok-free.dev
```

### Step 2: Generate Android Keystore

```bash
cd KonsultabotMobileNew
keytool -genkeypair -v -storetype PKCS12 -keystore konsultabot-release.keystore -alias konsultabot-key -keyalg RSA -keysize 2048 -validity 10000
```

**⚠️ IMPORTANT**: Store the keystore file securely and backup the password!

### Step 3: Configure EAS Build

Update `app.config.js` or create `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:bundleRelease"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 4: Build Production APK/AAB

**For APK (testing):**
```bash
cd KonsultabotMobileNew
eas build --platform android --profile preview
```

**For AAB (Google Play Store):**
```bash
eas build --platform android --profile production
```

### Step 5: Local Build (Alternative)

If you prefer local builds:

```bash
cd KonsultabotMobileNew
npx expo prebuild
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease     # For AAB
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`
AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🖥️ Backend Deployment

### Prerequisites

1. **Python 3.11+**
2. **PostgreSQL** (recommended) or SQLite (development)
3. **Gunicorn** (WSGI server)
4. **Nginx** (reverse proxy)
5. **SSL Certificate** (Let's Encrypt)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3.11 python3.11-venv python3-pip postgresql nginx

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
```

### Step 2: Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE konsultabot;
CREATE USER konsultabot_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE konsultabot TO konsultabot_user;
\q
```

### Step 3: Deploy Backend Code

```bash
# Clone repository
git clone <your-repo-url>
cd Konsultabot2-main/backend/django_konsultabot

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy .env file
cp .env.example .env
# Edit .env with production values
nano .env
```

### Step 4: Configure Environment Variables

Edit `.env`:

```bash
# Django
DJANGO_SECRET_KEY=your-production-secret-key-min-50-chars
DEBUG=False
APP_ENV=production

# Database
DATABASE_URL=postgresql://konsultabot_user:password@localhost:5432/konsultabot

# Security
CORS_ALLOWED_ORIGINS=https://your-mobile-app-domain.com,https://your-admin-panel.com

# AI
GEMINI_API_KEY=your-gemini-api-key
```

### Step 5: Run Migrations

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### Step 6: Configure Gunicorn

Create `/etc/systemd/system/konsultabot.service`:

```ini
[Unit]
Description=KonsultaBot Gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend/django_konsultabot
ExecStart=/path/to/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/gunicorn.sock \
    --access-logfile - \
    --error-logfile - \
    django_konsultabot.wsgi:application

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl start konsultabot
sudo systemctl enable konsultabot
```

### Step 7: Configure Nginx

Create `/etc/nginx/sites-available/konsultabot`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /path/to/backend/django_konsultabot/staticfiles/;
    }

    location /media/ {
        alias /path/to/backend/django_konsultabot/media/;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/konsultabot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security Checklist

### Backend

- [ ] `DEBUG=False` in production
- [ ] `SECRET_KEY` is strong and unique
- [ ] `CORS_ALLOWED_ORIGINS` is restricted
- [ ] Database password is strong
- [ ] SSL/HTTPS is enabled
- [ ] Firewall configured (only 80, 443 open)
- [ ] Regular security updates
- [ ] Backups configured

### Mobile

- [ ] Keystore password is secure
- [ ] ProGuard/R8 enabled for code obfuscation
- [ ] API keys are in environment variables
- [ ] No hardcoded secrets
- [ ] App signing key is backed up

---

## 📊 Monitoring & Logging

### Backend Logging

Configure in `settings.py`:

```python
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/konsultabot/app.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
        },
    },
    'loggers': {
        'konsultabot': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### Health Checks

Monitor these endpoints:
- `GET /api/health/` - API health
- `GET /health/` - General health

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/backend
            git pull
            source venv/bin/activate
            pip install -r requirements.txt
            python manage.py migrate
            python manage.py collectstatic --noinput
            sudo systemctl restart konsultabot
```

---

## 🐳 Docker Deployment (Optional)

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "django_konsultabot.wsgi:application"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/konsultabot
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=konsultabot
      - POSTGRES_USER=konsultabot_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 📝 Post-Deployment

1. **Test all endpoints** from mobile app
2. **Monitor logs** for errors
3. **Set up backups** (database, media files)
4. **Configure monitoring** (UptimeRobot, Sentry, etc.)
5. **Document API endpoints** for team

---

## 🆘 Troubleshooting

### Backend Issues

- **Database connection errors**: Check `DATABASE_URL` and PostgreSQL service
- **Static files not loading**: Run `python manage.py collectstatic`
- **CORS errors**: Verify `CORS_ALLOWED_ORIGINS` includes mobile app domain
- **500 errors**: Check logs in `/var/log/konsultabot/`

### Mobile Issues

- **Build fails**: Check `JAVA_HOME` is set to JDK 17
- **APK too large**: Enable ProGuard, remove unused dependencies
- **Voice not working**: Ensure native build was run (`npm run native:build`)

---

## 📚 Additional Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0

