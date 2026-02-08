"""
Агент классификации типа документа (законодательный, рекомендательный, директивный, уведомительный и т.д.).
"""

import json
from .base import BaseLegalAgent, AgentResult


class DocumentClassifierAgent(BaseLegalAgent):
    def __init__(self, llm_client=None):
        super().__init__("DocumentClassifierAgent", llm_client)

    def run(self, context: dict) -> AgentResult:
        title = context.get("title", "")
        content = (context.get("content") or "")[:8000]
        jurisdiction = context.get("jurisdiction_code", "")

        system = (
            "Ты — эксперт по классификации юридических документов. "
            "Определи тип: legislative, recommendatory, directive, notification, regulatory, contractual, judicial, other. "
            "Верни JSON: {\"document_type\": \"...\", \"confidence\": 0.0-1.0, \"reasoning\": \"...\"}"
        )
        user = f"Юрисдикция: {jurisdiction}\nЗаголовок: {title}\n\nТекст (фрагмент):\n{content[:4000]}"

        out = self._call_llm(system, user, json_mode=True)
        if out:
            try:
                data = json.loads(out)
                dt = data.get("document_type", "other")
                if dt not in ("legislative", "recommendatory", "directive", "notification", "regulatory", "contractual", "judicial", "other"):
                    dt = "other"
                return AgentResult(True, {"document_type": dt, "confidence": float(data.get("confidence", 0.5)), "reasoning": data.get("reasoning", "")}, agent_name=self.name)
            except (json.JSONDecodeError, TypeError):
                pass

        # Заглушка: эвристика по заголовку
        t = (title + " " + content[:500]).lower()
        if "закон" in t or "кодекс" in t or " federal act" in t or "law" in t:
            dt = "legislative"
        elif "рекоменда" in t or "recommendation" in t or "руководство" in t:
            dt = "recommendatory"
        elif "директив" in t or "directive" in t or "приказ" in t:
            dt = "directive"
        elif "уведом" in t or "notification" in t or "информ" in t:
            dt = "notification"
        elif "постановление" in t or "распоряжение" in t or "regulation" in t:
            dt = "regulatory"
        elif "договор" in t or "contract" in t:
            dt = "contractual"
        elif "решение" in t and ("суд" in t or "court" in t):
            dt = "judicial"
        else:
            dt = "other"
        return AgentResult(True, {"document_type": dt, "confidence": 0.5, "reasoning": "Эвристика по ключевым словам (LLM недоступен)"}, agent_name=self.name)
