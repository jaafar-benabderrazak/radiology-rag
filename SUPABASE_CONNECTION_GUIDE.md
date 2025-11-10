# Supabase Connection Guide for Replit

## Current Issue

Your application is trying to connect to Supabase, but it's encountering an IPv6 connectivity error. This is a common issue when connecting from Replit to Supabase.

## Solution: Use Connection Pooling (Recommended)

Supabase provides two types of connection strings:

### 1. **Direct Connection** (Port 5432) - NOT working from Replit
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```
❌ This fails with IPv6 errors from Replit

### 2. **Connection Pooling** (Port 6543) - ✅ RECOMMENDED for Replit
```
postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```
✅ This works better from cloud environments like Replit

## How to Fix

### Step 1: Get Your Connection Pooling URL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Settings → Database**
4. Scroll down to "Connection string"
5. Switch to the **"Connection Pooling"** tab
6. Copy the URI that starts with `postgresql://postgres.`
7. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 2: Update Your Replit Secrets

You need to update **TWO** secrets in Replit:

1. **SUPABASE_DATABASE_URL** - Use the connection pooling URL from Step 1
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

2. **SUPABASE_POOLER_ENABLED** - Set this to `true`
   ```
   true
   ```

### Step 3: Restart the Backend

After updating both secrets, the backend workflow will automatically restart and connect to Supabase successfully!

## Alternative: Keep Using SQLite (Current Setup)

If you prefer to use SQLite for now (which is currently working), you can simply keep your current setup. The application already falls back to SQLite when Supabase is unavailable.

To explicitly use SQLite, add this secret:
```
USE_SQLITE=true
```

## Verification

Once connected to Supabase, you should see this in the logs:
```
Using Supabase PostgreSQL database: aws-0-[region].pooler.supabase.com:6543
Using Supabase Connection Pooler (PgBouncer in transaction mode)
```

## Troubleshooting

### Error: "Cannot assign requested address"
- **Cause**: Trying to use direct connection (port 5432) which doesn't work from Replit
- **Fix**: Use connection pooling URL (port 6543) instead

### Error: "password authentication failed"
- **Cause**: Wrong password or special characters not URL-encoded
- **Fix**: Make sure to replace `[YOUR-PASSWORD]` with your actual password
- If your password has special characters (@, :, /, etc), URL-encode them

### Error: "database does not exist"
- **Cause**: Wrong database name in connection string
- **Fix**: Make sure it ends with `/postgres` (default Supabase database)

## Important Notes

- Supabase free tier supports up to 60 concurrent connections
- Connection pooling is always recommended for production
- The pooler uses PgBouncer in transaction mode
- Your data is automatically backed up by Supabase (7 days retention on free tier)

## Need Help?

If you're still having issues:
1. Double-check your connection string format
2. Verify your database password is correct
3. Make sure you're using the pooling URL (port 6543, not 5432)
4. Check that SUPABASE_POOLER_ENABLED is set to `true`
