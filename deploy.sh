#!/bin/bash

# ==============================================
# Radiology RAG - Quick Deploy Script
# ==============================================

set -e

echo "🚀 Radiology RAG - Deployment Script"
echo "===================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env file from .env.production template"
    echo ""
    echo "Run: cp .env.production .env"
    echo "Then edit .env with your configuration"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "📝 Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available!"
    echo "📝 Please install Docker Compose plugin"
    exit 1
fi

echo ""
echo "✅ Prerequisites checked"
echo ""

# Ask for deployment type
echo "Select deployment type:"
echo "1) Development (docker-compose.yml)"
echo "2) Production (docker-compose.prod.yml)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        COMPOSE_FILE="docker-compose.yml"
        echo "📦 Deploying in DEVELOPMENT mode..."
        ;;
    2)
        COMPOSE_FILE="docker-compose.prod.yml"
        echo "🏭 Deploying in PRODUCTION mode..."
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🛑 Stopping existing containers..."
docker compose -f $COMPOSE_FILE down

echo ""
echo "🗑️  Cleaning up old images..."
docker compose -f $COMPOSE_FILE down --rmi local || true

echo ""
echo "🏗️  Building containers..."
docker compose -f $COMPOSE_FILE build --no-cache

echo ""
echo "🚀 Starting containers..."
docker compose -f $COMPOSE_FILE up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "📊 Service Status:"
docker compose -f $COMPOSE_FILE ps

echo ""
echo "🔍 Checking health..."
sleep 5

# Check backend health
if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend health check failed. Checking logs..."
    docker compose -f $COMPOSE_FILE logs backend | tail -20
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "👤 Default credentials:"
echo "   Admin:  admin@radiology.com / admin123"
echo "   Doctor: doctor@hospital.com / doctor123"
echo ""
echo "⚠️  IMPORTANT: Change default passwords immediately!"
echo ""
echo "📝 View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "🛑 Stop:      docker compose -f $COMPOSE_FILE down"
echo ""
