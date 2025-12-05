# 🗄️ KonsultaBot Database Migration Guide

Move your SQLite database to an online PostgreSQL database for better scalability and reliability.

## 🎯 Recommended Options

### Option 1: Supabase (Recommended - Free Tier)
- **Free**: 500MB database, unlimited API requests
- **Easy Setup**: Web interface, instant PostgreSQL
- **URL**: https://supabase.com

### Option 2: Railway
- **Free**: $5 credit/month, PostgreSQL included
- **Easy Setup**: One-click deploy
- **URL**: https://railway.app

### Option 3: Render
- **Free**: PostgreSQL with limitations
- **URL**: https://render.com

### Option 4: ElephantSQL
- **Free**: 20MB database
- **URL**: https://www.elephantsql.com

---

## 📋 Step-by-Step Migration (Supabase Example)

### Step 1: Create Supabase Database

1. Go to https://supabase.com
2. Sign up / Login
3. Click "New Project"
4. Fill in:
   - **Name**: konsultabot-db
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
5. Wait for database to be created (~2 minutes)
6. Go to **Settings** → **Database**
7. Copy the **Connection String** (URI format)

### Step 2: Update Django Settings

The settings file has been updated to support PostgreSQL. Add these to your `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
# Or use individual settings:
DB_ENGINE=django.db.backends.postgresql
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
```

### Step 3: Install PostgreSQL Driver

```bash
cd backend/django_konsultabot
pip install psycopg2-binary
```

### Step 4: Backup Current SQLite Database

```bash
# Create backup
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > backup.json
```

### Step 5: Run Migration Script

```bash
python migrate_to_postgresql.py
```

Or manually:

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations to PostgreSQL
python manage.py migrate

# Load data from backup
python manage.py loaddata backup.json
```

---

## 🔧 Alternative: Railway Setup

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Provision PostgreSQL"

### Step 2: Get Connection String

1. Click on PostgreSQL service
2. Go to **Variables** tab
3. Copy `DATABASE_URL`

### Step 3: Update .env

```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

---

## 📝 Migration Scripts

See `migrate_to_postgresql.py` for automated migration.

---

## ✅ Verification

After migration, verify:

```bash
python manage.py dbshell
# In PostgreSQL shell:
\dt  # List tables
SELECT COUNT(*) FROM user_account_user;  # Check user count
```

---

## 🆘 Troubleshooting

### "psycopg2 not found"
```bash
pip install psycopg2-binary
```

### "Connection refused"
- Check firewall settings
- Verify connection string
- Ensure database allows external connections

### "Migration errors"
- Run: `python manage.py migrate --run-syncdb`
- Check database permissions

---

## 🔄 Rollback to SQLite

If needed, you can rollback:

1. Update `.env`: Remove `DATABASE_URL`
2. Update `settings.py`: Use SQLite config
3. Restore backup: `python manage.py loaddata backup.json`

