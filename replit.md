# Radiology RAG System - Replit Setup

## Overview
AI-powered radiology report generation system with Google Gemini integration, built with FastAPI backend and React frontend.

## Project Structure
- `backend/` - FastAPI REST API with AI report generation
- `frontend/` - React + Vite frontend application  
- `templates/` - Word document templates for reports

## Current Configuration

### Technology Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Google Gemini AI
- **Frontend**: React 18, TypeScript, Vite
- **Database**: SQLite (fallback from PostgreSQL)
- **AI**: Google Gemini 1.5 Pro

### Environment Setup
- **Backend Port**: 8000 (internal)
- **Frontend Port**: 5000 (public web preview)
- **Database**: SQLite file-based (`radiology_db.sqlite`)
- **Cache**: Disabled (Redis not available)
- **Vector DB**: Disabled (Qdrant/sentence-transformers not available)

### Required Secrets
- `GEMINI_API_KEY` - Google Gemini API key for AI features ✅ Configured

### Optional Features (Currently Disabled)
- **Redis Caching** - Would improve performance (package installed but optional)
- **Qdrant Vector DB** - For RAG features (package installed but optional)
- **Vector Embeddings** - Removed sentence-transformers/PyTorch to reduce deployment size
- **DICOM Integration** - Requires pydicom library
- **Backup Service** - Database backups
- **Voice Dictation** - Requires Whisper library
- **Advanced NLP** - Removed spacy and scikit-learn to reduce deployment size

## Workflows

### Backend
- Command: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000`
- Status: Running ✅
- Health check: `http://localhost:8000/`

### Frontend  
- Command: `cd frontend && npm run dev`
- Status: Running ✅
- Accessible at port 5000

## Features Implemented
- ✅ AI-powered radiology report generation
- ✅ Multi-language support (English, French, Arabic)
- ✅ Template-based reporting
- ✅ User authentication (JWT)
- ✅ Report history and management
- ✅ AI summary generation
- ✅ Report validation
- ✅ Word/PDF export
- ✅ Critical findings detection

## API Documentation
When running, visit: `https://[your-repl-url]:8000/docs`

## Recent Changes (November 6, 2025)
1. ✅ Removed hardcoded API keys from docker-compose.yaml (security fix)
2. ✅ Configured for Replit environment (SQLite database, disabled optional services)
3. ✅ Installed Python and Node.js dependencies
4. ✅ Set up frontend to dynamically connect to backend API
5. ✅ Configured workflows for both backend (port 8000) and frontend (port 5000)
6. ✅ Set up deployment configuration for Replit Autoscale (frontend only)
7. ✅ Fixed bcrypt compatibility issue (using bcrypt 4.0.1 for passlib compatibility)
8. ✅ Created default users (admin and doctor accounts)

## Default User Accounts
**Admin User:**
- Email: `admin@radiology.com`
- Password: `admin123`
- Role: Admin

**Doctor User:**
- Email: `doctor@hospital.com`
- Password: `doctor123`
- Role: Doctor

⚠️ **IMPORTANT**: Change these passwords after first login!

## Known Limitations
- No PostgreSQL (using SQLite instead - works fine for single-user/small teams)
- No Redis caching in dev (installed but optional, would improve performance)
- No vector embeddings/RAG (removed sentence-transformers/PyTorch to reduce deployment size)
- No advanced NLP features (removed spacy/scikit-learn to reduce deployment size)
- No DICOM support (requires pydicom library)
- Templates directory needs manual setup (copy .docx files to `backend/templates/`)

## Deployment Optimizations (November 6, 2025)
- ✅ Removed PyTorch, TorchVision, CUDA libraries (~4 GiB saved)
- ✅ Removed sentence-transformers, transformers (~1 GiB saved)
- ✅ Removed spacy, scikit-learn, google-cloud-aiplatform (~500 MB saved)
- ✅ Using google-generativeai (lightweight) for all AI features
- ✅ Switched from Autoscale to Reserved VM for multi-service deployment
- ✅ Total deployment image now well under 8 GiB limit

## Development Commands

### Backend
```bash
cd backend
python -m uvicorn main:app --reload  # Development server
python init_db.py                     # Initialize database
```

### Frontend
```bash
cd frontend
npm install      # Install dependencies
npm run dev      # Development server
npm run build    # Production build
```

## Deployment
The project is configured for Replit Autoscale deployment:
- **Single Service Architecture**: Backend FastAPI serves both API and frontend
- **Port 5000**: All traffic (API + frontend) on single port for Autoscale compatibility
- **Static Files**: Frontend builds to dist/ and is served by FastAPI
- **Build Process**: Frontend builds first, then backend starts serving everything
- **Image Size**: Optimized dependencies keep deployment under 8 GiB limit

### Deployment Configuration
```bash
# Build: Install all dependencies
pip install -r backend/requirements.txt && cd frontend && npm install

# Run: Build frontend, then start backend on port 5000
cd frontend && npm run build && cd ../backend && uvicorn main:app --host 0.0.0.0 --port 5000
```

### How It Works
1. Frontend builds to static files (`frontend/dist/`)
2. Backend FastAPI serves:
   - API routes at `/api/*`, `/health`, etc.
   - Static frontend files at `/` and all other routes
3. Single port (5000) handles all traffic (required for Autoscale)

## Next Steps
1. ✅ Database initialized with default users
2. Add custom template documents to `backend/templates/` directory
3. Test full report generation flow with Gemini API
4. Optional: Enable Redis/Qdrant for enhanced performance and RAG features
5. Customize templates and workflow for your radiology department
