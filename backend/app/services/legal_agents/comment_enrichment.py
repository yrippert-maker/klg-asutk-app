"""
Агент подбора правовых комментариев из базы и формулирования рекомендаций по использованию.
"""

import json
from .base import BaseLegalAgent, AgentResult


class CommentEnrichmentAgent(BaseLegalAgent):
    """Подбирает релевантные правовые комментарии. Работает в связке с БД (comment_ids передаются в context)."""

    def __init__(self, llm_client=None):
        super().__init__("CommentEnrichmentAgent", llm_client)

    def run(self, context: dict) -> AgentResult:
        content = (context.get("content") or "")[:4000]
        title = context.get("title", "")
        article_ref = context.get("article_ref", "")
        # Уже подобранные из БД комментарии (id, title, content)
        candidates = context.get("comment_candidates") or []

        if not candidates:
            return AgentResult(True, {"selected_ids": [], "usage_notes": []}, agent_name=self.name)

        system = (
            "Ты — юрист. Для документа и указанных правовых комментариев определи, какие комментарии релевантны. "
            "Верни JSON: {\"selected_ids\": [\"id1\", \"id2\"], \"usage_notes\": [\"как применить комментарий 1\", \"...\"]}"
        )
        docs = "\n---\n".join(
            f"ID: {c.get('id','')}\nЗаголовок: {c.get('title','')}\nТекст: {(c.get('content') or '')[:1500]}"
            for c in candidates[:10]
        )
        user = f"Документ: {title}\nСтатья/норма: {article_ref}\n\nФрагмент документа:\n{content[:2000]}\n\nКомментарии:\n{docs}"

        out = self._call_llm(system, user, json_mode=True)
        if out:
            try:
                data = json.loads(out)
                ids = [str(x) for x in (data.get("selected_ids") or []) if x][:10]
                notes = [str(x) for x in (data.get("usage_notes") or [])][:10]
                return AgentResult(True, {"selected_ids": ids, "usage_notes": notes}, agent_name=self.name)
            except Exception:
                pass

        # Без LLM: взять первые 3 кандидата
        ids = [str(c.get("id", "")) for c in candidates[:3] if c.get("id")]
        return AgentResult(True, {"selected_ids": ids, "usage_notes": ["Рекомендуется проверить релевантность вручную."]}, agent_name=self.name)
