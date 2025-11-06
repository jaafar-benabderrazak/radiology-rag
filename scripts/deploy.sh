#!/bin/bash

# Deployment Script for Radiology RAG
# This script deploys the application to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Radiology RAG - Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Verify required variables
REQUIRED_VARS=("DOMAIN" "POSTGRES_PASSWORD" "REDIS_PASSWORD" "GEMINI_API_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env.production${NC}"
        exit 1
    fi
done

echo -e "${BLUE}Domain:${NC} $DOMAIN"
echo -e "${BLUE}Deployment Mode:${NC} Production"
echo

# Pull latest code
echo -e "${YELLOW}Step 1/6: Pulling latest code...${NC}"
git pull origin claude/setup-radiology-docker-services-011CUbfwqGA7BmujzTVkH5rG

# Build images
echo
echo -e "${YELLOW}Step 2/6: Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
echo
echo -e "${YELLOW}Step 3/6: Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Start services
echo
echo -e "${YELLOW}Step 4/6: Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo
echo -e "${YELLOW}Step 5/6: Waiting for services to be healthy...${NC}"
echo "This may take a few minutes..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))

    # Check if postgres is healthy
    if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "healthy"; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi

    echo "Waiting for PostgreSQL... ($attempt/$max_attempts)"
    sleep 5
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ Services failed to start in time${NC}"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Initialize database
echo
echo -e "${YELLOW}Step 6/6: Initializing database...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend python init_db.py

# Check service health
echo
echo -e "${BLUE}Checking service health...${NC}"
services=("postgres" "redis" "qdrant" "backend" "frontend" "nginx")

for service in "${services[@]}"; do
    if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then
        echo -e "${GREEN}✓ $service${NC}"
    else
        echo -e "${RED}✗ $service${NC}"
    fi
done

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "Frontend: ${GREEN}https://$DOMAIN${NC}"
echo -e "API Docs: ${GREEN}https://$DOMAIN/docs${NC}"
echo -e "API Health: ${GREEN}https://$DOMAIN/health${NC}"
echo
echo -e "${YELLOW}Default Credentials:${NC}"
echo "Admin: admin@radiology.com / admin123"
echo "Doctor: doctor@hospital.com / doctor123"
echo
echo -e "${RED}⚠️  IMPORTANT: Change default passwords immediately!${NC}"
echo
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "Stop services: docker-compose -f docker-compose.prod.yml down"
