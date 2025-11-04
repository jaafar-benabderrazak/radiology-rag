# Backup & Disaster Recovery System

## Overview

The Backup & Disaster Recovery system provides automated, scheduled backups of the entire Radiology RAG application including database, configuration files, and uploaded documents. This ensures business continuity and data protection in case of hardware failures, data corruption, or disasters.

## Features

### 1. **Automated Backups**
- Full system backups (database + config + files)
- Scheduled daily backups via cron
- Compression (tar.gz) to save space
- Backup metadata tracking

### 2. **Retention Management**
- Configurable retention period (default: 30 days)
- Maximum backup limit (default: 50 backups)
- Automatic cleanup of old backups
- Registry of all backups with metadata

### 3. **Remote Backup Support**
- Copy backups to remote storage (NFS, S3-mounted volumes, etc.)
- Disaster recovery offsite storage
- Configurable remote backup location

### 4. **Restore Capabilities**
- Full system restore from backup
- Selective restore (database only, config only, files only)
- Backup verification without restoring
- Database schema recreation

### 5. **Monitoring & Health Checks**
- API endpoints for backup status
- Health check reporting
- Backup size and count tracking
- Time since last backup monitoring

## What Gets Backed Up

### 1. **PostgreSQL Database** (Full Dump)
- All tables (users, reports, templates, notifications, etc.)
- Indexes and constraints
- Plain SQL format for portability
- Schema and data

### 2. **Configuration Files**
- `.env.example` (template for environment variables)
- `docker-compose.yml` (Docker configuration)
- `requirements.txt` (Python dependencies)
- `backend/config.py` (Application config)

### 3. **Application Files**
- `/backend/templates` (Report templates)
- `/uploads` (User-uploaded files, if any)

**Note:** Actual `.env` file with secrets is NOT backed up for security reasons.

## Setup Instructions

### 1. Configure Environment Variables

Add to your `.env` file or `docker-compose.yml`:

```bash
# Backup Configuration
BACKUP_ENABLED=true
BACKUP_DIR=/app/backups
BACKUP_RETENTION_DAYS=30
MAX_BACKUPS=50

# Database Connection (for pg_dump)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=radiology_db
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Optional: Remote Backup
REMOTE_BACKUP_ENABLED=false
REMOTE_BACKUP_PATH=/mnt/remote_storage/backups
```

### 2. Create Backup Directory

The backup directory should be on a persistent volume:

```yaml
# In docker-compose.yml
services:
  backend:
    volumes:
      - ./backups:/app/backups  # Persistent backup storage
      - ./logs:/app/logs        # For backup logs
```

Or create manually:

```bash
mkdir -p ./backups
mkdir -p ./logs
chmod 755 ./backups ./logs
```

### 3. Install PostgreSQL Client Tools

The backup service requires `pg_dump` and `psql`:

**In Dockerfile:**
```dockerfile
RUN apt-get update && apt-get install -y postgresql-client
```

**Or install in running container:**
```bash
docker exec -it radiology-backend-local apt-get update
docker exec -it radiology-backend-local apt-get install -y postgresql-client
```

### 4. Set Up Scheduled Backups (Cron)

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * docker exec radiology-backend-local python /app/backend/run_backup.py >> /var/log/radiology-backup.log 2>&1

# Or weekly backup on Sundays at 3 AM
0 3 * * 0 docker exec radiology-backend-local python /app/backend/run_backup.py
```

**Alternative: Use systemd timer** (Linux):
```bash
# Create /etc/systemd/system/radiology-backup.service
[Unit]
Description=Radiology RAG Backup Service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker exec radiology-backend-local python /app/backend/run_backup.py

# Create /etc/systemd/system/radiology-backup.timer
[Unit]
Description=Daily Radiology RAG Backup

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target

# Enable timer
sudo systemctl enable radiology-backup.timer
sudo systemctl start radiology-backup.timer
```

## API Endpoints

All backup endpoints require **admin authentication**.

### Create Backup (Async)

```bash
POST /api/backups/create

# Response:
{
  "message": "Backup started in background",
  "status": "processing"
}
```

### Create Backup (Synchronous)

```bash
POST /api/backups/create-sync

# Response:
{
  "message": "Backup created successfully",
  "backup": {
    "success": true,
    "backup_name": "radiology_backup_20250104_143022",
    "archive_path": "/app/backups/radiology_backup_20250104_143022.tar.gz",
    "size_mb": 45.3,
    "metadata": {...}
  }
}
```

### List All Backups

```bash
GET /api/backups/list

# Response:
[
  {
    "backup_name": "radiology_backup_20250104_143022",
    "timestamp": "20250104_143022",
    "datetime": "2025-01-04T14:30:22",
    "archive_path": "/app/backups/radiology_backup_20250104_143022.tar.gz",
    "size_mb": 45.3,
    "database_size_mb": 38.1
  },
  ...
]
```

### Get Backup Info

```bash
GET /api/backups/{backup_name}

