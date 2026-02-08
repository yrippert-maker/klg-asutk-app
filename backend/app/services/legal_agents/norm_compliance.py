"""
Агент проверки соответствия документа нормам законодательства выбранной юрисдикции.
"""

import json
from .base import BaseLegalAgent, AgentResult


class NormComplianceAgent(BaseLegalAgent):
    def __init__(self, llm_client=None):
        super().__init__("NormComplianceAgent", llm_client)

    def run(self, context: dict) -> AgentResult:
        title = context.get("title", "")
        content = (context.get("content") or "")[:8000]
        jurisdiction = context.get("jurisdiction_code", "RU")
        doc_type = context.get("document_type", "other")

        system = (
            "Ты — юрист, проверяющий соответствие документа нормам законодательства указанной юрисдикции. "
            "Верни JSON: {\"compliant\": true|false, \"issues\": [\"...\"], \"recommendations\": [\"...\"], \"summary\": \"...\"}"
        )
        user = f"Юрисдикция: {jurisdiction}, тип документа: {doc_type}\nЗаголовок: {title}\n\nТекст:\n{content[:4000]}"

        out = self._call_llm(system, user, json_mode=True)
        if out:
            try:
                data = json.loads(out)
                return AgentResult(
                    True,
                    {
                        "compliant": bool(data.get("compliant", True)),
                        "issues": data.get("issues") or [],
                        "recommendations": data.get("recommendations") or [],
                        "summary": data.get("summary") or "",
                    },
                    agent_name=self.name,
                )
            except (json.JSONDecodeError, TypeError):
                pass

        return AgentResult(
            True,
            {
                "compliant": True,
                "issues": [],
                "recommendations": ["Рекомендуется провести ручную проверку на соответствие нормам (LLM недоступен)."],
                "summary": "Автоматическая проверка недоступна.",
            },
            agent_name=self.name,
        )
