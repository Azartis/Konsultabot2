# 🔧 Fix DATABASE_URL ParseError

## Error Message
```
dj_database_url.ParseError: This string is not a valid url, possibly because some of its parts is not properly urllib.parse.quote()'ed.
```

## Quick Fix

### Option 1: Run the Fix Script (Recommended)
```powershell
.\fix_database_url.ps1
```

This will:
- Check your DATABASE_URL format
- Detect special characters in password
- Auto-encode password if needed
- Update .env file

### Option 2: Manual Fix

1. **Open `.env` file**
2. **Find the DATABASE_URL line**
3. **Check the format:**

   ✅ **Correct format:**
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

   ❌ **Common issues:**
   - Password with special characters not URL-encoded
   - Missing `postgresql://` prefix
   - Spaces in the URL

4. **URL-encode special characters in password:**
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`
   - `+` → `%2B`
   - `=` → `%3D`
   - `?` → `%3F`
   - Space → `%20` or `+`

### Example

**Before (incorrect):**
```
DATABASE_URL=postgresql://user:my@pass#123@host:5432/db
```

**After (correct):**
```
DATABASE_URL=postgresql://user:my%40pass%23123@host:5432/db
```

## Verify Fix

After fixing, test the connection:

```bash
python test_database_connection.py
```

Or run migration again:

```bash
python migrate_to_postgresql.py
```

## Still Having Issues?

1. **Get a fresh connection string from your database provider:**
   - Supabase: Settings → Database → Connection String
   - Railway: Variables tab → DATABASE_URL
   - Render: Database → Internal Database URL

2. **Run setup wizard again:**
   ```powershell
   .\setup_online_database.ps1
   ```

3. **Use individual DB variables instead:**
   ```env
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=your_db_name
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=your_host
   DB_PORT=5432
   ```

