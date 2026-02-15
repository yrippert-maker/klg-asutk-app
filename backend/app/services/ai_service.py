"""
AI-сервис КЛГ АСУ ТК — использует исключительно Anthropic Claude API.
Все AI-функции системы проходят через этот модуль.
"""
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

# Ленивая инициализация клиента
_client = None


def _get_client():
    """Получить или создать клиент Anthropic."""
    global _client
    if _client is None:
        try:
            from anthropic import Anthropic
            api_key = os.getenv("ANTHROPIC_API_KEY", "")
            if not api_key:
                logger.warning("ANTHROPIC_API_KEY не задан. AI-функции недоступны.")
                return None
            _client = Anthropic(api_key=api_key)
        except ImportError:
            logger.warning("Пакет anthropic не установлен. pip install anthropic")
            return None
    return _client


def chat(
    prompt: str,
    system: str = "Ты — AI-ассистент системы КЛГ АСУ ТК (контроль лётной годности). Отвечай на русском языке, точно и по делу.",
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 2048,
    temperature: float = 0.3,
) -> str | None:
    """
    Отправить запрос к Claude и получить текстовый ответ.

    Args:
        prompt: Текст запроса пользователя
        system: Системный промпт (контекст роли)
        model: Модель Claude (claude-sonnet-4-20250514, claude-haiku-4-5-20251001 и т.д.)
        max_tokens: Максимум токенов в ответе
        temperature: Температура генерации (0.0–1.0)

    Returns:
        Текст ответа или None при ошибке
    """
    client = _get_client()
    if client is None:
        return None

    try:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
        # Извлечь текст из ответа
        text_blocks = [block.text for block in response.content if block.type == "text"]
        return "\n".join(text_blocks) if text_blocks else None

    except Exception as e:
        logger.error("Anthropic API error: %s", e)
        return None


def chat_with_history(
    messages: list[dict[str, str]],
    system: str = "Ты — AI-ассистент системы КЛГ АСУ ТК.",
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 2048,
) -> str | None:
    """
    Отправить беседу с историей к Claude.

    Args:
        messages: Список сообщений [{"role": "user"|"assistant", "content": "..."}]
        system: Системный промпт
        model: Модель Claude
        max_tokens: Максимум токенов

    Returns:
        Текст ответа или None
    """
    client = _get_client()
    if client is None:
        return None

    try:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        text_blocks = [block.text for block in response.content if block.type == "text"]
        return "\n".join(text_blocks) if text_blocks else None

    except Exception as e:
        logger.error("Anthropic API error: %s", e)
        return None


def analyze_document(
    text: str,
    task: str = "summarize",
) -> str | None:
    """
    Анализ документа с помощью Claude.

    Args:
        text: Текст документа
        task: Задача — summarize | extract_risks | classify | translate

    Returns:
        Результат анализа или None
    """
    tasks = {
        "summarize": "Сделай краткое резюме следующего документа на русском языке:",
        "extract_risks": "Извлеки все риски и несоответствия из следующего документа. Формат: список с описанием и уровнем критичности (low/medium/high/critical):",
        "classify": "Классифицируй следующий документ по типу (директива ЛГ, сервисный бюллетень, программа ТО, акт проверки, сертификат, иное). Укажи тип и краткое обоснование:",
        "translate": "Переведи следующий документ на русский язык, сохраняя техническую терминологию авиации:",
    }
    system_prompt = tasks.get(task, tasks["summarize"])
    return chat(prompt=text[:50000], system=system_prompt, max_tokens=4096)


# ─── Совместимость: если где-то вызывался openai ─────────────
# Алиасы для обратной совместимости
def complete(prompt: str, **kwargs) -> str | None:
    """Алиас для chat() — замена openai.Completion."""
    return chat(prompt=prompt, **kwargs)
