import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
<<<<<<< HEAD
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "radiology_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "secure_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "radiology_templates")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "true").lower() == "true"

    @property
    def DATABASE_URL(self) -> str:
        if self.USE_SQLITE:
            return "sqlite:///./radiology_db.sqlite"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
=======
    POSTGRES_USER: str = os.getenv("PGUSER", os.getenv("POSTGRES_USER", "radiology_user"))
    POSTGRES_PASSWORD: str = os.getenv("PGPASSWORD", os.getenv("POSTGRES_PASSWORD", "secure_password"))
    POSTGRES_DB: str = os.getenv("PGDATABASE", os.getenv("POSTGRES_DB", "radiology_templates"))
    POSTGRES_HOST: str = os.getenv("PGHOST", os.getenv("POSTGRES_HOST", "postgres"))
    POSTGRES_PORT: str = os.getenv("PGPORT", os.getenv("POSTGRES_PORT", "5432"))

    @property
    def DATABASE_URL(self) -> str:
        # Priority: Deployment DATABASE_URL > Development DATABASE_URL > SQLite fallback
        # For deployments, check if DATABASE_URL points to a production database
        db_url = os.getenv("DATABASE_URL")
        
        # If DATABASE_URL points to development host 'helium', use SQLite instead
        # This prevents deployment from trying to connect to dev database
        if db_url and "helium" in db_url:
            print("⚠ Development DATABASE_URL detected, using SQLite for local environment")
            return "sqlite:///./radiology_db.sqlite"
        
        # Use DATABASE_URL if available (deployment), otherwise SQLite (local)
        return db_url or "sqlite:///./radiology_db.sqlite"
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))

    # Qdrant
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "radiology_reports")

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    # Using Gemini 2.0 Flash (latest stable model for v1beta API)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

    # Cache settings
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "false").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour

    # Authentication settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-use-openssl-rand-hex-32")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    class Config:
        case_sensitive = True

settings = Settings()
