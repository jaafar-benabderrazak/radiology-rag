# Production Deployment Guide - Radiology RAG System

## Phase 1: Database Migration (Priority 1)

### Step 1: Set Up Production PostgreSQL

**Recommended: Supabase PostgreSQL**
```bash
# 1. Create Supabase project: https://supabase.com
# 2. Get connection string from project settings
# 3. Add to environment variables

# Connection string format:
# postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**Alternative: Railway.app**
```bash
# 1. Visit railway.app
# 2. Create new PostgreSQL database
# 3. Copy connection string
```

### Step 2: Update Environment Variables

Create `.env.production`:
```bash
# Database
USE_SQLITE=false
DATABASE_URL=postgresql://user:password@host:5432/radiology_prod

# Security (CRITICAL - Generate new secrets!)
SECRET_KEY=your-super-secret-key-min-32-chars
REFRESH_SECRET_KEY=another-super-secret-key-min-32-chars

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# App Settings
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Step 3: Database Initialization Script

Create `backend/init_production_db.py`:
```python
"""
Initialize production database with proper schema and default data
Run once during initial deployment
"""
import os
from sqlalchemy import create_engine
from database import Base
from models import User, Template
from auth import get_password_hash
from template_loader import load_templates_from_files
from sqlalchemy.orm import Session

def init_production_database():
    db_url = os.getenv("DATABASE_URL")
    if not db_url or db_url.startswith("sqlite"):
        raise ValueError("Must use PostgreSQL for production!")

    engine = create_engine(db_url)

    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # Create session
    session = Session(bind=engine)

    try:
        # Check if admin exists
        admin_exists = session.query(User).filter(
            User.email == "admin@radiology.com"
        ).first()

        if not admin_exists:
            print("Creating admin user...")
            admin = User(
                email="admin@radiology.com",
                username="admin",
                full_name="System Administrator",
                hashed_password=get_password_hash(os.getenv("ADMIN_PASSWORD", "changeme123")),
                role="admin",
                is_active=True,
                is_verified=True
            )
            session.add(admin)
            session.commit()
            print("✓ Admin user created")

        # Load templates
        print("Loading templates...")
        templates_data = load_templates_from_files()
        for tpl_data in templates_data:
            # Check if template exists
            exists = session.query(Template).filter(
                Template.template_id == tpl_data["template_id"]
            ).first()

            if not exists:
                template = Template(**tpl_data, is_system_template=True)
                session.add(template)

        session.commit()
        print(f"✓ Loaded {len(templates_data)} templates")

        print("✅ Production database initialized successfully!")

    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_production_database()
```

---

## Phase 2: Security Hardening (Priority 1)

### Step 1: Implement Refresh Tokens

**Backend: Add Refresh Token Model**
```python
# backend/models.py - Add this model

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    device_info = Column(String(500), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", backref="refresh_tokens")
```

**Backend: Update Auth System**
```python
# backend/auth.py - Add refresh token support

from datetime import timedelta
import secrets

def create_refresh_token(user_id: int, db: Session, request: Request) -> str:
    """Create a refresh token and store in database"""
    token = secrets.token_urlsafe(64)

    expires_at = datetime.utcnow() + timedelta(days=7)

    refresh_token = RefreshToken(
        user_id=user_id,
        token=token,
        device_info=request.headers.get("User-Agent", "Unknown")[:500],
        ip_address=request.client.host,
        expires_at=expires_at
    )

    db.add(refresh_token)
    db.commit()

    return token

def verify_refresh_token(token: str, db: Session) -> Optional[User]:
    """Verify refresh token and return user"""
    refresh = db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()

    if not refresh:
        return None

    return db.query(User).filter(User.id == refresh.user_id).first()
```

**Backend: Add Refresh Endpoint**
```python
# backend/routers/auth_router.py

from fastapi import Response, Request, Cookie

@router.post("/refresh", response_model=LoginResponse)
async def refresh_access_token(
    request: Request,
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token from cookie"""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    user = verify_refresh_token(refresh_token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Create new access token
    access_token = create_access_token(data={"sub": user.email})

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login with refresh token support"""
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(user.id, db, request)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # HTTPS only in production
        samesite="lax",
        max_age=7*24*60*60  # 7 days
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
async def logout(
    refresh_token: str = Cookie(None),
    response: Response,
    db: Session = Depends(get_db)
):
    """Logout and revoke refresh token"""
    if refresh_token:
        token = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).first()
        if token:
            token.is_revoked = True
            db.commit()

    # Clear cookie
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
```

### Step 2: Add Rate Limiting

```python
# backend/main.py - Add rate limiting

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to auth endpoints
@router.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(...):
    ...
```

**Install dependency:**
```bash
pip install slowapi
```

### Step 3: Add CORS Security

```python
# backend/main.py - Update CORS

from fastapi.middleware.cors import CORSMiddleware

# Get allowed origins from environment
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Specific domains only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"]
)
```

---

## Phase 3: Deployment Infrastructure

### Option A: Deploy to Railway.app (Recommended for Quick Start)

**Pros:**
- Easy setup (5 minutes)
- Automatic HTTPS
- Built-in PostgreSQL
- $5-20/month
- GitHub integration

**Steps:**
```bash
# 1. Connect GitHub repo to Railway
# 2. Add PostgreSQL service
# 3. Add environment variables
# 4. Deploy automatically on git push
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements-deploy.txt"
  },
  "deploy": {
    "startCommand": "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Option B: Deploy to Render.com

**Pros:**
- Free tier available
- Auto-scaling
- Easy SSL
- Good for medical apps

**render.yaml:**
```yaml
services:
  - type: web
    name: radiology-rag
    env: python
    buildCommand: |
      cd frontend && npm install && npm run build
      cd ../backend && pip install -r requirements-deploy.txt
    startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: radiology-db
          property: connectionString
      - key: GEMINI_API_KEY
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: PYTHON_VERSION
        value: 3.11

