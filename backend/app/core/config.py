"""
Конфигурация приложения КЛГ АСУ ТК.
12-factor: все настройки через ENV.
Разработчик: АО «REFLY»
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000", "http://localhost:8080"]
    
    # Database
    DATABASE_URL: str = "postgresql://klg:klg@localhost:5432/klg"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # MinIO (S3-compatible storage)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "klg-attachments"
    MINIO_SECURE: bool = False
    
    # Auth
    OIDC_ISSUER: str = "http://localhost:8180/realms/klg"
    OIDC_JWKS_URL: str = ""  # auto-derived from issuer if empty
    OIDC_AUDIENCE: str = "account"
    ENABLE_DEV_AUTH: bool = False  # ONLY for development
    DEV_TOKEN: str = "dev"
    # JWT (dev mode — HS256 токены)
    JWT_SECRET: str = ""
    JWT_ALG: str = "HS256"
    allow_hs256_dev_tokens: bool = False
    # Secret key (подпись, сессии)
    SECRET_KEY: str = "change-me-in-production"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Redpanda / RisingWave — optional
    ENABLE_RISINGWAVE: bool = False
    ENABLE_REDPANDA: bool = False
    REDPANDA_BROKERS: str = "localhost:19092"
    REDPANDA_CLIENT_ID: str = "klg-backend"
    RISINGWAVE_URL: str = "postgresql://root:risingwave@localhost:4566/dev"
    
    # Inbox (COD-004)
    INBOX_DATA_DIR: str = "./data"
    INBOX_UPLOAD_MAX_MB: int = 50
    # Хранилище файлов (attachments, storage.py)
    storage_dir: str = "./data/storage"

    # П-ИВ интеграция
    piv_base_url: str = "http://localhost:9090/piv"
    piv_timeout_s: float = 10.0

    # Multi-tenancy
    ENABLE_RLS: bool = True

    # AI (Anthropic Claude)
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    
    @property
    def database_url(self) -> str:
        url = self.DATABASE_URL
        if "asyncpg" in url:
            url = url.replace("postgresql+asyncpg://", "postgresql://")
        return url

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
