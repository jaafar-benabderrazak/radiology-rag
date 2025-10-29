#!/bin/bash
set -e

echo "=========================================="
echo "Radiology RAG System Deployment"
echo "=========================================="

# Stop existing containers
echo ""
echo "1. Stopping existing containers..."
docker-compose down

# Rebuild images
echo ""
echo "2. Building Docker images..."
docker-compose build --no-cache

# Start all services
echo ""
echo "3. Starting all services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "4. Waiting for services to be ready..."
sleep 10

# Show logs
echo ""
echo "5. Checking service status..."
echo ""
docker-compose ps

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo "  - Qdrant UI: http://localhost:6333/dashboard"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop all services:"
echo "  docker-compose down"
echo ""
