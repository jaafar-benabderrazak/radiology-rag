# Doctor User Management and Authentication System

This document describes the comprehensive authentication and user management system implemented for the Radiology RAG application.

## Overview

The system provides secure user authentication for doctors to access the radiology report generation system with AI-powered features. It includes:

- User registration and login with JWT-based authentication
- Role-based access control (Admin, Doctor, Radiologist)
- User profile management with doctor-specific fields
- Secure password hashing with bcrypt
- Protected API endpoints requiring authentication
- Seamless integration with the existing RAG, vector database, and AI analysis features

## Architecture

### Backend Components

1. **Database Layer** (`backend/database.py`)
   - PostgreSQL connection with SQLAlchemy
   - Session management and dependency injection
   - Integrated with existing Template, Report, and SimilarCase models

2. **User Model** (`backend/models.py`)
   - Doctor-specific fields: hospital_name, specialization, license_number
   - Role-based system: Admin, Doctor, Radiologist (UserRole enum)
   - Timestamps and status flags (is_active, is_verified)
   - Integrated seamlessly with existing models

3. **Authentication System** (`backend/auth.py`)
   - Password hashing with bcrypt via passlib
   - JWT token generation and validation using python-jose
   - Authentication dependencies for FastAPI endpoints
   - Role-based permission checks (admin-only operations)
   - Optional authentication support for flexible endpoint protection

4. **Schemas** (`backend/auth_schemas.py`)
   - Pydantic models for request/response validation
   - UserCreate, UserUpdate, UserResponse
   - LoginRequest, LoginResponse, Token, PasswordChange

5. **Configuration** (`backend/config.py`)
   - SECRET_KEY for JWT signing
   - ALGORITHM (HS256)
   - ACCESS_TOKEN_EXPIRE_MINUTES (default: 30)

6. **API Endpoints** (`backend/routers/`)
   - **Authentication routes** (`auth_router.py`):
     - POST `/api/auth/register` - New user registration
     - POST `/api/auth/login` - Login with email/password
     - POST `/api/auth/token` - OAuth2-compatible token endpoint
     - GET `/api/auth/me` - Get current user profile
     - POST `/api/auth/change-password` - Change password

   - **User Management routes** (`users_router.py`):
     - GET `/api/users/` - List all users (admin only)
     - GET `/api/users/{id}` - Get user details
     - PUT `/api/users/{id}` - Update user
     - DELETE `/api/users/{id}` - Delete user (admin only)
     - POST `/api/users/{id}/activate` - Activate account (admin only)
     - POST `/api/users/{id}/deactivate` - Deactivate account (admin only)

7. **Protected Endpoints**
   - POST `/generate` - Generate radiology report (requires authentication)
     - Automatically uses authenticated user's name and hospital
   - All AI analysis endpoints (summary, validation)
   - Document download endpoints (Word, PDF)
   - Report history endpoints

### Frontend Components

1. **API Client** (`frontend/src/lib/api.ts`)
   - Token management in localStorage
   - Authenticated request helpers with Bearer token
   - Auth API functions (login, register, getCurrentUser, logout)
   - All existing API calls updated to include authentication headers

2. **Authentication Context** (`frontend/src/contexts/AuthContext.tsx`)
   - Global user state management
   - Login/logout functionality
   - Token persistence and automatic revalidation
   - Auto-login after registration

3. **Auth Wrapper** (`frontend/src/components/auth/AuthWrapper.tsx`)
   - Login and registration forms in one component
   - Seamless integration with existing UI
   - User info header with logout button
   - Demo credentials display
   - Error handling and loading states

4. **Main App Integration** (`frontend/src/main.tsx`)
   - AuthProvider wraps the entire app
   - AuthWrapper provides authentication gate
   - Preserves all existing functionality when authenticated

## Key Features

✅ **Secure Authentication**
- JWT tokens with configurable expiration (default: 30 minutes)
- Bcrypt password hashing with automatic salt generation
- Secure password requirements (minimum 8 characters)

✅ **Role-Based Access Control**
- Admin: Full user management access
- Doctor: Can generate reports and manage own profile
- Radiologist: Specialized access (extensible)

✅ **User Management**
- Complete CRUD operations
- Account activation/deactivation
- Profile updates with validation
- Password changes with current password verification

