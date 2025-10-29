# Troubleshooting Guide

## Common Issues and Solutions

### 1. Backend Container Keeps Restarting

**Error**: `exec /app/startup.sh: no such file or directory`

**Cause**: Windows line endings (CRLF) in startup script cause Linux containers to fail.

**Solution**: The Dockerfile has been updated to use inline commands instead of the startup script. Rebuild:
```bash
docker-compose build backend
docker-compose up -d backend
```

### 2. Gemini API Model Not Found

**Error**: `404 models/gemini-1.5-flash is not found`

**Cause**: Incorrect Gemini model name in configuration.

**Solution**: The model name has been changed to `gemini-pro` in docker-compose.yaml. Valid models:
- `gemini-pro` (Gemini 1.0 Pro) - **Recommended**
- `gemini-1.5-pro` (Gemini 1.5 Pro)

To check available models for your API key:
```bash
docker exec -it radiology-rag-backend python -c "
import google.generativeai as genai
genai.configure(api_key='YOUR_API_KEY')
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(model.name)
"
```

### 3. Docker Compose Version Warning

**Warning**: `the attribute 'version' is obsolete`

**Solution**: Removed `version: '3.8'` from docker-compose.yaml as it's no longer needed in modern Docker Compose.

### 4. Frontend Shows "Failed to Fetch"

**Symptoms**:
- Frontend loads but can't generate reports
- No templates shown in dropdown
- Error: "Failed to fetch"

**Diagnosis**:
```bash
# Check if backend is running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Test backend health
curl http://localhost:8000/health
```

**Common Causes**:
1. Backend container not running → restart: `docker-compose restart backend`
2. Backend API error (check logs)
3. Gemini API issue (see #2 above)

### 5. Database Connection Errors

**Error**: Backend can't connect to PostgreSQL

**Solution**: Wait for PostgreSQL to fully initialize (30-60 seconds), then restart backend:
```bash
docker-compose restart backend
```

The Dockerfile now includes a 10-second sleep to give PostgreSQL time to start.

### 6. Port Already in Use

**Error**: `port is already allocated`

**Solution**: Either stop the conflicting service or change ports in docker-compose.yaml:
```yaml
ports:
  - "3001:3000"  # Change frontend to 3001
  - "8001:8000"  # Change backend to 8001
```

### 7. Heavy ML Model Downloads Slow

**Symptom**: Backend takes long time to start, downloading models

**Explanation**: First time only - sentence-transformers downloads ~500MB of models
- Subsequent starts will be fast (cached)
- You'll see: "Loading embedding model: all-MiniLM-L6-v2..."

**To Speed Up**: Once downloaded, models are cached in Docker volume

### 8. Complete Reset

If you need to start fresh:

```bash
# Stop everything
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove images
docker image prune -a -f

# Rebuild from scratch
docker-compose up -d --build
```

## Quick Diagnostics

### Check All Services
```bash
docker-compose ps
```

Expected output - all services "Up":
- radiology-rag-backend
- radiology-rag-frontend
- radiology-db
- radiology-vector-db
- radiology-cache

### Check Backend Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "enabled",
  "vector_db": "connected",
  "gemini_model": "gemini-pro"
}
```

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50 backend
```

### Test API Endpoints
```bash
# List templates
curl http://localhost:8000/templates

# Report history
curl http://localhost:8000/reports/history

# Health check
curl http://localhost:8000/health
```

## Windows-Specific Issues

### Line Endings
If you edit files on Windows and rebuild, you may encounter line ending issues. Configure Git:
```bash
git config --global core.autocrlf false
```

Then re-clone or reset files:
```bash
git checkout -- .
```

### Docker Desktop Resources
Ensure Docker Desktop has sufficient resources:
- **CPUs**: 4+
- **Memory**: 8 GB+
- **Disk**: 60 GB+

Settings → Resources → Apply & Restart

### PowerShell vs CMD
Use PowerShell for best results. Some commands differ:
```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8000/health

# CMD
curl http://localhost:8000/health
```

## Getting Help

1. **Check logs first**: `docker-compose logs backend`
2. **Verify services**: `docker-compose ps`
3. **Test health**: `curl http://localhost:8000/health`
4. **Check the README.md** for setup instructions
5. **See DEPLOYMENT_GUIDE.md** for detailed deployment steps

## Success Checklist

- [ ] All 5 containers running (`docker-compose ps`)
- [ ] Backend health returns "healthy" (`curl http://localhost:8000/health`)
- [ ] Frontend loads at http://localhost:3000
- [ ] Templates dropdown shows 3 options
- [ ] Can generate a report without errors
- [ ] Report displays in formatted text
- [ ] Can copy/download report
