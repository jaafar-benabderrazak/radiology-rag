#!/bin/bash

# Backup Script for Radiology RAG
# Backs up PostgreSQL database and important files

set -e

# Configuration
BACKUP_DIR="/home/radiology/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting backup - $DATE${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo -e "${YELLOW}Backing up PostgreSQL database...${NC}"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U radiology_user radiology_templates | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Backup Qdrant data
echo -e "${YELLOW}Backing up Qdrant vector database...${NC}"
docker-compose -f docker-compose.prod.yml exec -T qdrant tar czf - /qdrant/storage > "$BACKUP_DIR/qdrant_$DATE.tar.gz"

# Backup environment file
echo -e "${YELLOW}Backing up configuration...${NC}"
cp .env.production "$BACKUP_DIR/env_$DATE.backup"

# Backup SSL certificates
if [ -d "certbot/conf" ]; then
    echo -e "${YELLOW}Backing up SSL certificates...${NC}"
    tar czf "$BACKUP_DIR/ssl_$DATE.tar.gz" certbot/
fi

# Delete old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Show backup summary
echo
echo -e "${GREEN}Backup completed successfully!${NC}"
echo "Backup location: $BACKUP_DIR"
echo
ls -lh $BACKUP_DIR | grep $DATE
