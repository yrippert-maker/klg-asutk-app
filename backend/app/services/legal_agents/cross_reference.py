"""
Агент поиска и предложения перекрёстных ссылок на цитируемые документы.
"""

import json
import re
from .base import BaseLegalAgent, AgentResult


class CrossReferenceAgent(BaseLegalAgent):
    def __init__(self, llm_client=None):
        super().__init__("CrossReferenceAgent", llm_client)

    def run(self, context: dict) -> AgentResult:
        content = (context.get("content") or "")[:8000]
        jurisdiction = context.get("jurisdiction_code", "")
        existing_doc_ids = set(context.get("existing_document_ids") or [])

        system = (
            "Ты — юрист. Найди в тексте отсылки к другим правовым актам (статьи, законы, приказы и т.д.). "
            "Верни JSON: {\"references\": [{\"quote_excerpt\": \"...\", \"target_article\": \"ст. 15\", \"suggested_title\": \"...\", \"relevance\": \"high|medium|low\"}]}"
        )
        user = f"Юрисдикция: {jurisdiction}\n\nТекст:\n{content[:4000]}"

        out = self._call_llm(system, user, json_mode=True)
        refs = []
        if out:
            try:
                data = json.loads(out)
                for r in (data.get("references") or [])[:20]:
                    if isinstance(r, dict) and (r.get("quote_excerpt") or r.get("target_article")):
                        refs.append({
                            "quote_excerpt": (r.get("quote_excerpt") or "")[:2000],
                            "target_article": (r.get("target_article") or "")[:128],
                            "suggested_title": (r.get("suggested_title") or "")[:512],
                            "relevance": r.get("relevance") or "medium",
                        })
            except (json.JSONDecodeError, TypeError):
                pass

        if not refs:
            # Эвристика: ст. 123, п. 2, статья 45, Part 14, § 5
            for m in re.finditer(r"(?:ст\.|статья|статьи|п\.|часть|части|Part\s+\d+|§\s*\d+|\d+\s*\.\s*\d+)\s*[\d\u00a0\s]+", content, re.I):
                refs.append({
                    "quote_excerpt": content[max(0, m.start() - 80) : m.end() + 80],
                    "target_article": m.group(0).strip()[:128],
                    "suggested_title": "",
                    "relevance": "medium",
                })
            refs = refs[:15]

        return AgentResult(True, {"references": refs}, agent_name=self.name)
