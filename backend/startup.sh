#!/bin/bash
set -e

echo "====================================="
echo "Starting Radiology RAG Backend"
echo "====================================="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until python -c "import psycopg2; psycopg2.connect(host='postgres', user='radiology_user', password='secure_password', dbname='radiology_templates')" 2>/dev/null; do
  echo "  PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✓ PostgreSQL is ready"

# Initialize database
echo "Initializing database..."
python init_db.py

# Start the application
echo "Starting Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
