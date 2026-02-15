"""
Клиент LLM для агентов. Использует исключительно Anthropic Claude API через app.services.ai_service.
"""

from typing import Any


def _get_setting(name: str, default: str | None = "") -> str | None:
    import os
    env_key = name.upper()
    try:
        from app.core.config import settings
        v = getattr(settings, name, None)
        if v is not None and v != "":
            return str(v)
        return os.getenv(env_key) or default
    except Exception:
        return os.getenv(env_key) or default


class LLMClient:
    """Унифицированный клиент для вызова LLM (Anthropic Claude)."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None, model: str | None = None):
        self.api_key = (api_key if api_key is not None else _get_setting("ANTHROPIC_API_KEY", "")) or ""
        self.base_url = base_url  # не используется для Anthropic
        self.model = (model or _get_setting("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")) or "claude-sonnet-4-20250514"
        self._client: Any = None

    @property
    def is_available(self) -> bool:
        from app.services.ai_service import _get_client
        return _get_client() is not None

    def chat(self, system: str, user: str, json_mode: bool = False) -> str | None:
        """Один запрос к чату. Возвращает текст ответа или None."""
        from app.services.ai_service import chat
        if not self.is_available:
            return None
        result = chat(prompt=user, system=system, model=self.model, max_tokens=4096)
        if result and json_mode:
            # Claude не имеет response_format; при необходимости постобработка JSON
            pass
        return (result or "").strip() or None


def get_llm_client() -> LLMClient:
    return LLMClient()
