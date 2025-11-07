#!/bin/bash
set -e

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

# Check for required environment variables
echo ""
echo "1. Checking environment variables..."
if [ -z "$GEMINI_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
    print_error "GEMINI_API_KEY or GOOGLE_API_KEY not set!"
    echo ""
    echo "  Please add your Gemini API key to Replit Secrets:"
    echo "  1. Click the 'Secrets' icon (🔒) in the left sidebar"
    echo "  2. Add key: GEMINI_API_KEY"
    echo "  3. Add value: your_api_key_here"
    echo "  4. Restart the Repl"
    echo ""
    exit 1
fi
print_success "API key configured"

# Install Python dependencies
echo ""
echo "2. Installing Python dependencies..."
cd backend
if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
    print_success "Python dependencies installed"
else
    print_error "requirements.txt not found"
    exit 1
fi
cd ..

# Install Node.js dependencies and build frontend
echo ""
echo "3. Building frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies (first time only)..."
    npm install --silent
fi

echo "  Building React application..."
npm run build --silent

if [ -d "dist" ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Initialize database
echo ""
echo "4. Initializing database..."
cd backend
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine); print('Database initialized')"
print_success "Database ready"

# Start the backend server (which now serves the frontend)
echo ""
echo "======================================================================"
echo "  Starting server..."
echo "======================================================================"
echo ""
print_success "Server starting on port 8000"
print_success "Frontend and API available at: https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
echo ""
echo "  Access from any device using the URL above"
echo "  Frontend routes: /, /reports, /templates, etc."
echo "  API routes: /api/*, /generate, /templates, etc."
echo ""
echo "======================================================================"

# Start uvicorn
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