databases:
  - name: radiology-db
    databaseName: radiology_prod
    plan: starter  # $7/month
```

### Option C: AWS (Enterprise-Grade, HIPAA-Eligible)

**Architecture:**
```
┌─────────────────────────────────────────┐
│ Route 53 (DNS)                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ CloudFront (CDN + SSL)                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Application Load Balancer               │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐    ┌─────▼─────┐
│ ECS/Fargate│    │ ECS/Fargate│
│ (Backend) │    │ (Backend)  │
└─────┬─────┘    └─────┬──────┘
      │                │
      └────────┬────────┘
               │
┌──────────────▼──────────────────────────┐
│ RDS PostgreSQL (Multi-AZ)               │
│ - Automatic backups                     │
│ - Read replicas                         │
│ - Encryption at rest                    │
└─────────────────────────────────────────┘
```

**Cost Estimate:** $150-300/month (with reserved instances)

---

## Phase 4: Monitoring & Logging

### Step 1: Application Monitoring

**Option A: Sentry (Error Tracking)**
```bash
pip install sentry-sdk[fastapi]
```

```python
# backend/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
    environment="production"
)
```

**Option B: Better Stack (formerly Logtail)**
```python
# Structured logging
import logging
from pythonjsonlogger import jsonlogger

logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logging.root.addHandler(logHandler)
logging.root.setLevel(logging.INFO)
```

### Step 2: Performance Monitoring

**Backend: Add health checks and metrics**
```python
# backend/main.py

from prometheus_fastapi_instrumentator import Instrumentator

@app.on_event("startup")
async def startup():
    Instrumentator().instrument(app).expose(app)

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Check database
        db.execute("SELECT 1")

        # Check Gemini API (optional)
        # ...

        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }, 503
```

---

## Phase 5: HIPAA Compliance (Medical Data)

### Critical Requirements:

**1. Business Associate Agreement (BAA)**
- Sign BAA with hosting provider
- AWS, Google Cloud, Azure offer HIPAA-compliant tiers
- Supabase offers HIPAA compliance on paid plans

**2. Encryption**
```python
# backend/models.py - Encrypt sensitive fields

from sqlalchemy_utils import EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine

class Report(Base):
    # Encrypt patient data
    patient_name = Column(
        EncryptedType(String, settings.ENCRYPTION_KEY, AesEngine, 'pkcs5'),
        nullable=True
    )

    indication = Column(
        EncryptedType(Text, settings.ENCRYPTION_KEY, AesEngine, 'pkcs5'),
        nullable=False
    )
```

**3. Audit Logging**
```python
# backend/models.py

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100))  # view, create, update, delete
    resource_type = Column(String(50))  # report, template, user
    resource_id = Column(Integer)
    ip_address = Column(String(50))
    user_agent = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Store what changed
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
```

**4. Access Controls**
```python
# Implement proper RBAC
# - Doctors can only see their own patients
# - Radiologists can see all reports
# - Admin can manage users
```

---

## Phase 6: Backup & Disaster Recovery

### Database Backups

**Automated Backups (PostgreSQL):**
```bash
# Daily automated backups
# Point-in-time recovery
# Cross-region replication (for DR)
```

**Manual Backup Script:**
```bash
#!/bin/bash
# backup_db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_URL="postgresql://..."

pg_dump $DB_URL | gzip > $BACKUP_DIR/radiology_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/radiology_$DATE.sql.gz s3://your-backup-bucket/

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

---

## Phase 7: CI/CD Pipeline

**GitHub Actions Workflow:**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Run backend tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest tests/

      - name: Run frontend tests
        run: |
          cd frontend
          npm install
          npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Cost Breakdown (Monthly)

### Minimum Viable Production:
```
Railway.app (app hosting):     $5-20
PostgreSQL (Railway):          Included
Domain (Namecheap):            $12/year
SSL Certificate:               Free (Let's Encrypt)
Sentry (error tracking):       Free tier
─────────────────────────────────────
TOTAL:                         ~$10-25/month
```

### Enterprise-Grade (HIPAA):
```
AWS ECS Fargate (2 containers): $50
AWS RDS PostgreSQL (Multi-AZ):   $80
AWS S3 (backups):                $5
AWS CloudFront (CDN):            $10
AWS Route 53 (DNS):              $1
Sentry Professional:             $26
Better Stack (logging):          $10
───────────────────────────────────
TOTAL:                           ~$180/month
```

---

## Deployment Checklist

### Before Going Live:
- [ ] PostgreSQL database configured
- [ ] Environment variables secured
- [ ] SECRET_KEY changed from default
- [ ] Default admin password changed
- [ ] HTTPS/SSL enabled
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Refresh tokens implemented
- [ ] Error tracking configured (Sentry)
- [ ] Database backups automated
- [ ] Health check endpoint working
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] HIPAA compliance reviewed
- [ ] Terms of Service & Privacy Policy added
- [ ] Domain & DNS configured
- [ ] Monitoring dashboards set up

---

## Quick Start: Fastest Path to Production

**Week 1: Minimal Changes**
```bash
# 1. Create Supabase account (free tier)
# 2. Get PostgreSQL connection string
# 3. Update .env with DATABASE_URL
# 4. Deploy to Railway.app
# 5. Configure custom domain
# 6. Test with real users
```

This gets you a working production app in ~1 week!

**Week 2-4: Add Security**
- Implement refresh tokens
- Add rate limiting
- Set up monitoring
- Configure backups

Would you like me to help implement any specific part of this roadmap?
