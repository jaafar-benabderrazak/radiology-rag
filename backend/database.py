from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import Pool, NullPool
from config import settings
import logging
import time
import os

logger = logging.getLogger(__name__)

# Create database engine with retry logic and better error handling
def create_db_engine():
    """Create database engine with appropriate configuration for environment"""
    db_url = settings.DATABASE_URL

    # Detect if using Supabase
    is_supabase = "supabase.co" in db_url
    is_supabase_pooler = settings.SUPABASE_POOLER_ENABLED

    if db_url.startswith("sqlite"):
        logger.info("Using SQLite database for local development")
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    elif is_supabase:
        # Supabase-specific configuration
        logger.info(f"Using Supabase PostgreSQL database: {db_url.split('@')[1] if '@' in db_url else 'unknown'}")

        if is_supabase_pooler:
            # Using Supabase connection pooler (transaction mode)
            # https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
            logger.info("Using Supabase Connection Pooler (PgBouncer in transaction mode)")
            return create_engine(
                db_url,
                poolclass=NullPool,  # Don't pool connections - let PgBouncer handle it
                connect_args={
                    "connect_timeout": 10,
                    "options": "-c statement_timeout=30000"
                }
            )
        else:
            # Direct Supabase connection (session mode)
            logger.info("Using direct Supabase connection with SQLAlchemy pooling")
            return create_engine(
                db_url,
                pool_pre_ping=True,           # Verify connections before using
                pool_size=10,                 # Pool size (Supabase free tier supports ~60 connections)
                max_overflow=20,              # Allow up to 30 total connections
                pool_recycle=300,             # Recycle connections every 5 minutes (Supabase timeout)
                pool_timeout=30,              # Wait 30s for a connection from pool
                connect_args={
                    "connect_timeout": 10,
                    "options": "-c statement_timeout=30000"
                }
            )
    else:
        # Generic PostgreSQL configuration
        logger.info(f"Using PostgreSQL database: {db_url.split('@')[1] if '@' in db_url else 'unknown'}")
        return create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=3600,
            connect_args={
                "connect_timeout": 10,
                "options": "-c statement_timeout=30000"
            }
        )

# Add connection retry logic
@event.listens_for(Pool, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Set SQLite pragmas for better performance"""
    if hasattr(dbapi_conn, 'execute'):
        try:
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()
        except Exception:
            pass

try:
    engine = create_db_engine()
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    logger.warning("Falling back to SQLite database")
    engine = create_engine(
        "sqlite:///./radiology_db.sqlite",
        connect_args={"check_same_thread": False}
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
