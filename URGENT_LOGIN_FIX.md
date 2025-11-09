# 🔧 URGENT: Login Fix Instructions

## What Happened?

You're seeing `{"detail":"Incorrect email or password"}` because:
1. The password hashing method was changed in a previous commit
2. Existing passwords in the database need to be updated
3. The backend wasn't configured to automatically fix this on startup

**The application is also not running** - that's why you lost the landing pages.

## ✅ Quick Fix (Choose One Option)

### Option 1: Use the Fix Script (FASTEST)

Run this command in the Shell:
```bash
./fix_login_now.sh
```

Then click the **RUN** button in Replit to start the application.

### Option 2: Manual Fix

Run these commands in the Shell:
```bash
cd backend
pip install -r requirements.txt
python init_db.py
```

Then click the **RUN** button in Replit to start the application.

### Option 3: Just Restart (if .replit fix is already committed)

Simply click the **RUN** button in Replit. The updated .replit configuration will automatically:
1. Run `init_db.py` to fix passwords
2. Start the backend
3. Start the frontend

## What Was Fixed?

1. **✅ backend/init_db.py** - Now automatically rehashes passwords for existing users
2. **✅ .replit** - Now runs init_db.py before starting the backend
3. **✅ fix_login_now.sh** - Quick script to fix passwords immediately
4. **✅ backend/fix_passwords.py** - Standalone password fix script

## After Running the Fix

You'll be able to login with:
- **Admin**: `admin@radiology.com` / `admin123`
- **Doctor**: `doctor@hospital.com` / `doctor123`

## Why Did This Happen?

The password hashing method was changed from passlib's bcrypt to native bcrypt in commit `3cfc1a5`, but:
- Existing passwords in the database were still using the old format
- The Replit startup script didn't run `init_db.py` automatically
- This has now been fixed permanently

## Troubleshooting

### "Module not found" errors
```bash
cd backend
pip install -r requirements.txt
```

### "Database connection failed"
Make sure your Replit Secrets have:
- `DATABASE_URL` configured
- Or PostgreSQL environment variables set
- Check Replit Secrets tab

### Still can't login after fix
1. Check the Shell output when running fix script
2. Look for error messages
3. Verify the database is accessible
4. Check backend logs when starting the app

## Environment Variables Needed

Make sure these are set in **Replit Secrets**:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `SECRET_KEY` - For JWT tokens (any long random string)
- `DATABASE_URL` - PostgreSQL connection string

If using Docker-compose (local), these are auto-configured.

## Next Steps

1. ✅ Run the fix (option 1, 2, or 3 above)
2. ✅ Click RUN button in Replit
3. ✅ Wait for backend and frontend to start
4. ✅ Open the webview to see your landing page
5. ✅ Try logging in with the credentials above

## Need Help?

Check the logs:
- Backend logs show in the Console tab
- Frontend logs show in the Webview tab
- Look for any error messages about database or missing environment variables
