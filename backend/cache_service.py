"""Redis caching service"""
import json
import hashlib
from typing import Optional, Any
import redis
from config import settings

class CacheService:
    def __init__(self):
        self.enabled = settings.CACHE_ENABLED
        if self.enabled:
            try:
                self.redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_DB,
                    decode_responses=True,
                    socket_connect_timeout=0.5,  # Fail fast for Cloud Run deployment
                    socket_timeout=1.0
                )
                # Test connection with short timeout
                self.redis_client.ping()
                print(f"✓ Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
            except Exception as e:
                print(f"⚠ Redis unavailable ({type(e).__name__}). Caching disabled.")
                self.enabled = False
                self.redis_client = None
        else:
            self.redis_client = None
            print("⚠ Caching disabled by configuration")

    def _make_key(self, prefix: str, data: dict) -> str:
        """Generate cache key from data"""
        serialized = json.dumps(data, sort_keys=True)
        hash_value = hashlib.md5(serialized.encode()).hexdigest()
        return f"{prefix}:{hash_value}"

    def get(self, prefix: str, data: dict) -> Optional[Any]:
        """Get cached value"""
        if not self.enabled or not self.redis_client:
            return None

        try:
            key = self._make_key(prefix, data)
            cached = self.redis_client.get(key)
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, prefix: str, data: dict, value: Any, ttl: Optional[int] = None):
        """Set cached value"""
        if not self.enabled or not self.redis_client:
            return

        try:
            key = self._make_key(prefix, data)
            serialized = json.dumps(value)
            ttl = ttl or settings.CACHE_TTL
            self.redis_client.setex(key, ttl, serialized)
        except Exception as e:
            print(f"Cache set error: {e}")

    def clear(self, prefix: Optional[str] = None):
        """Clear cache for a prefix or all"""
        if not self.enabled or not self.redis_client:
            return

        try:
            if prefix:
                pattern = f"{prefix}:*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            else:
                self.redis_client.flushdb()
        except Exception as e:
            print(f"Cache clear error: {e}")

# Global cache instance
cache = CacheService()
