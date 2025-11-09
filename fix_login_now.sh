#!/bin/bash
# Quick script to fix login passwords immediately

echo "=================================="
echo "Fixing Login Passwords"
echo "=================================="
echo ""

# Check if backend dependencies are installed
echo "Checking dependencies..."
cd backend

# Install dependencies if needed
if ! python -c "import pydantic_settings" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -q -r requirements.txt
fi

echo ""
echo "Running init_db.py to fix passwords..."
echo ""

# Run init_db to fix passwords
python init_db.py

echo ""
echo "=================================="
echo "✓ Password fix complete!"
echo "=================================="
echo ""
echo "You can now login with:"
echo "  Admin:  admin@radiology.com / admin123"
echo "  Doctor: doctor@hospital.com / doctor123"
echo ""
echo "Press the RUN button in Replit to start the application"
echo ""
