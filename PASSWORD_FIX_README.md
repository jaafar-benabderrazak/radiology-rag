# Password Authentication Fix

## Issue

After updating the password hashing method from passlib's bcrypt to native bcrypt in commit `3cfc1a5`, existing users in the database couldn't log in because their passwords were still hashed using the old method.

**Symptoms:**
- Login fails with error: `{"detail":"Incorrect email or password"}`
- Affects both admin and doctor default credentials
- Occurs even when using correct credentials

## Root Cause

1. **Before commit 3cfc1a5:** Passwords were hashed using `passlib.context.CryptContext` with bcrypt
2. **After commit 3cfc1a5:** Passwords are hashed using native `bcrypt.hashpw()`
3. **Problem:** The two implementations create incompatible hash formats
4. **Result:** Existing password hashes in the database can't be verified with the new method

## Solution

### Option 1: Re-run Database Initialization (Recommended)

The `init_db.py` script has been updated to automatically rehash default user passwords when they already exist. Simply run:

```bash
# If using Docker
docker-compose exec backend python init_db.py

# Or if running locally
cd backend
python init_db.py
```

This will:
- Check for existing admin and doctor users
- Update their passwords with the new bcrypt hashing method
- Preserve all other user data

### Option 2: Run the Fix Script

Alternatively, you can run the dedicated password fix script:

```bash
# If using Docker
docker-compose exec backend python fix_passwords.py

# Or if running locally
cd backend
python fix_passwords.py
```

This script specifically focuses on fixing password hashes without modifying anything else.

### Option 3: Manual Fix (For Custom Users)

If you have custom users (not the default admin/doctor), you can reset their passwords manually:

```python
from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()

# Find the user
user = db.query(User).filter(User.email == "your.email@example.com").first()

# Update the password
user.hashed_password = get_password_hash("your_new_password")
db.commit()
db.close()
```

## Verification

After applying the fix, you should be able to log in with:

**Admin credentials:**
- Email: `admin@radiology.com`
- Password: `admin123`

**Doctor credentials:**
- Email: `doctor@hospital.com`
- Password: `doctor123`

Test by:
1. Opening the frontend: http://localhost:3000
2. Entering the credentials above
3. Successfully logging in

## Prevention

The updated `init_db.py` script now:
- ✅ Always updates default user passwords when they exist
- ✅ Ensures compatibility with the current hashing method
- ✅ Prevents this issue from recurring after future hashing updates

## Technical Details

### Old Method (passlib):
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash(password)
verified = pwd_context.verify(password, hashed)
```

### New Method (native bcrypt):
```python
import bcrypt
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
verified = bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
```

While both use bcrypt internally, their hash formats and verification methods are incompatible.

## Files Modified

1. **backend/init_db.py** - Updated to rehash passwords when users already exist
2. **backend/fix_passwords.py** - New script for one-time password fixes
3. **backend/auth.py** - Contains the updated hashing functions (already updated in commit 3cfc1a5)

## Related Commits

- `3cfc1a5` - Improve password security by updating hashing algorithm (introduced the issue)
- Current fix - Updates init_db.py to automatically rehash passwords

## Support

If you continue to experience login issues:

1. Check that you're using the correct credentials
2. Verify the backend service is running: `docker-compose ps`
3. Check backend logs: `docker-compose logs backend`
4. Ensure the database is accessible: `docker-compose logs postgres`
5. Try clearing browser cache and localStorage
6. Verify the SECRET_KEY environment variable is set consistently

## Production Note

⚠️ **IMPORTANT:** This fix resets default passwords to their original values. In production environments:

1. Change default passwords immediately after login
2. Use strong, unique passwords
3. Consider implementing password reset functionality
4. Enable email verification for new users
5. Implement rate limiting on authentication endpoints
