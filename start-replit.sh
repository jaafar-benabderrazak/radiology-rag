#!/bin/bash

echo "🚀 Starting Radiology RAG on Replit..."
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cp .env.example .env 2>/dev/null || cat > .env << 'ENVEOF'
# Replit Environment Configuration
DATABASE_URL=sqlite:///./radiology.db
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=replit_secret_key_change_me_in_production_min_32_chars
ALLOWED_ORIGINS=*
ENVIRONMENT=replit

# Simplified for Replit (no Redis/Qdrant)
REDIS_URL=memory://
QDRANT_URL=memory://
ENVEOF
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${RED}⚠️  Please add your GEMINI_API_KEY to .env or Replit Secrets!${NC}"
fi

# Install backend dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
cd backend
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt

# Initialize database
echo -e "${BLUE}🗄️  Initializing database...${NC}"
python init_db.py || echo "Database already initialized"

# Check if Gemini API key is set
if [ -z "$GEMINI_API_KEY" ] && ! grep -q "GEMINI_API_KEY=.*[A-Za-z0-9]" ../.env; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  WARNING: GEMINI_API_KEY not set!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Get your FREE API key from:"
    echo "👉 https://aistudio.google.com/app/apikey"
    echo ""
    echo "Then add it to Replit Secrets (🔒 icon in left panel):"
    echo "  Key: GEMINI_API_KEY"
    echo "  Value: your_api_key_here"
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

# Start the server
echo ""
echo -e "${GREEN}✅ Starting Radiology RAG Backend...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 API will be available at: https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
echo "📖 API Docs: https://${REPL_SLUG}.${REPL_OWNER}.repl.co/docs"
echo ""
echo "👤 Default credentials:"
echo "   Admin:  admin@radiology.com / admin123"
echo "   Doctor: doctor@hospital.com / doctor123"
echo ""
echo "⚠️  Remember to change default passwords!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start uvicorn
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
