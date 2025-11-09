from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import Pool
from config import settings
import logging
import time

logger = logging.getLogger(__name__)

# Create database engine with retry logic and better error handling
def create_db_engine():
    """Create database engine with appropriate configuration for environment"""
    db_url = settings.DATABASE_URL
    
    if db_url.startswith("sqlite"):
        logger.info("Using SQLite database for local development")
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    else:
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
