# Login Credentials

## Demo Users

The database has been initialized with the following demo users:

### Administrator Account
- **Email:** admin@radiology.com
- **Password:** admin123
- **Role:** Admin
- **Access:** Full system administration

### Doctor Account (Demo)
- **Email:** doctor@hospital.com
- **Password:** doctor123
- **Role:** Doctor
- **Access:** Create and manage radiology reports

## Important Notes

1. **Change Default Passwords:** These are demo credentials. In production, change these passwords immediately after first login.

2. **Authentication Fixed:** The authentication system now uses bcrypt directly for better compatibility and security.

3. **Database Location:** User data is stored in `backend/radiology_db.sqlite`

## Troubleshooting Login Issues

If you encounter login issues:
1. Ensure both backend and frontend workflows are running
2. Check that the database is initialized (`backend/radiology_db.sqlite` exists)
3. Try clearing browser cache and cookies
4. Verify the API is accessible (backend should be running on port 8000)

## Creating New Users

To create new users, you can either:
1. Use the "Register" link on the login page
2. Use the admin account to manage users
3. Run the initialization script: `cd backend && python init_db.py`
