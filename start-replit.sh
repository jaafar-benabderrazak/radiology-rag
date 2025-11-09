#!/bin/bash

echo "======================================================================"
echo "  Radiology RAG - Replit Deployment Startup"
echo "======================================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Check for required environment variables (optional - continue without API key for now)
echo ""
echo "1. Checking environment variables..."
if [ -z "$GEMINI_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
    print_warning "GEMINI_API_KEY or GOOGLE_API_KEY not set"
    print_warning "AI features will be limited without an API key"
else
    print_success "API key configured"
fi

# Note: Package installation is handled by Replit's build step
# During deployment, the build command already runs:
# - pip install -r backend/requirements-deploy.txt
# - cd frontend && npm install && npm run build

cd backend

# Find Python executable (Replit manages this)
if [ -f "../.pythonlibs/bin/python" ]; then
    PYTHON_BIN="../.pythonlibs/bin/python"
    print_success "Using Replit Python: $PYTHON_BIN"
else
    PYTHON_BIN="python3"
    print_success "Using system Python: $PYTHON_BIN"
fi

# Skip database initialization in production - let the app handle it on startup
# This avoids startup delays and schema migration issues
echo ""
echo "2. Database will be initialized on first request"
print_success "Database initialization deferred to app startup"

# Start the backend server (which now serves the frontend)
echo ""
echo "======================================================================"
echo "  Starting server..."
echo "======================================================================"
echo ""
print_success "Server starting on port 5000"

# Show access URL based on environment
if [ -n "$REPL_SLUG" ] && [ -n "$REPL_OWNER" ]; then
    print_success "Frontend and API available at: https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
else
    print_success "Running locally on: http://localhost:5000"
fi

echo ""
echo "  Access from any device using the URL above"
echo "  Frontend routes: /, /reports, /templates, etc."
echo "  API routes: /api/*, /generate, /templates, etc."
echo ""
echo "======================================================================"

# Start uvicorn (use the same Python executable)
# IMPORTANT: Port 5000 is required for Replit Cloud Run deployment (first localPort in .replit)
exec $PYTHON_BIN -m uvicorn main:app --host 0.0.0.0 --port 5000
