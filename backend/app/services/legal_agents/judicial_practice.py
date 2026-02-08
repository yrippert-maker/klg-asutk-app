"""
Агент подбора судебной практики по теме документа.
"""

import json
from .base import BaseLegalAgent, AgentResult


class JudicialPracticeAgent(BaseLegalAgent):
    """Подбирает релевантную судебную практику. Ожидает practice_candidates из БД в context."""

    def __init__(self, llm_client=None):
        super().__init__("JudicialPracticeAgent", llm_client)

    def run(self, context: dict) -> AgentResult:
        content = (context.get("content") or "")[:4000]
        title = context.get("title", "")
        candidates = context.get("practice_candidates") or []

        if not candidates:
            return AgentResult(True, {"selected_ids": [], "relevance_summary": ""}, agent_name=self.name)

        system = (
            "Ты — юрист. Выбери из перечня судебных решений те, что релевантны документу. "
            "Верни JSON: {\"selected_ids\": [\"id1\", \"id2\"], \"relevance_summary\": \"кратко, почему они применимы\"}"
        )
        docs = "\n---\n".join(
            f"ID: {p.get('id','')}\nСуд: {p.get('court_name','')}\nНомер: {p.get('case_number','')}\nРезюме: {(p.get('summary') or '')[:800]}"
            for p in candidates[:15]
        )
        user = f"Документ: {title}\n\nФрагмент:\n{content[:2000]}\n\nСудебная практика:\n{docs}"

        out = self._call_llm(system, user, json_mode=True)
        if out:
            try:
                data = json.loads(out)
                ids = [str(x) for x in (data.get("selected_ids") or []) if x][:10]
                summary = str(data.get("relevance_summary") or "")[:1000]
                return AgentResult(True, {"selected_ids": ids, "relevance_summary": summary}, agent_name=self.name)
            except Exception:
                pass

        ids = [str(p.get("id", "")) for p in candidates[:3] if p.get("id")]
        return AgentResult(True, {"selected_ids": ids, "relevance_summary": "Автоматический подбор (LLM недоступен)."}, agent_name=self.name)