✅ **Seamless Integration**
- Works with existing RAG (Retrieval-Augmented Generation) system
- Compatible with vector database (Qdrant) for similar cases
- Integrates with AI analysis services (summary, validation)
- Preserves all document generation features (Word, PDF)
- Maintains cache functionality

✅ **Professional UX**
- Clean, modern login/registration interface
- Automatic user info display in header
- Error handling with user-friendly messages
- Loading states during authentication
- Demo credentials for testing

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR NOT NULL,  -- admin, doctor, radiologist
    hospital_name VARCHAR,
    specialization VARCHAR,
    license_number VARCHAR UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

## Setup Instructions

### 1. Environment Configuration

The `.env` file (or environment variables) should include:

```env
# Existing configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro
POSTGRES_USER=radiology_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=radiology_templates
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
QDRANT_HOST=qdrant
QDRANT_PORT=6333

# Authentication (NEW)
SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**IMPORTANT:** Generate a secure SECRET_KEY:
```bash
openssl rand -hex 32
```

### 2. Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (database)
- Redis (caching)
- Qdrant (vector database for RAG)
- Backend API
- Frontend UI

### 3. Initialize Database

Wait for PostgreSQL to be ready, then run:

```bash
docker-compose exec backend python init_db.py
```

This creates:
- All database tables (users, templates, reports, similar_cases)
- Admin user: `admin@radiology.com` / `admin123`
- Sample doctor: `doctor@hospital.com` / `doctor123`
- Default radiology report templates

**⚠️ IMPORTANT:** Change the admin password after first login!

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## Default Credentials

### Admin Account
- **Email**: `admin@radiology.com`
- **Password**: `admin123`
- **Role**: Admin
- **Permissions**: Full system access

### Doctor Account
- **Email**: `doctor@hospital.com`
- **Password**: `doctor123`
- **Role**: Doctor
- **Hospital**: General Hospital
- **Specialization**: Radiology
- **License**: RAD-12345

## Usage Guide

### For Doctors

1. **Login/Register**
   - Navigate to http://localhost:3000
   - Use demo credentials or register a new account
   - All fields except hospital/specialization are required

2. **Generate Reports**
   - Enter clinical indication text
   - Select template or use auto-detection with RAG
   - Your name and hospital are automatically filled
   - Generate report with AI assistance
   - View similar cases used for context (when using RAG)

3. **AI Analysis**
   - Generate concise summaries
   - Validate reports for inconsistencies
   - Get key findings highlighted

4. **Download Reports**
   - Word format (.docx) with original formatting
   - Word with AI-generated content highlighted
   - PDF format

5. **Profile Management**
   - Update your information
   - Change password
   - View account details

### For Administrators

1. **User Management**
   - View all users: GET `/api/users/`
   - Activate/deactivate accounts
   - Delete users (cannot delete self)
   - Monitor user activity

2. **System Configuration**
   - Manage report templates
   - Monitor cache and vector database
   - View system health

## API Examples

### Authentication

**Register a new doctor:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.jane@hospital.com",
    "username": "drjane",
    "full_name": "Dr. Jane Doe",
    "password": "securePassword123",
    "hospital_name": "City Hospital",
    "specialization": "Radiology"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "doctor123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "doctor@hospital.com",
    "full_name": "Dr. John Smith",
    "hospital_name": "General Hospital",
    ...
  }
}
```

**Generate Report (authenticated):**
```bash
TOKEN="<your-access-token>"
curl -X POST http://localhost:8000/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Patient with acute onset shortness of breath...",
    "templateId": "auto",
    "use_rag": true
  }'
```

## Security Features

1. **Password Security**
   - Passwords hashed with bcrypt (cost factor: 12)
   - Automatic salt generation
   - Minimum 8 characters enforced
   - Password strength validation on frontend

2. **JWT Tokens**
   - Secure token-based authentication
   - Configurable expiration time
   - Bearer token format (RFC 6750)
   - Automatic token validation on protected routes

3. **Role-Based Access Control**
   - Admin role for user management
   - Doctor role for report generation
   - Radiologist role for specialized access
   - Enforced at both API and database level

