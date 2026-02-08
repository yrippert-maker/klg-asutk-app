"""
Redpanda интеграция. ARC-003: при ENABLE_REDPANDA=false — заглушка.
"""

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

producer = None


async def init_redpanda():
    """Инициализация Redpanda (только при ENABLE_REDPANDA=true)"""
    global producer
    if not settings.ENABLE_REDPANDA:
        raise NotImplementedError("Redpanda отключён для MVP. Установите ENABLE_REDPANDA=true для использования.")
    from aiokafka import AIOKafkaProducer
    import json as _json
    brokers = settings.REDPANDA_BROKERS.split(",")
    producer = AIOKafkaProducer(
        bootstrap_servers=brokers,
        client_id=settings.REDPANDA_CLIENT_ID,
    )
    await producer.start()
    logger.info("Redpanda producer connected to %s", brokers)


async def publish_event(topic: str, event: dict, key: str | None = None):
    """Публикация события в Redpanda"""
    if not settings.ENABLE_REDPANDA:
        raise NotImplementedError("Redpanda отключён для MVP.")
    if not producer:
        await init_redpanda()
    import json
    value = json.dumps(event).encode("utf-8")
    key_bytes = key.encode("utf-8") if key else None
    await producer.send_and_wait(topic, value, key=key_bytes)
    logger.info("Event published to %s", topic)


async def get_producer():
    """Получение producer"""
    if not settings.ENABLE_REDPANDA:
        raise NotImplementedError("Redpanda отключён для MVP.")
    if not producer:
        await init_redpanda()
    return producer
