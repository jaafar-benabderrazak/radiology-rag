import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Configuration
    # Priority: SUPABASE_DATABASE_URL > DATABASE_URL > Individual PostgreSQL settings > SQLite fallback

    # Supabase connection string (recommended)
    SUPABASE_DATABASE_URL: str = os.getenv("SUPABASE_DATABASE_URL", "")

    # Generic database URL (alternative)
    DATABASE_URL_OVERRIDE: str = os.getenv("DATABASE_URL", "")

    # Individual PostgreSQL settings (legacy support)
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "radiology_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "secure_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "radiology_templates")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    USE_SQLITE: bool = os.getenv("USE_SQLITE", "true").lower() == "true"

    # Supabase-specific settings
    SUPABASE_POOLER_ENABLED: bool = os.getenv("SUPABASE_POOLER_ENABLED", "false").lower() == "true"
    SUPABASE_POOLER_URL: str = os.getenv("SUPABASE_POOLER_URL", "")

    @property
    def DATABASE_URL(self) -> str:
        """
        Get database URL with the following priority:
        1. SUPABASE_DATABASE_URL (direct Supabase connection)
        2. SUPABASE_POOLER_URL (if pooler is enabled)
        3. DATABASE_URL (generic override)
        4. Constructed PostgreSQL URL from individual settings
        5. SQLite fallback for local development
        """
        # Priority 1: Supabase pooler (for production with connection pooling)
        if self.SUPABASE_POOLER_ENABLED and self.SUPABASE_POOLER_URL:
            return self.SUPABASE_POOLER_URL

        # Priority 2: Direct Supabase connection
        if self.SUPABASE_DATABASE_URL:
            return self.SUPABASE_DATABASE_URL

        # Priority 3: Generic DATABASE_URL override
        if self.DATABASE_URL_OVERRIDE:
            return self.DATABASE_URL_OVERRIDE

        # Priority 4: SQLite for local development
        if self.USE_SQLITE:
            return "sqlite:///./radiology_db.sqlite"

        # Priority 5: Constructed PostgreSQL URL from individual settings
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

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
