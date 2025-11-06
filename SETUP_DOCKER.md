# Docker Setup Instructions

## Database Schema Update Required

The application has been updated with new database columns (`ai_conclusion`, `report_language`, `updated_at`). You need to rebuild the database to apply these changes.

## Quick Fix (Recommended)

Run these commands in your terminal:

```bash
# Stop all containers and remove volumes (this will delete all data)
docker compose down -v

# Rebuild the backend container with updated dependencies
docker compose build backend

# Start all services
docker compose up -d

# Wait for services to be ready (30-60 seconds)
sleep 30

# Check backend logs to ensure it started correctly
docker compose logs backend

# Check if all services are running
docker compose ps
```

## What This Does

1. **`docker compose down -v`**: Stops all containers and removes volumes
   - **WARNING**: This deletes all existing reports and templates from the database
   - The `-v` flag is necessary to remove the old database schema

2. **`docker compose build backend`**: Rebuilds the backend container
   - Ensures all Python dependencies are up to date
   - Applies the latest code changes

3. **`docker compose up -d`**: Starts all services in detached mode
   - PostgreSQL will create a fresh database with the new schema
   - Backend will automatically create all tables with the updated columns

4. **`sleep 30`**: Waits for services to initialize
   - Database needs time to start and accept connections
   - Backend needs time to connect and create tables

## Verify Installation

### 1. Check Service Status

```bash
docker compose ps
```

All services should show "Up" status:
- radiology-rag-backend
- radiology-rag-frontend
- radiology-db
- radiology-vector-db
- radiology-cache

### 2. Check Backend Logs

```bash
docker compose logs backend | tail -50
```

Look for:
- ✅ "Application startup complete"
- ✅ Database connection successful
- ❌ No errors about missing columns

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Test the Application

1. Go to http://localhost:3000
2. Select language (Français or English) in the header
3. Enter a clinical indication (or use voice input 🎤)
4. Click "Generate Report" / "Générer le Rapport"
5. Verify the report is generated successfully
6. Test AI Analysis tools:
   - Generate Summary / Générer un Résumé
   - Validate Report / Valider le Rapport
7. Test downloads (Word, PDF)

## New Features

### Language Selection
- **Default Language**: French (can be changed in header)
- **Supported Languages**: English, French
- **Auto-save**: Language preference saved in browser localStorage
- **Voice Recognition**: Automatically matches selected language
  - French: Uses `fr-FR` voice recognition
  - English: Uses `en-US` voice recognition

### Multilingual UI
All UI labels are now translated:
- Header and titles
- Form labels
- Button text
- Help messages
- Error messages
- AI analysis results

### Enhanced Voice Input
- **Better French Recognition**: Voice recognition now defaults to French
- **Language-Aware**: Recognition language updates when UI language changes
- **Localized Messages**: All voice-related messages in selected language

## Troubleshooting

### Issue: Backend keeps restarting

```bash
# Check backend logs for errors
docker compose logs backend

# Common fixes:
# 1. Missing environment variables
cat .env  # Verify GEMINI_API_KEY is set

# 2. Port conflict
lsof -i :8000  # Check if port 8000 is in use
docker compose down  # Stop services
docker compose up -d  # Restart

# 3. Database connection issues
docker compose logs postgres  # Check database logs
```

### Issue: Frontend can't connect to backend

```bash
# Verify backend is running
curl http://localhost:8000/health

# Check network connectivity
docker compose exec frontend ping backend

# Restart frontend
docker compose restart frontend
```

### Issue: Voice input not working

- **Browser Support**: Use Chrome, Edge, or Safari (Firefox not supported)
- **Permissions**: Allow microphone access in browser settings
- **HTTPS Required**: Voice API requires HTTPS (localhost is exempt)
- **Language Mismatch**: Ensure selected language matches your speech

### Issue: Templates not loading

```bash
# Check if templates directory is mounted
docker compose exec backend ls -la /app/templates

# Reload templates
docker compose restart backend

# Check backend logs
docker compose logs backend | grep -i template
```

### Issue: PDF export failing

```bash
# Verify LibreOffice is installed in container
docker compose exec backend which soffice

# Rebuild backend with LibreOffice
docker compose build backend --no-cache
docker compose up -d backend
```

## Preserving Data (Optional)

If you want to preserve existing data before rebuilding:

### Backup Database

```bash
# Export database
docker compose exec postgres pg_dump -U radiology_user radiology_templates > backup.sql

# After rebuild, restore database
docker compose exec -T postgres psql -U radiology_user radiology_templates < backup.sql
```

### Backup Templates

```bash
# Copy templates from container
docker compose cp backend:/app/templates ./templates_backup

# After rebuild, copy back
docker compose cp ./templates_backup/. backend:/app/templates
```

## Environment Variables

Ensure your `.env` file contains:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=models/gemini-2.0-flash

# Database
POSTGRES_USER=radiology_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=radiology_templates
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
CACHE_ENABLED=true
CACHE_TTL=3600

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION=radiology_reports
```

## Next Steps

After successful setup:

1. ✅ Test report generation with both languages
2. ✅ Test voice input in French and English
3. ✅ Test AI summaries and validation
4. ✅ Test Word/PDF downloads
5. ✅ Add custom templates in `templates/` directory
6. ✅ Configure settings as needed

## Getting Help

If you encounter issues:

1. Check logs: `docker compose logs`
2. Verify environment: `docker compose config`
3. Restart services: `docker compose restart`
4. Full rebuild: `docker compose down -v && docker compose up --build -d`

---

**Note**: The `-v` flag in `docker compose down -v` will delete all data. Back up important data before running this command.