# Response:
{
  "backup_name": "radiology_backup_20250104_143022",
  "timestamp": "20250104_143022",
  "datetime": "2025-01-04T14:30:22",
  "archive_path": "/app/backups/radiology_backup_20250104_143022.tar.gz",
  "size_mb": 45.3,
  "database_size_mb": 38.1
}
```

### Delete Backup

```bash
DELETE /api/backups/{backup_name}

# Response:
{
  "message": "Backup radiology_backup_20250104_143022 deleted successfully"
}
```

### Verify Backup

```bash
POST /api/backups/verify/{backup_name}

# Response:
{
  "message": "Backup verification passed",
  "verification": {
    "success": true,
    "backup_name": "radiology_backup_20250104_143022",
    "backup_date": "2025-01-04T14:30:22",
    "total_files": 156,
    "database_backup": true,
    "size_mb": 45.3
  }
}
```

### Restore from Backup

**⚠️ DANGEROUS OPERATION - This will overwrite current data!**

```bash
POST /api/backups/restore

{
  "backup_name": "radiology_backup_20250104_143022",
  "restore_database": true,
  "restore_config": true,
  "restore_files": true,
  "confirm": true  // REQUIRED!
}

# Response:
{
  "message": "Restore started in background",
  "backup_name": "radiology_backup_20250104_143022",
  "backup_date": "2025-01-04T14:30:22",
  "status": "processing",
  "warning": "Application may need to be restarted after restore completes"
}
```

### Health Check

```bash
GET /api/backups/status/health

# Response:
{
  "backup_enabled": true,
  "backup_directory": "/app/backups",
  "total_backups": 15,
  "total_size_mb": 678.5,
  "retention_days": 30,
  "max_backups": 50,
  "most_recent_backup": {
    "backup_name": "radiology_backup_20250104_143022",
    "datetime": "2025-01-04T14:30:22",
    "size_mb": 45.3
  },
  "hours_since_last_backup": 2.5,
  "remote_backup_enabled": false,
  "status": "healthy"
}
```

## Manual Backup/Restore

### Create Manual Backup

```bash
# Via script
docker exec radiology-backend-local python /app/backend/run_backup.py

# Or via Python
docker exec -it radiology-backend-local python
>>> from backup_service import backup_service
>>> result = backup_service.create_full_backup()
>>> print(result)
```

### Manual Restore

```bash
# Via Python
docker exec -it radiology-backend-local python

>>> from restore_service import restore_service
>>> result = restore_service.restore_from_backup(
...     "radiology_backup_20250104_143022",
...     {"restore_database": True, "restore_config": True, "restore_files": True}
... )
>>> print(result)
```

### Verify Backup Manually

```bash
docker exec -it radiology-backend-local python

>>> from restore_service import restore_service
>>> result = restore_service.verify_backup("radiology_backup_20250104_143022")
>>> print(result)
```

## Backup Structure

Each backup is a compressed tar.gz archive with this structure:

```
radiology_backup_20250104_143022.tar.gz
└── radiology_backup_20250104_143022/
    ├── backup_metadata.json          # Backup info
    ├── database_20250104_143022.sql  # PostgreSQL dump
    ├── config/                       # Configuration files
    │   ├── .env.example
    │   ├── docker-compose.yml
    │   ├── requirements.txt
    │   └── backend/
    │       └── config.py
    └── files/                        # Application files
        ├── templates/                # Report templates
        └── uploads/                  # User uploads (if any)
