# Authentication System Guide

## Overview

A complete user authentication system has been added with JWT tokens, user management, and role-based access control.

## 🔧 Setup Required

### 1. Rebuild Backend Container

The backend needs new Python dependencies (passlib, python-jose):

```powershell
# Rebuild the backend with new dependencies
docker compose build backend

# Restart all services
docker compose up -d

# Check backend logs
docker compose logs backend --tail 50
```

### 2. Apply Database Migration

Add the missing database columns and create the users table:

```powershell
# Run the SQL migration
docker compose exec postgres psql -U radiology_user -d radiology_templates -c "ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_conclusion TEXT;"
docker compose exec postgres psql -U radiology_user -d radiology_templates -c "ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_language VARCHAR(10);"
docker compose exec postgres psql -U radiology_user -d radiology_templates -c "ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
docker compose exec postgres psql -U radiology_user -d radiology_templates -c "ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id INTEGER;"

# Create users table
docker compose exec postgres psql -U radiology_user -d radiology_templates << 'EOF'
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'doctor' NOT NULL,
    specialization VARCHAR(200),
    license_number VARCHAR(100),
    hospital_affiliation VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
EOF
```

### 3. Set SECRET_KEY (Optional but Recommended)

Generate a secure secret key:

```powershell
# Generate a random secret key
$secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
echo "SECRET_KEY=$secretKey"
```

Add to `.env` file or docker-compose.yaml:
```yaml
environment:
  - SECRET_KEY=your-generated-secret-key-here
```

## 📚 API Endpoints

### Authentication

#### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "username": "drsmith",
  "password": "SecurePass123!",
  "full_name": "Dr. John Smith",
  "specialization": "Radiology",
  "license_number": "RAD12345",
  "hospital_affiliation": "General Hospital"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "doctor@hospital.com",
    "username": "drsmith",
    "full_name": "Dr. John Smith",
    "role": "doctor",
    "specialization": "Radiology",
    "hospital_affiliation": "General Hospital",
    "is_active": true,
    "is_verified": false,
    "created_at": "2025-10-30T12:00:00"
  }
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=drsmith&password=SecurePass123!

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {...}
}
```

#### Get Current User
```bash
GET /auth/me
Authorization: Bearer eyJhbGc...

Response:
{
  "id": 1,
  "email": "doctor@hospital.com",
  "username": "drsmith",
  ...
}
```

#### Update Profile
```bash
PUT /auth/me
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "full_name": "Dr. John H. Smith",
  "specialization": "Neuroradiology"
}
```

#### Change Password
```bash
POST /auth/change-password
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass456!"
}
```

#### List All Users (Admin Only)
```bash
GET /auth/users
Authorization: Bearer eyJhbGc...
```

### Using Authentication with Reports

Reports are now automatically linked to the authenticated user:

```bash
POST /generate
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "input": "Patient with chest pain...",
  "templateId": "auto"
}
```

If no Authorization header is provided, the system works as before (backward compatible).

## 🎭 User Roles

- **admin**: Full access to all features + user management
- **doctor**: Can create and view reports
- **technician**: Can assist with report creation
- **viewer**: Read-only access

Default role for new registrations is `doctor`.

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- Passwords are hashed with bcrypt
- Never stored in plain text

### JWT Tokens
- 7-day expiration (configurable)
- Include user ID and username
- Require SECRET_KEY for signing
- Validated on every protected request

### Account Status
- `is_active`: Account can log in
- `is_verified`: Email verification status (optional)

## 🧪 Testing the Authentication

### 1. Register a New User

```powershell
curl -X POST http://localhost:8000/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@doctor.com",
    "username": "testdoc",
    "password": "TestPass123!",
    "full_name": "Test Doctor"
  }'
```

### 2. Login

```powershell
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=testdoc&password=TestPass123!"
```

Save the `access_token` from the response.

### 3. Use Token for API Calls

```powershell
$token = "your-access-token-here"

curl -X GET http://localhost:8000/auth/me `
  -H "Authorization: Bearer $token"
```

### 4. Generate Report with Authentication

```powershell
curl -X POST http://localhost:8000/generate `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "input": "Patient with acute chest pain...",
    "templateId": "auto"
  }'
```

## 📖 Database Schema

### Users Table
```sql
users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'doctor',
    specialization VARCHAR(200),
    license_number VARCHAR(100),
    hospital_affiliation VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP
)
```

### Reports Table (Updated)
```sql
reports (
    ...existing columns...
    user_id INTEGER REFERENCES users(id)
)
```

## 🔄 Migration from Non-Auth System

The system is **backward compatible**:

- Existing reports without `user_id` continue to work
- API endpoints work without authentication
- Authentication is optional for now
- Can be made required later by removing `get_optional_user`

## 🚀 Next Steps

1. **Frontend UI**: Login/Register pages (in progress)
2. **Email Verification**: Implement email verification flow
3. **Password Reset**: Add forgot password functionality
4. **Admin Dashboard**: User management interface
5. **Audit Logging**: Track user actions
6. **Rate Limiting**: Prevent brute force attacks

## ⚠️ Production Considerations

### Must Do Before Production:
1. **Change SECRET_KEY**: Use a strong, random secret key
2. **Enable HTTPS**: JWT tokens must use HTTPS
3. **Email Verification**: Require email verification
4. **Password Policy**: Enforce stronger passwords
5. **Rate Limiting**: Add login attempt limits
6. **CORS**: Restrict allowed origins
7. **Database Backups**: Regular backups of user data

### Security Checklist:
- [ ] SECRET_KEY is random and not in version control
- [ ] HTTPS enabled for all endpoints
- [ ] Email verification implemented
- [ ] Password reset flow with secure tokens
- [ ] Rate limiting on auth endpoints
- [ ] CORS properly configured
- [ ] SQL injection protection (using SQLAlchemy ORM)
- [ ] XSS protection (FastAPI auto-escapes)
- [ ] Regular security updates

## 📞 Support

If you encounter issues:

1. Check backend logs: `docker compose logs backend`
2. Verify database migration: `docker compose exec postgres psql -U radiology_user -d radiology_templates -c "\d users"`
3. Test auth endpoint: `curl http://localhost:8000/docs` (FastAPI auto-docs)

## 🎉 Success!

You now have a complete authentication system! Users can:
- Register accounts
- Login securely
- Manage profiles
- Create reports linked to their account
- Change passwords
- View their report history

Frontend UI coming next! 🚀
