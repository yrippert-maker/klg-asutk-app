"""
Клиент LLM для агентов. Поддерживает OpenAI API и локальные OpenAI-совместимые endpoints.
"""

import os
from typing import Any

try:
    from openai import OpenAI
    _HAS_OPENAI = True
except ImportError:
    _HAS_OPENAI = False


def _get_setting(name: str, default: str | None = "") -> str | None:
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
    """Унифицированный клиент для вызова LLM (OpenAI-совместимый)."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None, model: str | None = None):
        self.api_key = (api_key if api_key is not None else _get_setting("openai_api_key", "")) or ""
        self.base_url = base_url if base_url is not None else _get_setting("openai_base_url", None)
        self.model = (model or _get_setting("legal_llm_model", "gpt-4o-mini")) or "gpt-4o-mini"
        self._client: Any = None
        if _HAS_OPENAI and self.api_key:
            kw: dict[str, Any] = {"api_key": self.api_key}
            if self.base_url:
                kw["base_url"] = self.base_url
            self._client = OpenAI(**kw)

    @property
    def is_available(self) -> bool:
        return _HAS_OPENAI and bool(self.api_key) and self._client is not None

    def chat(self, system: str, user: str, json_mode: bool = False) -> str | None:
        """Один запрос к чату. Возвращает текст ответа или None."""
        if not self.is_available:
            return None
        try:
            kwargs: dict[str, Any] = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            r = self._client.chat.completions.create(**kwargs)
            return (r.choices[0].message.content or "").strip() or None
        except Exception:
            return None


def get_llm_client() -> LLMClient:
    return LLMClient()
