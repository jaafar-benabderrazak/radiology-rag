# Local Development Guide

Get the Radiology RAG application running on your local machine in minutes!

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** installed and running
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **Git** installed
   - Download from: https://git-scm.com/downloads

3. **Gemini API Key** (FREE)
   - Get from: https://makersuite.google.com/app/apikey
   - Click "Get API Key" → Create in new or existing project

### Step 1: Clone Repository

**On Windows (PowerShell or Command Prompt):**
```powershell
cd C:\Users\YourName\Documents
git clone https://github.com/jaafar-benabderrazak/radiology-rag.git
cd radiology-rag
git checkout claude/production-deployment-011CUfTU67T65RF7aQZUpKp2
```

**On Mac/Linux (Terminal):**
```bash
cd ~/Documents
git clone https://github.com/jaafar-benabderrazak/radiology-rag.git
cd radiology-rag
git checkout claude/production-deployment-011CUfTU67T65RF7aQZUpKp2
```

### Step 2: Configure Environment

**On Windows:**
```powershell
copy .env.local.example .env.local
notepad .env.local
```

**On Mac/Linux:**
```bash
cp .env.local.example .env.local
nano .env.local
```

**Edit .env.local and add your Gemini API key:**
```env
GEMINI_API_KEY=your-actual-api-key-here
```

Save and close (Notepad: File → Save, nano: Ctrl+O, Enter, Ctrl+X)

### Step 3: Start Application

**On Windows:**
```powershell
cd scripts
.\start-local.bat
```

**On Mac/Linux:**
```bash
cd scripts
./start-local.sh
```

**Or manually:**
```bash
# From project root
docker-compose -f docker-compose.local.yml up -d

# Wait 30 seconds for services to start

# Initialize database
docker-compose -f docker-compose.local.yml exec backend python init_db.py
```

### Step 4: Access Application

Open your browser and go to:
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

### Step 5: Login

Use default credentials:
- **Admin**: admin@radiology.com / admin123
- **Doctor**: doctor@hospital.com / doctor123

**⚠️ Change these passwords in production!**

---

## 📊 What's Running?

| Service | Port | URL |
|---------|------|-----|
| Frontend (React + Vite) | 3000 | http://localhost:3000 |
| Backend (FastAPI) | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Qdrant (Vector DB) | 6333 | http://localhost:6333 |
| API Docs (Swagger) | 8000 | http://localhost:8000/docs |

---

## 🛠️ Development Workflow

### View Logs

**All services:**
```bash
docker-compose -f docker-compose.local.yml logs -f
```

**Specific service:**
```bash
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
```

### Restart Services

**All services:**
```bash
docker-compose -f docker-compose.local.yml restart
```

**Specific service:**
```bash
docker-compose -f docker-compose.local.yml restart backend
```

### Stop Everything

```bash
docker-compose -f docker-compose.local.yml down
```

### Clean Everything (including data)

```bash
docker-compose -f docker-compose.local.yml down -v
```

### Rebuild After Changes

```bash
docker-compose -f docker-compose.local.yml up -d --build
```

---

## 📁 Project Structure

```
radiology-rag/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main application
│   ├── models.py              # Database models
│   ├── auth.py                # Authentication logic
│   ├── routers/               # API endpoints
│   ├── init_db.py             # Database initialization
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.tsx           # Main app component
│   │   ├── components/       # UI components
│   │   ├── contexts/         # React contexts
│   │   └── lib/              # API client
│   ├── package.json
│   └── vite.config.ts
├── scripts/                    # Utility scripts
│   ├── start-local.sh        # Start local dev (Mac/Linux)
│   ├── start-local.bat       # Start local dev (Windows)
│   └── deploy.sh             # Production deployment
├── docker-compose.local.yml   # Local development setup
├── docker-compose.prod.yml    # Production setup
└── .env.local                 # Local configuration
```

---

## 🔧 Common Tasks

### Add New User

**Via UI:**
1. Login as admin
2. Go to User Management
3. Click "Add User"
4. Fill in details and submit

**Via API:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdoctor@hospital.com",
    "username": "newdoctor",
    "full_name": "Dr. New Doctor",
    "password": "securePassword123",
    "hospital_name": "General Hospital",
    "specialization": "Radiology"
  }'
```

### Change Password

**Via UI:**
1. Login
2. Go to Settings (future feature)
3. Change password

**Via API:**
```bash
TOKEN="your-jwt-token"
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "doctor123",
    "new_password": "newSecurePassword456"
  }'
```

### Reset Database

```bash
# Stop services
docker-compose -f docker-compose.local.yml down -v

# Start fresh
docker-compose -f docker-compose.local.yml up -d

# Wait for PostgreSQL
sleep 10

# Re-initialize
docker-compose -f docker-compose.local.yml exec backend python init_db.py
```

### View Database

**Using psql:**
```bash
docker-compose -f docker-compose.local.yml exec postgres psql -U radiology_user -d radiology_templates
```

**SQL commands:**
```sql
-- List all tables
\dt

