"""
Базовый класс для ИИ-агентов юридического анализа.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentResult:
    """Результат работы агента."""
    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None
    agent_name: str = ""


class BaseLegalAgent(ABC):
    """Базовый агент. Все агенты должны уметь вызывать LLM и возвращать структурированный результат."""

    def __init__(self, name: str, llm_client: Any = None):
        self.name = name
        self.llm = llm_client

    def _call_llm(self, system: str, user: str, json_mode: bool = False) -> str | None:
        """Вызов LLM. Поддерживает OpenAI-совместимый API. При отсутствии ключа — заглушка."""
        if self.llm is None:
            return None
        try:
            if hasattr(self.llm, "chat") and callable(self.llm.chat):
                return self.llm.chat(system=system, user=user, json_mode=json_mode)
            return None
        except Exception:
            return None

    @abstractmethod
    def run(self, context: dict[str, Any]) -> AgentResult:
        """Выполнить задачу агента. context: документ, юрисдикция, текст и т.д."""
        pass
