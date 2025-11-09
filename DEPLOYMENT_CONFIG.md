# Deployment Configuration Guide

## Database Setup for Deployment

### For Replit Autoscale Deployments

Your application is now configured to work with both development and production databases:

**Development Environment:**
- Automatically uses SQLite database (`radiology_db.sqlite`)
- No additional configuration needed
- Perfect for testing and development

**Production/Deployment Environment:**
1. **Attach PostgreSQL Database to Deployment:**
   - Go to your Replit Deployments pane
   - Navigate to the Configuration tab
   - Scroll to "Attached Storage" section
   - Click "Add PostgreSQL database"
   - Replit will automatically create a PostgreSQL database and set the `DATABASE_URL` secret

2. **Verify Deployment Secrets:**
   - Your workspace secrets (like `GEMINI_API_KEY`) automatically sync to deployments
   - The PostgreSQL `DATABASE_URL` will be automatically added when you attach the database
   - No manual secret configuration needed!

### How It Works

The application automatically detects the environment:
- **Development:** Uses the local SQLite database
- **Deployment:** Uses the attached PostgreSQL database from `DATABASE_URL`

### Error Handling

The application now includes:
- **Retry Logic:** Attempts to connect up to 3 times with exponential backoff
- **Graceful Fallback:** Falls back to SQLite if PostgreSQL connection fails
- **Better Logging:** Clear messages about which database is being used
- **No Crash Loops:** The app won't crash even if database connection fails temporarily

### Initial Database Setup for Deployment

After deploying with a PostgreSQL database, you need to initialize it with default users:

1. Access your deployment console
2. Run: `cd backend && python init_db.py`
3. This creates the admin and doctor accounts

**Default Login Credentials:**
- Admin: `admin@radiology.com` / `admin123`
- Doctor: `doctor@hospital.com` / `doctor123`

⚠️ **Important:** Change these passwords after first login in production!

### Required Environment Variables

**Development (automatic):**
- `GEMINI_API_KEY` - Your Google Gemini API key

**Deployment (automatic when database attached):**
- `GEMINI_API_KEY` - Synced from workspace secrets
- `DATABASE_URL` - Auto-set by Replit when PostgreSQL is attached
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT` - Auto-set by Replit

### Troubleshooting

**"Database connection error" in deployment:**
1. Ensure you've attached a PostgreSQL database in the Deployments configuration
2. Check that the DATABASE_URL secret is set in your deployment
3. Review deployment logs for specific error messages

**"Application crash looping":**
- The latest updates include retry logic to prevent this
- The app will attempt to connect 3 times before giving up
- Check if the PostgreSQL database is running and accessible

**"Development DATABASE_URL detected in deployment":**
- This is a safety feature - the app won't connect to dev database from deployment
- Attach a proper PostgreSQL database to your deployment

### Support

For more information about Replit databases and deployments, visit:
- https://docs.replit.com/hosting/databases/postgresql