```

### Backup Metadata Format

```json
{
  "backup_name": "radiology_backup_20250104_143022",
  "timestamp": "20250104_143022",
  "datetime": "2025-01-04T14:30:22.123456",
  "database": {
    "success": true,
    "file": "database_20250104_143022.sql",
    "size_mb": 38.1
  },
  "configuration": {
    "success": true,
    "files_count": 4,
    "files": [".env.example", "docker-compose.yml", ...]
  },
  "files": {
    "success": true,
    "directories_count": 2,
    "directories": ["templates", "uploads"]
  },
  "backup_size_mb": 45.3
}
```

## Disaster Recovery Procedures

### Scenario 1: Complete System Failure

**Recovery Steps:**

1. **Set up new infrastructure**
   ```bash
   # Clone repository
   git clone https://github.com/your-org/radiology-rag.git
   cd radiology-rag
   ```

2. **Restore backup files**
   ```bash
   # Copy backups from remote storage
   cp /mnt/remote_storage/backups/*.tar.gz ./backups/
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **List available backups**
   ```bash
   curl -X GET http://localhost:8000/api/backups/list \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **Restore from backup**
   ```bash
   curl -X POST http://localhost:8000/api/backups/restore \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "backup_name": "radiology_backup_20250104_143022",
       "restore_database": true,
       "restore_config": true,
       "restore_files": true,
       "confirm": true
     }'
   ```

6. **Restart services**
   ```bash
   docker-compose restart
   ```

7. **Verify restoration**
   ```bash
   # Check application health
   curl http://localhost:8000/

   # Verify database
   docker exec radiology-postgres psql -U postgres -d radiology_db -c "SELECT COUNT(*) FROM reports;"
   ```

### Scenario 2: Database Corruption

**Recovery Steps:**

1. **Stop application** (to prevent writes)
   ```bash
   docker-compose stop backend
   ```

2. **Verify backup**
   ```bash
   curl -X POST http://localhost:8000/api/backups/verify/{backup_name}
   ```

3. **Restore database only**
   ```bash
   curl -X POST http://localhost:8000/api/backups/restore \
     -d '{
       "backup_name": "...",
       "restore_database": true,
       "restore_config": false,
       "restore_files": false,
       "confirm": true
     }'
   ```

4. **Restart services**
   ```bash
   docker-compose start backend
   ```

### Scenario 3: Accidental Data Deletion

**Recovery Steps:**

1. **Identify affected data** (reports, templates, users, etc.)

2. **Find most recent good backup**
   ```bash
   curl -X GET http://localhost:8000/api/backups/list
   ```

3. **Create current backup** (before restore)
   ```bash
   curl -X POST http://localhost:8000/api/backups/create-sync
   ```

4. **Restore from backup**

5. **Verify data recovery**

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Backup Age**
   - Alert if no backup in last 48 hours
   - Check `hours_since_last_backup` in health endpoint

2. **Backup Size Growth**
   - Track `total_size_mb` trend
   - Alert if growth exceeds expected rate
   - May indicate data issues or needed cleanup

3. **Backup Success Rate**
   - Monitor backup logs for failures
   - Check `/app/logs/backup.log`

4. **Storage Space**
   - Monitor `/app/backups` disk usage
   - Alert if < 20% free space

### Log Monitoring

```bash
# Watch backup logs
tail -f /app/logs/backup.log

# Check for errors
grep ERROR /app/logs/backup.log

# View recent backups
docker exec radiology-backend-local ls -lh /app/backups/
```

## Best Practices

### 1. **Regular Testing**
- Test restore procedure monthly
- Verify backups weekly
- Document recovery time objective (RTO)

### 2. **Offsite Storage**
- Enable remote backup to separate location
- Use cloud storage (S3, Azure Blob, GCS)
- Test offsite backup retrieval

### 3. **Retention Policy**
- Daily backups: Keep 30 days
- Weekly backups: Keep 12 weeks
- Monthly backups: Keep 12 months

### 4. **Security**
- Encrypt backup archives (add encryption layer)
- Restrict backup directory permissions
- Rotate backup encryption keys

### 5. **Documentation**
- Document restore procedures
- Train team on disaster recovery
- Maintain runbook for emergencies

## Troubleshooting

### Backup Fails with "pg_dump not found"

**Solution:**
```bash
docker exec -it radiology-backend-local apt-get update
docker exec -it radiology-backend-local apt-get install -y postgresql-client
```

### Backup Directory Permission Denied

**Solution:**
```bash
chmod 755 ./backups
chown -R 1000:1000 ./backups  # Match Docker user
```

### Restore Hangs on Database

**Cause:** Large database or slow disk I/O

**Solution:**
- Increase timeout in `restore_service.py`
- Use faster storage for backups
- Consider incremental backups for large databases

### Out of Disk Space

**Solution:**
1. Check disk usage: `df -h`
2. Reduce `BACKUP_RETENTION_DAYS`
3. Reduce `MAX_BACKUPS`
4. Enable `REMOTE_BACKUP_ENABLED` and delete local old backups

## Advanced Configuration

### Incremental Backups

For large databases, consider PostgreSQL WAL archiving:

```bash
# In postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /app/backups/wal/%f'
```

### Encrypted Backups

Add encryption to backup archives:

```python
# In backup_service.py, after compression:
import subprocess
subprocess.run([
    'gpg', '--symmetric', '--cipher-algo', 'AES256',
    '--passphrase', os.getenv('BACKUP_ENCRYPTION_KEY'),
    str(archive_path)
])
```

### S3 Remote Backup

```python
import boto3

def _copy_to_s3(self, archive_path: Path):
    s3 = boto3.client('s3')
    bucket = os.getenv('S3_BACKUP_BUCKET')
    s3.upload_file(
        str(archive_path),
        bucket,
        f'radiology-backups/{archive_path.name}'
    )
```

---

**Status**: ✅ Fully Functional
**Version**: 1.0.0
**Last Updated**: 2025-01-04
