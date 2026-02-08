"""
Схемы Pydantic для API юридических документов, комментариев, судебной практики и перекрёстных ссылок.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase, TimestampOut


# --- Jurisdiction ---

class JurisdictionBase(ORMBase):
    code: str
    name: str
    name_ru: str | None = None
    description: str | None = None
    is_active: bool = True


class JurisdictionCreate(JurisdictionBase):
    pass


class JurisdictionUpdate(BaseModel):
    name: str | None = None
    name_ru: str | None = None
    description: str | None = None
    is_active: bool | None = None


class JurisdictionOut(JurisdictionBase, TimestampOut):
    id: str


# --- LegalDocument ---

class LegalDocumentBase(ORMBase):
    jurisdiction_id: str
    document_type: str = Field(..., description="legislative|recommendatory|directive|notification|regulatory|contractual|judicial|other")
    title: str
    title_original: str | None = None
    short_name: str | None = None
    content: str | None = None
    summary: str | None = None
    effective_date: str | None = None
    publication_date: str | None = None
    registration_number: str | None = None
    source_file_path: str | None = None


class LegalDocumentCreate(LegalDocumentBase):
    pass


class LegalDocumentUpdate(BaseModel):
    document_type: str | None = None
    title: str | None = None
    title_original: str | None = None
    short_name: str | None = None
    content: str | None = None
    summary: str | None = None
    effective_date: str | None = None
    publication_date: str | None = None
    registration_number: str | None = None
    compliance_notes: str | None = None
    analysis_json: str | None = None
    source_file_path: str | None = None


class LegalDocumentOut(LegalDocumentBase, TimestampOut):
    id: str
    compliance_notes: str | None = None
    analysis_json: str | None = None


# --- CrossReference ---

class CrossReferenceBase(ORMBase):
    source_document_id: str
    target_document_id: str
    quote_excerpt: str | None = None
    target_article: str | None = None
    relevance: str | None = None


class CrossReferenceCreate(CrossReferenceBase):
    created_by_agent: str | None = None


class CrossReferenceOut(CrossReferenceBase, TimestampOut):
    id: str
    created_by_agent: str | None = None


# --- LegalComment ---

class LegalCommentBase(ORMBase):
    jurisdiction_id: str
    document_id: str | None = None
    title: str
    content: str
    article_ref: str | None = None
    author: str | None = None
    source: str | None = None
    is_official: bool = False


class LegalCommentCreate(LegalCommentBase):
    pass


class LegalCommentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    article_ref: str | None = None
    author: str | None = None
    source: str | None = None
    is_official: bool | None = None
    document_id: str | None = None


class LegalCommentOut(LegalCommentBase, TimestampOut):
    id: str


# --- JudicialPractice ---

class JudicialPracticeBase(ORMBase):
    jurisdiction_id: str
    document_id: str | None = None
    court_name: str
    case_number: str | None = None
    decision_date: str | None = None
    summary: str
    legal_grounds: str | None = None
    outcome: str | None = None
    full_text_ref: str | None = None


class JudicialPracticeCreate(JudicialPracticeBase):
    pass


class JudicialPracticeUpdate(BaseModel):
    court_name: str | None = None
    case_number: str | None = None
    decision_date: str | None = None
    summary: str | None = None
    legal_grounds: str | None = None
    outcome: str | None = None
    full_text_ref: str | None = None
    document_id: str | None = None


class JudicialPracticeOut(JudicialPracticeBase, TimestampOut):
    id: str


# --- Analysis (ИИ-агенты) ---

class AnalysisRequest(BaseModel):
    document_id: str | None = None
    jurisdiction_id: str
    title: str
    content: str | None = None
    skip_agents: list[str] | None = Field(default=None, description="classifier, norm_compliance, cross_reference, comment_enrichment, judicial_practice, formatting")
    save_cross_references: bool = True


class AnalysisResponse(BaseModel):
    document_type: str
    analysis_json: str | None
    compliance_notes: str | None
    results: dict[str, Any]
