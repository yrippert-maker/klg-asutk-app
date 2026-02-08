"""
Конфигурация приложения
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://klg:klg@localhost:5432/klg"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Redpanda / RisingWave — ARC-003: отключены по умолчанию для MVP (optional)
    ENABLE_RISINGWAVE: bool = False
    ENABLE_REDPANDA: bool = False
    REDPANDA_BROKERS: str = "localhost:19092"  # используется только при ENABLE_REDPANDA=true
    REDPANDA_CLIENT_ID: str = "klg-backend"
    RISINGWAVE_URL: str = "postgresql://root:risingwave@localhost:4566/dev"  # при ENABLE_RISINGWAVE=true
    
    # Inbox (COD-004)
    INBOX_DATA_DIR: str = "./data"
    INBOX_UPLOAD_MAX_MB: int = 50
    
    @property
    def database_url(self) -> str:
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://") if "asyncpg" in self.DATABASE_URL else self.DATABASE_URL

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