4. **Protected Routes**
   - All API endpoints require authentication (except login/register)
   - Frontend automatically redirects to login
   - Token refresh on page reload
   - Automatic logout on token expiration

5. **Input Validation**
   - Email format validation
   - Username uniqueness checks
   - License number uniqueness (if provided)
   - SQL injection prevention via SQLAlchemy ORM
   - XSS prevention via Pydantic validation

## Integration with Existing Features

The authentication system integrates seamlessly with all existing features:

### RAG (Retrieval-Augmented Generation)
- Auto-template selection uses vector similarity search
- Similar cases retrieved from Qdrant based on clinical text
- User context preserved throughout RAG pipeline

### AI Analysis
- Summary generation in multiple languages (EN/FR)
- Report validation for inconsistencies
- Key findings extraction
- All use authenticated user's context

### Document Generation
- Word documents with user's name and hospital
- PDF generation from templates
- Highlighting of AI-generated content
- Formatted using template metadata

### Caching
- Redis caching still active for performance
- Cache keys include user context when relevant
- Automatic cache invalidation

### Vector Database
- Qdrant integration unchanged
- Similar cases search by category
- Embedding-based retrieval

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Authentication Errors

**"Could not validate credentials"**
- Token may have expired (default: 30 minutes)
- SECRET_KEY mismatch between requests
- Token corrupted in localStorage

**"Email already registered"**
- Try logging in instead of registering
- Check for typos in email
- Contact admin if account should be deleted

**"Incorrect email or password"**
- Verify credentials
- Check caps lock
- Password is case-sensitive

**"Inactive user"**
- Account has been deactivated
- Contact administrator for activation

### Permission Denied

**"Not enough permissions"**
- Check user role in database
- Verify endpoint requires correct role
- Ensure user account is active

**Admin-only endpoints return 403**
- Only users with role="admin" can access
- Regular doctors cannot access user management

## Development

### Adding New Roles

1. Update `UserRole` enum in `backend/models.py`:
```python
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    RADIOLOGIST = "radiologist"
    TECHNICIAN = "technician"  # NEW
```

2. Create permission check in `backend/auth.py`:
```python
async def get_current_technician(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if current_user.role.value != "technician":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user
```

3. Apply to endpoints as needed

### Custom User Fields

1. Add field to User model in `models.py`
2. Update schemas in `auth_schemas.py`
3. Run database migration (if using alembic)

### Testing Authentication

Run the test suite:
```bash
cd backend
pytest tests/test_auth.py -v
```

## Production Considerations

**CRITICAL - Must Do:**

1. **Change default passwords immediately**
   - admin@radiology.com
   - doctor@hospital.com

2. **Use strong SECRET_KEY**
   ```bash
   openssl rand -hex 32
   ```

3. **Enable HTTPS** for all communications
   - Configure nginx/reverse proxy with SSL
   - Use Let's Encrypt for certificates

4. **Configure CORS** properly
   ```python
   allow_origins=["https://yourdomain.com"]
   ```

**Recommended:**

5. **Set secure token expiration** times
   - Shorter expiration for production (15-30 min)
   - Implement refresh tokens for longer sessions

6. **Enable rate limiting** for auth endpoints
   - Prevent brute force attacks
   - Use Redis-based rate limiting

7. **Implement password reset** functionality
   - Email-based reset flow
   - Temporary reset tokens

8. **Add email verification** for new users
   - Verification emails with tokens
   - Set is_verified=False by default

9. **Enable audit logging** for user actions
   - Track all login attempts
   - Log all user modifications
   - Monitor admin actions

10. **Regular security updates**
    - Keep dependencies updated
    - Monitor security advisories
    - Regular penetration testing

## Future Enhancements

Planned improvements:

- [ ] Email verification for new registrations
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Session management and device tracking
- [ ] Rate limiting on authentication endpoints
- [ ] Account lockout after failed login attempts
- [ ] Comprehensive audit logs for user activities
- [ ] User profile photo upload
- [ ] Hospital/organization management
- [ ] Team collaboration features
- [ ] Report sharing between doctors
- [ ] Patient consent management
- [ ] DICOM integration
- [ ] HL7 FHIR support

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation at http://localhost:8000/docs
3. Check application logs:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

## License

[Your License Here]

## Contributors

[Your Team/Contributors Here]
