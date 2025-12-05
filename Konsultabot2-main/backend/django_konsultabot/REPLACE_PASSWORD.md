# 🔑 Replace [YOUR_PASSWORD] in DATABASE_URL

## Current Issue

Your `.env` file has:
```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xfvjpiudllclwjzpvomz.supabase.co:5432/postgres
```

You need to replace `[YOUR_PASSWORD]` with your actual Supabase database password.

---

## How to Get Your Supabase Password

### Method 1: From Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Click **URI** tab
6. You'll see a connection string like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
7. Copy the **entire connection string** (it already has the password)

### Method 2: Reset Password

If you forgot your password:

1. Go to **Settings** → **Database**
2. Click **Reset database password**
3. Copy the new password
4. Update your connection string

---

## Update Your .env File

### Option 1: Use Setup Wizard (Recommended)

```powershell
.\setup_online_database.ps1
```

When prompted, paste the **complete connection string** from Supabase.

### Option 2: Manual Edit

1. Open `backend/django_konsultabot/.env`
2. Find the line: `DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@...`
3. Replace `[YOUR_PASSWORD]` with your actual password
4. **Important**: If password has special characters, URL-encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - Space → `%20`

**Example:**
```
# Before:
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xxx.supabase.co:5432/postgres

# After (if password is "my@pass#123"):
DATABASE_URL=postgresql://postgres:my%40pass%23123@db.xxx.supabase.co:5432/postgres
```

---

## Verify

After updating, test the connection:

```bash
python test_database_connection.py
```

You should see:
```
✅ Using PostgreSQL
✅ Connection successful!
```

---

## Then Run Migration

Once the connection works:

```bash
python migrate_to_postgresql.py
```

