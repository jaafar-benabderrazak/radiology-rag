# Deployment Fix - pyproject.toml Issue

## Problem
The deployment was failing with the error:
```
No `pyproject.toml` found in current directory or any parent directory
The build script expects a pyproject.toml file but it has been renamed to pyproject.toml.backup
The build command is trying to run 'uv sync' which requires a pyproject.toml file
```

## Root Cause
- Replit's deployment system automatically tries to use `uv` (modern Python package manager) when it detects a Python project
- `uv sync` requires a `pyproject.toml` file to be present
- The original `pyproject.toml` was renamed to avoid the 8GB deployment size limit (it included heavy ML dependencies)

## Solution Applied

### 1. ✅ Created Minimal pyproject.toml
Created a lightweight `backend/pyproject.toml` with:
- Project metadata only
- **No dependencies** listed (they come from `requirements-minimal.txt`)
- Minimal build system configuration
- This satisfies the deployment system without adding bloat

```toml
[project]
name = "radiology-rag"
version = "1.0.0"
description = "Radiology RAG - AI-powered medical report generation"
requires-python = ">=3.11"
dependencies = []  # Empty - we use requirements-minimal.txt instead

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
```

### 2. ✅ Updated build-replit.sh
Enhanced the build script to:
- Explicitly use `pip` instead of `uv`
- Add `--no-cache-dir` flag to reduce disk usage
- Install from `requirements-minimal.txt` (54 lightweight packages)

```bash
cd backend
pip install --no-cache-dir -r requirements-minimal.txt
cd ..
```

### 3. ✅ Configured Deployment Settings
Updated `.replit` deployment configuration:
- **Deployment Target**: `autoscale` (for stateless web apps)
- **Build Command**: `bash build-replit.sh`
- **Run Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 5000`
- **Port**: 5000 (required for Replit deployments)

## Why This Works

### Lightweight Approach
- `pyproject.toml` is minimal (no heavy dependencies)
- Build script uses `requirements-minimal.txt` (54 packages, ~150MB)
- Avoids the 8GB deployment limit
- No ML packages (sentence-transformers, whisper, etc.)

### Dependencies Included
The `requirements-minimal.txt` includes only core packages:
- FastAPI + Uvicorn (web server)
- SQLAlchemy + alembic (database)
- Google Generative AI (Gemini API)
- Pydantic, python-multipart, pyjwt (utilities)
- python-docx, reportlab (document generation)
- Redis, qdrant-client (optional services - graceful fallback if unavailable)

### What's Excluded
Heavy packages that caused deployment failures:
- ❌ sentence-transformers (~1GB)
- ❌ openai-whisper (~1.5GB)
- ❌ PyTorch and ML dependencies
- ❌ ffmpeg-python
- ❌ soundfile, torchaudio

## Deployment Steps

### 1. Pre-Deployment Checklist
- ✅ `backend/pyproject.toml` exists and is minimal
- ✅ `backend/requirements-minimal.txt` has core dependencies
- ✅ `build-replit.sh` uses pip instead of uv
- ✅ `.replit` has correct deployment configuration
- ✅ `GEMINI_API_KEY` is set in Replit Secrets

### 2. Deploy
Click the **Deploy** button in Replit or run:
```bash
replit deploy
```

### 3. Expected Build Output
```
Building Radiology RAG for deployment...
Installing minimal Python dependencies...
Successfully installed fastapi uvicorn sqlalchemy...
Building frontend...
added 234 packages
Build complete!
```

### 4. Expected Runtime
```
Starting server on port 5000...
✓ Database tables ready
✓ Cache service initialized (or warning if Redis unavailable)
✓ Vector service initialized (or warning if Qdrant unavailable)
✓ Authentication system ready
Backend ready!
```

## Alternative Configurations

### Option A: Full Requirements (Dev Only)
For local development with all features:
```bash
pip install -r backend/requirements.txt
```
This includes ML packages but won't work for deployment due to size limits.

### Option B: External Services (Production)
For production with advanced features:
- Use external Redis (Redis Cloud, Upstash)
- Use external Qdrant (Qdrant Cloud)
- Use OpenAI Whisper API (cloud-based transcription)

Add to deployment environment variables:
```
REDIS_HOST=your-redis-cloud-url
QDRANT_HOST=your-qdrant-cloud-url
OPENAI_API_KEY=your-key
```

## Troubleshooting

### Issue: "uv sync" still running
**Solution**: Make sure `backend/pyproject.toml` exists with minimal content

### Issue: Build times out
**Solution**: Reduce packages in `requirements-minimal.txt` or use external services

### Issue: Module not found at runtime
**Solution**: Add the missing package to `requirements-minimal.txt`

### Issue: 8GB deployment limit exceeded
**Solution**: Verify you're using `requirements-minimal.txt`, not `requirements.txt`

## Files Modified
- ✅ Created: `backend/pyproject.toml` (minimal version)
- ✅ Updated: `build-replit.sh` (use pip, not uv)
- ✅ Updated: `.replit` (deployment configuration)
- ✅ Unchanged: `requirements-minimal.txt` (core dependencies only)

## Verification
Run locally to test:
```bash
bash build-replit.sh
bash start-replit.sh
```

Should see:
- No errors during build
- Server starts on port 5000
- Frontend and API both accessible

## Summary
The deployment should now work because:
1. ✅ `pyproject.toml` exists (satisfies deployment system)
2. ✅ It's minimal (no heavy dependencies)
3. ✅ Build script uses pip + requirements-minimal.txt (lightweight)
4. ✅ Deployment target is autoscale (correct for web apps)
5. ✅ Port 5000 is configured (Replit requirement)

Your radiology RAG application is now ready to deploy! 🚀
