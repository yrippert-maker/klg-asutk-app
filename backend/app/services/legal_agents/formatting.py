"""
Агент форматирования документа по требованиям юрисдикции (структура, оформление, стиль).
"""

import json
from .base import BaseLegalAgent, AgentResult


class FormattingAgent(BaseLegalAgent):
    def __init__(self, llm_client=None):
        super().__init__("FormattingAgent", llm_client)

    def run(self, context: dict) -> AgentResult:
        content = (context.get("content") or "")[:6000]
        jurisdiction = context.get("jurisdiction_code", "RU")
        doc_type = context.get("document_type", "other")

        system = (
            "Ты — эксперт по оформлению юридических документов. Дай рекомендации по структуре и стилю. "
            "Верни JSON: {\"structure_ok\": true|false, \"suggestions\": [\"...\"], \"required_sections\": [\"...\"], \"style_notes\": \"...\"}"
        )
        user = f"Юрисдикция: {jurisdiction}, тип: {doc_type}\n\nТекст:\n{content[:3500]}"

        out = self._call_llm(system, user, json_mode=True)
        if out:
            try:
                data = json.loads(out)
                return AgentResult(
                    True,
                    {
                        "structure_ok": bool(data.get("structure_ok", True)),
                        "suggestions": data.get("suggestions") or [],
                        "required_sections": data.get("required_sections") or [],
                        "style_notes": data.get("style_notes") or "",
                    },
                    agent_name=self.name,
                )
            except (json.JSONDecodeError, TypeError):
                pass

        return AgentResult(
            True,
            {
                "structure_ok": True,
                "suggestions": ["Провести ручную выверку оформления по ГОСТ/локальным правилам."],
                "required_sections": ["преамбула", "основная часть", "заключительные положения"],
                "style_notes": "Рекомендации недоступны (LLM отключён).",
            },
            agent_name=self.name,
        )
