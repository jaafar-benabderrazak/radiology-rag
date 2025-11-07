#!/bin/bash
set -e

echo "Building Radiology RAG for deployment..."

# Install minimal Python dependencies for Cloud Run (avoids 8GB limit)
echo "Installing minimal Python dependencies..."
cd backend
pip install -q -r requirements-minimal.txt
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build complete!"