-- View users
SELECT * FROM users;

-- View templates
SELECT * FROM templates;

-- View reports
SELECT * FROM reports;

-- Exit
\q
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Problem:** "port is already allocated"

**Solution:**
```bash
# Find what's using the port (example for port 3000)
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Kill the process or change the port in docker-compose.local.yml
```

### Docker Not Running

**Problem:** "Cannot connect to Docker daemon"

**Solution:**
- Make sure Docker Desktop is running
- Restart Docker Desktop
- On Windows: Check if WSL 2 is installed

### Containers Keep Restarting

**Problem:** Services show "Restarting" status

**Solution:**
```bash
# Check logs for errors
docker-compose -f docker-compose.local.yml logs backend

# Common issues:
# - GEMINI_API_KEY not set or invalid
# - Database connection failed
# - Port conflicts
```

### Database Connection Error

**Problem:** "could not connect to server"

**Solution:**
```bash
# Check if PostgreSQL is healthy
docker-compose -f docker-compose.local.yml ps postgres

# If not healthy, check logs
docker-compose -f docker-compose.local.yml logs postgres

# Restart PostgreSQL
docker-compose -f docker-compose.local.yml restart postgres
```

### Frontend Not Loading

**Problem:** "This site can't be reached"

**Solution:**
```bash
# Check if frontend is running
docker-compose -f docker-compose.local.yml ps frontend

# Check frontend logs
docker-compose -f docker-compose.local.yml logs frontend

# Rebuild frontend
docker-compose -f docker-compose.local.yml up -d --build frontend
```

### Gemini API Error

**Problem:** "GEMINI_API_KEY not set" or "Invalid API key"

**Solution:**
1. Check .env.local has your API key
2. Make sure there are no extra spaces
3. Verify key is valid at https://makersuite.google.com/app/apikey
4. Restart backend:
   ```bash
   docker-compose -f docker-compose.local.yml restart backend
   ```

---

## 💡 Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Edit files in `frontend/src/` and save - browser auto-refreshes
- **Backend**: Edit files in `backend/` and save - FastAPI auto-reloads

### API Testing

Use the interactive API docs at http://localhost:8000/docs

1. Click on any endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"
5. See response

### Database Inspection

Use a GUI tool like:
- **DBeaver** (free): https://dbeaver.io/
- **pgAdmin** (free): https://www.pgadmin.org/
- **TablePlus** (paid): https://tableplus.com/

Connection details:
- Host: localhost
- Port: 5432
- Database: radiology_templates
- User: radiology_user
- Password: radiology_pass

### Vector Database

Access Qdrant dashboard at http://localhost:6333/dashboard

- View collections
- Search vectors
- Inspect similar cases

---

## 🧪 Testing

### Test Backend

```bash
# Run tests
docker-compose -f docker-compose.local.yml exec backend pytest

# Run with coverage
docker-compose -f docker-compose.local.yml exec backend pytest --cov
```

### Test Frontend

```bash
# Run tests
docker-compose -f docker-compose.local.yml exec frontend npm test

# Run with coverage
docker-compose -f docker-compose.local.yml exec frontend npm test -- --coverage
```

### Manual Testing Checklist

- [ ] Can register new user
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Can generate report with clinical text
- [ ] Can download report as Word
- [ ] Can download report as PDF
- [ ] Can view AI summary
- [ ] Can validate report
- [ ] Can view similar cases (with RAG)
- [ ] Admin can access user management
- [ ] Non-admin cannot access user management
- [ ] Can activate/deactivate users (admin)
- [ ] Can logout successfully

---

## 📝 Next Steps

After getting it running locally:

1. **Customize**: Modify templates, add new features
2. **Test**: Try different clinical scenarios
3. **Deploy**: Follow DEPLOYMENT.md for production
4. **Monitor**: Check logs regularly
5. **Backup**: Regular database backups

---

## 🆘 Getting Help

1. **Check logs** first:
   ```bash
   docker-compose -f docker-compose.local.yml logs -f
   ```

2. **Check this guide's troubleshooting section**

3. **Check main documentation**:
   - DEPLOYMENT.md - Production deployment
   - AUTHENTICATION.md - Auth system details
   - DEPLOYMENT_FREE.md - Free deployment options

4. **Common issues**:
   - API key not set → Check .env.local
   - Port conflicts → Change ports or stop other services
   - Database errors → Reset database
   - Docker errors → Restart Docker Desktop

---

## 🎉 You're Ready!

Your local development environment is set up. Start coding!

**Quick Reference:**
- Start: `./scripts/start-local.sh` (or .bat on Windows)
- Stop: `docker-compose -f docker-compose.local.yml down`
- Logs: `docker-compose -f docker-compose.local.yml logs -f`
- Reset: `docker-compose -f docker-compose.local.yml down -v`

Happy developing! 🚀
