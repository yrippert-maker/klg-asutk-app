"""
Мультиагентная система для анализа и подготовки юридических документов.

Агенты:
- DocumentClassifierAgent: классификация типа документа
- NormComplianceAgent: проверка соответствия нормам юрисдикции
- CrossReferenceAgent: поиск и добавление перекрёстных ссылок
- CommentEnrichmentAgent: подбор правовых комментариев
- JudicialPracticeAgent: подбор судебной практики
- FormattingAgent: форматирование по требованиям юрисдикции
- LegalAnalysisOrchestrator: оркестрация всех агентов
"""

from .base import BaseLegalAgent, AgentResult
from .classifier import DocumentClassifierAgent
from .norm_compliance import NormComplianceAgent
from .cross_reference import CrossReferenceAgent
from .comment_enrichment import CommentEnrichmentAgent
from .judicial_practice import JudicialPracticeAgent
from .formatting import FormattingAgent
from .orchestrator import LegalAnalysisOrchestrator

__all__ = [
    "BaseLegalAgent",
    "AgentResult",
    "DocumentClassifierAgent",
    "NormComplianceAgent",
    "CrossReferenceAgent",
    "CommentEnrichmentAgent",
    "JudicialPracticeAgent",
    "FormattingAgent",
    "LegalAnalysisOrchestrator",
]
