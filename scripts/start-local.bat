@echo off
REM Local Development Startup Script for Windows
REM This script starts all services for local development

echo ========================================
echo Radiology RAG - Local Development
echo ========================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local from template...
    copy .env.local.example .env.local
    echo.
    echo WARNING: Please edit .env.local and add your GEMINI_API_KEY
    echo Get your API key from: https://makersuite.google.com/app/apikey
    echo.
    pause
)

REM Stop any existing containers
echo Stopping existing containers...
docker-compose -f docker-compose.local.yml down 2>nul

REM Start services
echo Starting all services...
docker-compose -f docker-compose.local.yml up -d

REM Wait for database
echo.
echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

REM Initialize database
echo.
echo Initializing database...
docker-compose -f docker-compose.local.yml exec -T backend python init_db.py

REM Show service status
echo.
echo Service Status:
docker-compose -f docker-compose.local.yml ps

REM Show URLs
echo.
echo ========================================
echo Development environment is ready!
echo ========================================
echo.
echo Access your application:
echo   Frontend:      http://localhost:3000
echo   Backend API:   http://localhost:8000
echo   API Docs:      http://localhost:8000/docs
echo   Qdrant UI:     http://localhost:6333/dashboard
echo.
echo Default Credentials:
echo   Admin:  admin@radiology.com / admin123
echo   Doctor: doctor@hospital.com / doctor123
echo.
echo WARNING: Remember to change these passwords!
echo.
echo Useful Commands:
echo   View logs:    docker-compose -f docker-compose.local.yml logs -f
echo   Stop all:     docker-compose -f docker-compose.local.yml down
echo   Restart:      docker-compose -f docker-compose.local.yml restart
echo.
echo Happy coding!
pause
