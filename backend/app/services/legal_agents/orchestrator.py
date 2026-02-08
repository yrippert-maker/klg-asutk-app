"""
Оркестратор: запуск множества ИИ-агентов для анализа документа и подготовки по нормам законодательства.
"""

import json
from typing import Any

from sqlalchemy.orm import Session

from .base import AgentResult
from .llm_client import get_llm_client
from .classifier import DocumentClassifierAgent
from .norm_compliance import NormComplianceAgent
from .cross_reference import CrossReferenceAgent
from .comment_enrichment import CommentEnrichmentAgent
from .judicial_practice import JudicialPracticeAgent
from .formatting import FormattingAgent

from app.models import LegalDocument, CrossReference, LegalComment, JudicialPractice, Jurisdiction


class LegalAnalysisOrchestrator:
    """Запускает цепочку агентов и при необходимости сохраняет перекрёстные ссылки в БД."""

    def __init__(self, db: Session | None = None, llm_client=None):
        self.db = db
        self.llm = llm_client or get_llm_client()
        self.agents = {
            "classifier": DocumentClassifierAgent(self.llm),
            "norm_compliance": NormComplianceAgent(self.llm),
            "cross_reference": CrossReferenceAgent(self.llm),
            "comment_enrichment": CommentEnrichmentAgent(self.llm),
            "judicial_practice": JudicialPracticeAgent(self.llm),
            "formatting": FormattingAgent(self.llm),
        }

    def _get_jurisdiction_code(self, jurisdiction_id: str | None) -> str:
        if not self.db or not jurisdiction_id:
            return "RU"
        j = self.db.get(Jurisdiction, jurisdiction_id)
        return (j.code if j else "RU")

    def _get_comment_candidates(self, jurisdiction_id: str | None, document_id: str | None, limit: int = 10) -> list[dict]:
        if not self.db:
            return []
        q = self.db.query(LegalComment).filter(LegalComment.jurisdiction_id == jurisdiction_id)
        if document_id:
            from sqlalchemy import or_
            q = q.filter(or_(LegalComment.document_id == document_id, LegalComment.document_id.is_(None)))
        rows = q.limit(limit).all()
        return [{"id": r.id, "title": r.title, "content": r.content, "article_ref": r.article_ref} for r in rows]

    def _get_practice_candidates(self, jurisdiction_id: str | None, document_id: str | None, limit: int = 15) -> list[dict]:
        if not self.db:
            return []
        q = self.db.query(JudicialPractice).filter(JudicialPractice.jurisdiction_id == jurisdiction_id)
        if document_id:
            from sqlalchemy import or_
            q = q.filter(or_(JudicialPractice.document_id == document_id, JudicialPractice.document_id.is_(None)))
        rows = q.limit(limit).all()
        return [
            {"id": r.id, "court_name": r.court_name, "case_number": r.case_number, "summary": r.summary}
            for r in rows
        ]

    def _find_target_document_for_ref(self, suggested_title: str, target_article: str, jurisdiction_id: str) -> str | None:
        """Поиск id документа в БД по suggested_title или target_article. Упрощённый подбор."""
        if not self.db:
            return None
        from sqlalchemy import or_
        q = self.db.query(LegalDocument.id).filter(LegalDocument.jurisdiction_id == jurisdiction_id)
        cond = []
        if suggested_title:
            cond.append(LegalDocument.title.ilike(f"%{suggested_title[:80]}%"))
            cond.append(LegalDocument.short_name.ilike(f"%{suggested_title[:60]}%"))
        if target_article:
            cond.append(LegalDocument.title.ilike(f"%{target_article[:60]}%"))
            cond.append(LegalDocument.content.ilike(f"%{target_article[:60]}%"))
        if cond:
            q = q.filter(or_(*cond))
        row = q.first()
        return row[0] if row else None

    def run(
        self,
        *,
        document_id: str | None = None,
        jurisdiction_id: str,
        title: str,
        content: str | None = None,
        existing_document_type: str | None = None,
        skip_agents: list[str] | None = None,
        save_cross_references: bool = True,
    ) -> dict[str, Any]:
        """
        Запуск полного анализа. Возвращает сводку по всем агентам.
        Если document_id задан и save_cross_references=True, перекрёстные ссылки пишутся в БД.
        """
        skip = set(skip_agents or [])
        juris_code = self._get_jurisdiction_code(jurisdiction_id)

        ctx: dict[str, Any] = {
            "document_id": document_id,
            "jurisdiction_id": jurisdiction_id,
            "jurisdiction_code": juris_code,
            "title": title,
            "content": content or "",
            "existing_document_ids": [],
        }
        if self.db:
            ctx["existing_document_ids"] = [r[0] for r in self.db.query(LegalDocument.id).filter(LegalDocument.jurisdiction_id == jurisdiction_id).limit(500).all()]

        results: dict[str, AgentResult] = {}

        # 1. Классификатор
        if "classifier" not in skip:
            res = self.agents["classifier"].run(ctx)
            results["classifier"] = res
            ctx["document_type"] = res.data.get("document_type", "other") if res.success else "other"
        else:
            ctx["document_type"] = existing_document_type or "other"

        # 2. Нормы
        if "norm_compliance" not in skip:
            results["norm_compliance"] = self.agents["norm_compliance"].run(ctx)

        # 3. Перекрёстные ссылки
        if "cross_reference" not in skip:
            res = self.agents["cross_reference"].run(ctx)
            results["cross_reference"] = res
            refs = (res.data.get("references") or []) if res.success else []

            if save_cross_references and document_id and self.db and refs:
                for r in refs:
                    target_id = self._find_target_document_for_ref(
                        r.get("suggested_title", ""), r.get("target_article", ""), jurisdiction_id
                    )
                    if not target_id or target_id == document_id:
                        continue
                    # проверка на дубликат
                    ex = self.db.query(CrossReference).filter(
                        CrossReference.source_document_id == document_id,
                        CrossReference.target_document_id == target_id,
                    ).first()
                    if not ex:
                        self.db.add(CrossReference(
                            source_document_id=document_id,
                            target_document_id=target_id,
                            quote_excerpt=r.get("quote_excerpt"),
                            target_article=r.get("target_article"),
                            relevance=r.get("relevance"),
                            created_by_agent="CrossReferenceAgent",
                        ))
                try:
                    self.db.commit()
                except Exception:
                    if self.db:
                        self.db.rollback()

        # 4. Комментарии (подбор из БД + агент)
        if "comment_enrichment" not in skip:
            ctx["comment_candidates"] = self._get_comment_candidates(jurisdiction_id, document_id)
            ctx["article_ref"] = ""  # при желании можно извлечь из content
            results["comment_enrichment"] = self.agents["comment_enrichment"].run(ctx)

        # 5. Судебная практика
        if "judicial_practice" not in skip:
            ctx["practice_candidates"] = self._get_practice_candidates(jurisdiction_id, document_id)
            results["judicial_practice"] = self.agents["judicial_practice"].run(ctx)

        # 6. Форматирование
        if "formatting" not in skip:
            results["formatting"] = self.agents["formatting"].run(ctx)

        # Сборка analysis_json и compliance_notes
        analysis = {}
        compliance_parts = []
        for k, v in results.items():
            if v.success and v.data:
                analysis[k] = v.data
                if k == "norm_compliance" and v.data.get("summary"):
                    compliance_parts.append(v.data["summary"])
                if k == "norm_compliance" and v.data.get("issues"):
                    for i in v.data["issues"]:
                        compliance_parts.append(f"Замечание: {i}")

        return {
            "document_type": ctx.get("document_type", "other"),
            "analysis_json": json.dumps(analysis, ensure_ascii=False) if analysis else None,
            "compliance_notes": "\n".join(compliance_parts) if compliance_parts else None,
            "results": {k: {"success": v.success, "data": v.data, "error": v.error} for k, v in results.items()},
        }
