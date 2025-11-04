#!/bin/bash

# Local Development Startup Script
# This script starts all services for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Radiology RAG - Local Development${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local from template...${NC}"
    cp .env.local.example .env.local
    echo -e "${RED}⚠️  Please edit .env.local and add your GEMINI_API_KEY${NC}"
    echo -e "${YELLOW}Get your API key from: https://makersuite.google.com/app/apikey${NC}"
    echo
    read -p "Press Enter after you've added your API key to .env.local..."
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your-gemini-api-key-here" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY is not set in .env.local${NC}"
    echo -e "${YELLOW}Get your API key from: https://makersuite.google.com/app/apikey${NC}"
    exit 1
fi

echo -e "${BLUE}Starting services...${NC}"
echo

# Stop any existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

# Start services
echo -e "${YELLOW}Starting all services...${NC}"
docker-compose -f docker-compose.local.yml up -d

# Wait for database to be ready
echo
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if database is healthy
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))

    if docker-compose -f docker-compose.local.yml ps postgres | grep -q "healthy"; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi

    echo "Waiting for PostgreSQL... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ PostgreSQL failed to start${NC}"
    docker-compose -f docker-compose.local.yml logs postgres
    exit 1
fi

# Initialize database
echo
echo -e "${YELLOW}Initializing database...${NC}"
docker-compose -f docker-compose.local.yml exec -T backend python init_db.py

# Show service status
echo
echo -e "${BLUE}Service Status:${NC}"
docker-compose -f docker-compose.local.yml ps

# Show URLs
echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Development environment is ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${BLUE}Access your application:${NC}"
echo -e "  Frontend:      ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend API:   ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:      ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  Qdrant UI:     ${GREEN}http://localhost:6333/dashboard${NC}"
echo
echo -e "${YELLOW}Default Credentials:${NC}"
echo "  Admin:  admin@radiology.com / admin123"
echo "  Doctor: doctor@hospital.com / doctor123"
echo
echo -e "${RED}⚠️  Remember to change these passwords!${NC}"
echo
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:    docker-compose -f docker-compose.local.yml logs -f"
echo "  Stop all:     docker-compose -f docker-compose.local.yml down"
echo "  Restart:      docker-compose -f docker-compose.local.yml restart"
echo "  Clean all:    docker-compose -f docker-compose.local.yml down -v"
echo
echo -e "${GREEN}Happy coding! 🚀${NC}"
