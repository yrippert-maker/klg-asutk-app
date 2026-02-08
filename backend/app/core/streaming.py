"""
Инициализация streaming компонентов.
ARC-003: Redpanda/RisingWave отключены по умолчанию — no-op при ENABLE_*=false.
"""

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


async def init_streaming():
    """Инициализация streaming компонентов (no-op при отключённых сервисах)"""
    if settings.ENABLE_REDPANDA:
        try:
            from app.streaming.redpanda import init_redpanda
            await init_redpanda()
            logger.info("Redpanda initialized")
        except Exception as e:
            logger.error("Failed to initialize Redpanda: %s", e)
            raise
    else:
        logger.info("Redpanda disabled (ENABLE_REDPANDA=false)")

    if settings.ENABLE_RISINGWAVE:
        try:
            from app.streaming.risingwave import init_risingwave
            await init_risingwave()
            logger.info("RisingWave initialized")
        except Exception as e:
            logger.error("Failed to initialize RisingWave: %s", e)
            raise
    else:
        logger.info("RisingWave disabled (ENABLE_RISINGWAVE=false)")
