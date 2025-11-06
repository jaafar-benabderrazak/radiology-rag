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
- **Redis Caching** - Would improve performance
- **Qdrant Vector DB** - For RAG (Retrieval-Augmented Generation) features
- **DICOM Integration** - Medical image handling
- **Backup Service** - Database backups
- **Voice Dictation** - Requires Whisper library

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
7. ✅ Fixed bcrypt compatibility issue (downgraded to 4.x for passlib)
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
- No Redis caching (would improve performance with high traffic)
- No vector search/RAG features (requires sentence-transformers library)
- No DICOM support (requires pydicom library)
- Templates directory needs manual setup (copy .docx files to `backend/templates/`)

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
- Frontend builds to static files and serves on port 5000
- Backend runs separately (not included in autoscale deployment)
- For production, consider using VM deployment to run both services

## Next Steps
1. ✅ Database initialized with default users
2. Add custom template documents to `backend/templates/` directory
3. Test full report generation flow with Gemini API
4. Optional: Enable Redis/Qdrant for enhanced performance and RAG features
5. Customize templates and workflow for your radiology department
