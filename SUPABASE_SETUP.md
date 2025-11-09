# Supabase PostgreSQL Setup Guide

This guide walks you through setting up your Radiology AI Suite application with Supabase PostgreSQL - a modern, managed PostgreSQL database with automatic backups, connection pooling, and a generous free tier.

## Table of Contents

- [Why Supabase?](#why-supabase)
- [Prerequisites](#prerequisites)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [Detailed Setup](#detailed-setup)
- [Production Deployment](#production-deployment)
- [Migration from SQLite](#migration-from-sqlite)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

---

## Why Supabase?

**Advantages:**
- ✅ **Free Tier**: 500MB database, unlimited API requests, automatic backups
- ✅ **Automatic Backups**: 7-day retention on free tier, longer on paid plans
- ✅ **Connection Pooling**: Built-in PgBouncer for efficient connection management
- ✅ **Easy Setup**: No infrastructure to manage
- ✅ **Dashboard**: Web-based database management interface
- ✅ **Real-time**: Optional real-time subscriptions for future features
- ✅ **Global CDN**: Fast access from anywhere
- ✅ **Production-Ready**: Used by thousands of production applications

**Free Tier Limits:**
- 500 MB database space
- Unlimited API requests
- 50,000 monthly active users
- 2 GB file storage
- 5 GB bandwidth
- Automatic backups (7 days)

**Cost for Upgrades:**
- Pro: $25/month (8GB database, 100GB bandwidth, 250GB file storage)
- Team: $599/month (for teams requiring more resources)

---

## Prerequisites

1. **Supabase Account** (free): https://supabase.com/dashboard
2. **Python 3.9+** installed
3. **Project dependencies** installed: `pip install -r requirements.txt`

---

## Quick Start (5 minutes)

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `radiology-ai-suite` (or any name you prefer)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `US East`, `EU West`)
   - **Plan**: Select "Free" tier
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### Step 2: Get Database Connection String

1. In your Supabase dashboard, go to **Settings** > **Database**
2. Scroll to **"Connection String"** section
3. Select **"URI"** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the database password you created in Step 1

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.supabase.example .env
   ```

2. Edit `.env` and set your Supabase connection string:
   ```bash
   # Replace with your actual connection string
   SUPABASE_DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

   # Disable SQLite
   USE_SQLITE=false

   # Add your Gemini API key
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. Generate a secure SECRET_KEY:
   ```bash
   openssl rand -hex 32
   ```
   Add this to `.env` as `SECRET_KEY`

### Step 4: Initialize Database

Run the initialization script:

```bash
cd backend
python init_supabase_db.py
```

You should see output like:
```
============================================================
Initializing Supabase Database
============================================================
Connection: aws-0-us-east-1.pooler.supabase.com:5432/postgres
Testing Supabase connection...
✓ Successfully connected to PostgreSQL: PostgreSQL 15.1
Creating database tables...
✓ Tables created successfully
...
✓ Admin user created successfully
✓ Supabase Database initialization complete!
```

### Step 5: Start Your Application

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Default Login Credentials:**
- **Admin**: `admin@radiology.com` / `admin123`
- **Doctor**: `doctor@hospital.com` / `doctor123`

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

---

## Detailed Setup

### Database Connection Options

Supabase provides two connection methods:

#### 1. Direct Connection (Port 5432) - For Development

**When to use:**
- Local development
- Low traffic applications
- Direct SQL access needed

**Configuration:**
```bash
SUPABASE_DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_POOLER_ENABLED=false
```

**Pros:**
- Full PostgreSQL features
- Lower latency for single connections
- Supports prepared statements

**Cons:**
- Limited concurrent connections (~60 on free tier)
- Connection overhead for serverless deployments

#### 2. Connection Pooler (Port 6543) - For Production

**When to use:**
- Production deployments
- Serverless environments (Railway, Render, Vercel)
- High concurrent connection count
- Scaling requirements

**Configuration:**
```bash
SUPABASE_POOLER_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
SUPABASE_POOLER_ENABLED=true
```

**Pros:**
- Handles 10,000+ concurrent connections
- Efficient connection reuse
- Optimized for serverless

**Cons:**
- Transaction mode (limited to single transactions)
- Some PostgreSQL features unavailable

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SUPABASE_DATABASE_URL` | Yes | Direct connection string | `postgresql://postgres...` |
| `SUPABASE_POOLER_URL` | No | Pooled connection string | `postgresql://postgres...` |
| `SUPABASE_POOLER_ENABLED` | No | Enable connection pooling | `true` or `false` |
| `USE_SQLITE` | Yes | Disable SQLite | `false` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIza...` |
| `SECRET_KEY` | Yes | JWT secret key | Generated with openssl |

### Database Tables Created

The `init_supabase_db.py` script creates the following tables:

1. **users** - User accounts and authentication
2. **templates** - Report templates with ownership
3. **reports** - Generated radiology reports
4. **critical_findings** - Critical findings tracking
5. **notifications** - Critical finding notifications
6. **dicom_files** - DICOM file metadata

### Verifying Setup

1. **Check Supabase Dashboard**:
   - Go to **Database** > **Tables**
   - You should see all 6 tables listed

2. **Check Data**:
   - Click on **Table Editor**
   - Select `users` table
   - Verify admin and doctor users exist

3. **Run Database Query**:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM templates;
   ```

---

## Production Deployment

### Deployment Platforms

#### Option 1: Railway.app (Recommended)

**Cost**: ~$10-20/month

**Setup:**

1. Create account at https://railway.app
2. Connect your GitHub repository
3. Add Supabase integration or manually add environment variables
4. Set environment variables:
   ```bash
   SUPABASE_DATABASE_URL=postgresql://...
   SUPABASE_POOLER_ENABLED=true
   SUPABASE_POOLER_URL=postgresql://...
   GEMINI_API_KEY=your_key
   SECRET_KEY=your_secret
   ```
5. Deploy

#### Option 2: Render.com

**Cost**: ~$7-14/month

**Setup:**

1. Create account at https://render.com
2. Create new "Web Service"
3. Connect GitHub repository
4. Set environment variables (same as Railway)
5. Deploy

#### Option 3: Docker + VPS (AWS, DigitalOcean, Linode)

**Cost**: ~$5-10/month for VPS

**Setup:**

1. Build Docker image:
   ```bash
   docker build -t radiology-ai-suite .
   ```

2. Run with environment variables:
   ```bash
   docker run -d \
     -p 8000:8000 \
     -e SUPABASE_DATABASE_URL="postgresql://..." \
     -e GEMINI_API_KEY="your_key" \
     -e SECRET_KEY="your_secret" \
     radiology-ai-suite
   ```

### Production Checklist

- [ ] Enable HTTPS/SSL
- [ ] Change default admin password
- [ ] Set strong SECRET_KEY (openssl rand -hex 32)
- [ ] Enable connection pooling (SUPABASE_POOLER_ENABLED=true)
- [ ] Configure CORS origins for your frontend domain
- [ ] Set up monitoring (Supabase Dashboard > Logs)
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Configure automatic backups retention
- [ ] Set up error logging (Sentry recommended)
- [ ] Configure email notifications (SMTP settings)
- [ ] Test disaster recovery procedures
- [ ] Document your deployment process

### Row Level Security (RLS)

For HIPAA compliance and data security, enable RLS in Supabase:

1. Go to **Database** > **Policies** in Supabase Dashboard
2. For each table, click **"Enable RLS"**
3. Create policies based on your security requirements

**Example policy for `reports` table:**
```sql
-- Users can only see their own reports
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own reports
CREATE POLICY "Users can insert own reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Migration from SQLite

If you have existing data in SQLite, use the migration script:

### Step 1: Create Migration Script

Run the migration script (created in this implementation):

```bash
cd backend
python migrate_sqlite_to_supabase.py
```

### Step 2: Verify Migration

1. Check Supabase Dashboard > Database > Table Editor
2. Verify all tables have data
3. Test application login with existing users
4. Check that reports are accessible

### Step 3: Backup SQLite (Optional)

Keep your SQLite database as backup:
```bash
cp radiology_db.sqlite radiology_db.sqlite.backup
```

---

## Troubleshooting

### Connection Issues

**Problem**: "Could not connect to database"

**Solutions**:
1. Verify your connection string is correct
2. Check that `[YOUR-PASSWORD]` was replaced with actual password
3. Ensure your IP is not blocked (Supabase allows all IPs by default)
4. Try direct connection (port 5432) instead of pooler
5. Check Supabase project status in dashboard

### SSL/TLS Errors

**Problem**: "SSL connection has been closed unexpectedly"

**Solution**: Add SSL mode to connection string:
```bash
SUPABASE_DATABASE_URL=postgresql://...?sslmode=require
```

### Connection Pool Exhausted

**Problem**: "Timeout acquiring connection from pool"

**Solutions**:
1. Enable connection pooling:
   ```bash
   SUPABASE_POOLER_ENABLED=true
   SUPABASE_POOLER_URL=postgresql://...6543/postgres
   ```
2. Reduce pool size if on free tier
3. Check for connection leaks in code

### Migration Failures

**Problem**: Migration script fails with "relation already exists"

**Solution**: Drop existing tables and re-run:
```sql
-- In Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Then re-run `python init_supabase_db.py`

### Slow Query Performance

**Problem**: Queries are slow

**Solutions**:
1. Add indexes to frequently queried columns
2. Use EXPLAIN ANALYZE in Supabase SQL Editor
3. Check query logs in Supabase Dashboard > Logs
4. Consider upgrading to Pro tier for better performance

---

## Performance Optimization

### Indexes

Add indexes for common queries:

```sql
-- Indexes for faster lookups
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_templates_user_id ON templates(created_by_user_id);
CREATE INDEX idx_templates_active ON templates(is_active);
```

### Connection Pooling Best Practices

1. **Use pooler for production**: Set `SUPABASE_POOLER_ENABLED=true`
2. **Monitor connections**: Check Supabase Dashboard > Database > Connections
3. **Tune pool size**: Adjust based on your concurrent user count
4. **Enable pool_pre_ping**: Already configured in `database.py`

### Query Optimization

1. **Use indexes**: Create indexes on frequently filtered columns
2. **Limit result sets**: Use pagination for large datasets
3. **Avoid N+1 queries**: Use SQLAlchemy `joinedload()` for relationships
4. **Cache results**: Enable Redis caching for static data

### Monitoring

1. **Supabase Dashboard**:
   - Database > Logs: Monitor query performance
   - Database > Connections: Track active connections
   - Database > Reports: View database statistics

2. **Application Logs**:
   - Enable SQLAlchemy echo for debugging: `echo=True` in `create_engine()`
   - Monitor slow queries in application logs

3. **Alerts**:
   - Set up email alerts for connection pool exhaustion
   - Monitor database size (500MB limit on free tier)

---

## Backup and Disaster Recovery

### Automatic Backups (Supabase)

Supabase automatically backs up your database:
- **Free tier**: 7 days retention
- **Pro tier**: 30 days retention
- **Backup schedule**: Daily at 00:00 UTC

**Restore from backup**:
1. Go to Supabase Dashboard > Database > Backups
2. Select backup date
3. Click "Restore"

### Manual Backups

**Using pg_dump**:
```bash
# Set connection string
export SUPABASE_URL="postgresql://..."

# Create backup
pg_dump $SUPABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $SUPABASE_URL < backup_20240101.sql
```

**Application-level backup**:
```bash
# Use built-in backup service
python backend/run_backup.py
```

---

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use strong passwords**: Min 16 characters, mixed case, numbers, symbols
3. **Rotate credentials**: Change database password quarterly
4. **Enable RLS**: Row Level Security for table-level access control
5. **Use HTTPS**: Always encrypt traffic in production
6. **Monitor access**: Check Supabase logs regularly
7. **Limit permissions**: Grant minimal necessary privileges
8. **Regular updates**: Keep dependencies updated
9. **Audit logs**: Enable and review Supabase audit logs
10. **HIPAA compliance**: Follow HIPAA guidelines for medical data

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **Railway Docs**: https://docs.railway.app/
- **Render Docs**: https://render.com/docs

---

## Support

**Issues with Supabase**:
- Supabase Community: https://github.com/supabase/supabase/discussions
- Supabase Discord: https://discord.supabase.com/

**Issues with this application**:
- Create an issue in the GitHub repository
- Check existing documentation in `PRODUCTION_SETUP.md`

---

## Summary

You've successfully configured Supabase PostgreSQL for your Radiology AI Suite!

**What you've accomplished:**
- ✅ Created a production-ready PostgreSQL database
- ✅ Configured automatic backups
- ✅ Set up connection pooling
- ✅ Initialized database schema and seed data
- ✅ Learned production deployment options

**Next steps:**
1. Deploy your application to a hosting platform
2. Configure email notifications for critical findings
3. Set up monitoring and alerting
4. Enable Row Level Security (RLS)
5. Test disaster recovery procedures

🎉 **Congratulations! Your application is now production-ready with Supabase!**
