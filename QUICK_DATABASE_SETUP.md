# 🚀 Quick Database Migration Guide

## Step 1: Choose Your Database Provider

### Option A: Supabase (Recommended - Free)
1. Go to https://supabase.com
2. Sign up and create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI format)

### Option B: Railway
1. Go to https://railway.app
2. Create project → Add PostgreSQL
3. Copy `DATABASE_URL` from Variables tab

## Step 2: Run Setup Wizard

```powershell
cd backend\django_konsultabot
.\setup_online_database.ps1
```

Follow the prompts to enter your database URL.

## Step 3: Install Dependencies

```bash
pip install psycopg2-binary dj-database-url
```

## Step 4: Migrate Data

```bash
python migrate_to_postgresql.py
```

This will:
- ✅ Backup your SQLite database
- ✅ Test PostgreSQL connection
- ✅ Run migrations
- ✅ Transfer all data

## Step 5: Verify

```bash
python test_database_connection.py
```

## Done! 🎉

Your database is now online and accessible from anywhere.

---

## Manual Setup (Alternative)

If you prefer manual setup, add to `.env`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

Then run:
```bash
python migrate_to_postgresql.py
```

