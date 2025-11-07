#!/bin/bash
set -e

echo "============================================================"
echo "  Building Radiology RAG for Deployment"
echo "============================================================"

# IMPORTANT: This script uses pip, not uv
# Dependencies are in backend/requirements-minimal.txt (lightweight, ~150MB)

echo ""
echo "Step 1: Installing Python dependencies with pip..."
echo "Using: backend/requirements-minimal.txt"
cd backend

# Force pip installation (not uv)
python -m pip install --no-cache-dir --upgrade pip
python -m pip install --no-cache-dir -r requirements-minimal.txt

echo "✓ Python dependencies installed"
cd ..

# Build frontend
echo ""
echo "Step 2: Building React frontend..."
cd frontend
npm ci --production=false
npm run build
echo "✓ Frontend built to: frontend/dist"
cd ..

echo ""
echo "============================================================"
echo "  Build Complete!"
echo "============================================================"
echo "✓ Backend ready (FastAPI + Uvicorn)"
echo "✓ Frontend ready (React + Vite)"
echo "✓ Deployment size: ~150MB (minimal dependencies)"
echo "============================================================"
