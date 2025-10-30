# Database Migration Guide

## Quick Fix Without Losing Data (Recommended)

Run this command to add the missing columns to your existing database:

```bash
# Apply the migration SQL script
docker compose exec postgres psql -U radiology_user -d radiology_templates -f /tmp/migrate_db.sql
```

Wait, we need to copy the SQL file into the container first. Use this complete command:

```bash
# Navigate to your project directory
cd ~/radiology-rag

# Copy the migration script to the container
docker compose cp backend/migrate_db.sql postgres:/tmp/migrate_db.sql

# Apply the migration
docker compose exec postgres psql -U radiology_user -d radiology_templates -f /tmp/migrate_db.sql

# Restart the backend to clear any cached connections
docker compose restart backend
```

### Verify the Migration

Check if the columns were added:

```bash
docker compose exec postgres psql -U radiology_user -d radiology_templates -c "\d reports"
```

You should see `ai_conclusion`, `report_language`, and `updated_at` columns in the output.

## Alternative: Full Rebuild (Data Loss)

⚠️ **WARNING**: This will delete all your existing reports and templates!

If the migration above doesn't work, or if you're okay with starting fresh:

```bash
# Stop and remove all containers and volumes
docker compose down -v

# Rebuild the backend
docker compose build backend

# Start all services
docker compose up -d

# Wait for initialization
sleep 30

# Check status
docker compose ps
```

## Troubleshooting

### If migration fails with "permission denied"

Try running the SQL directly:

```bash
docker compose exec postgres psql -U radiology_user -d radiology_templates << 'EOF'
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_conclusion TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_language VARCHAR(10);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
UPDATE reports SET updated_at = created_at WHERE updated_at IS NULL;
EOF
```

### Check current database schema

```bash
docker compose exec postgres psql -U radiology_user -d radiology_templates -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'reports' ORDER BY ordinal_position;"
```

### If you still see errors after migration

Restart the backend service:

```bash
docker compose restart backend
docker compose logs -f backend
```

The backend might have cached the old schema. Restarting forces it to reload.

## After Migration

Once the migration is complete:

1. Test report generation
2. Verify downloads work (Word, PDF)
3. Test AI summary generation
4. Test report validation

All features should now work without the "ID de rapport non disponible" error.
