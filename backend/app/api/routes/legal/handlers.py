"""
Обработчики бизнес-логики для модуля legal (юрисдикции, документы, комментарии, судебная практика, ИИ-анализ).
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Jurisdiction, LegalDocument, CrossReference, LegalComment, JudicialPractice
from app.schemas.legal import (
    JurisdictionCreate,
    JurisdictionUpdate,
    LegalDocumentCreate,
    LegalDocumentUpdate,
    CrossReferenceCreate,
    LegalCommentCreate,
    LegalCommentUpdate,
    JudicialPracticeCreate,
    JudicialPracticeUpdate,
    AnalysisRequest,
    AnalysisResponse,
)
from app.services.legal_agents import LegalAnalysisOrchestrator
from app.api.helpers import paginate_query


# --- Jurisdictions ---

def list_jurisdictions(db: Session, active_only: bool):
    q = db.query(Jurisdiction)
    if active_only:
        q = q.filter(Jurisdiction.is_active.is_(True))
    return q.order_by(Jurisdiction.code).all()


def create_jurisdiction(db: Session, payload: JurisdictionCreate):
    j = Jurisdiction(**payload.model_dump())
    db.add(j)
    db.commit()
    db.refresh(j)
    return j


def get_jurisdiction(db: Session, jid: str):
    j = db.get(Jurisdiction, jid)
    if not j:
        raise HTTPException(status_code=404, detail="Jurisdiction not found")
    return j


def update_jurisdiction(db: Session, jid: str, payload: JurisdictionUpdate):
    j = db.get(Jurisdiction, jid)
    if not j:
        raise HTTPException(status_code=404, detail="Jurisdiction not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(j, k, v)
    db.commit()
    db.refresh(j)
    return j


# --- Legal Documents ---

def list_legal_documents(db: Session, page: int, per_page: int, jurisdiction_id: str | None, document_type: str | None):
    q = db.query(LegalDocument)
    if jurisdiction_id:
        q = q.filter(LegalDocument.jurisdiction_id == jurisdiction_id)
    if document_type:
        q = q.filter(LegalDocument.document_type == document_type)
    q = q.order_by(LegalDocument.created_at.desc())
    return paginate_query(q, page, per_page)


def create_legal_document(db: Session, payload: LegalDocumentCreate):
    d = LegalDocument(**payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


def get_legal_document(db: Session, doc_id: str):
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    return d


def update_legal_document(db: Session, doc_id: str, payload: LegalDocumentUpdate):
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


# --- Analyze ---

def run_analysis(db: Session, payload: AnalysisRequest):
    orch = LegalAnalysisOrchestrator(db=db)
    out = orch.run(
        document_id=payload.document_id,
        jurisdiction_id=payload.jurisdiction_id,
        title=payload.title,
        content=payload.content,
        skip_agents=payload.skip_agents,
        save_cross_references=payload.save_cross_references,
    )
    if payload.document_id and out.get("document_type"):
        d = db.get(LegalDocument, payload.document_id)
        if d:
            d.document_type = out["document_type"]
            d.analysis_json = out.get("analysis_json")
            d.compliance_notes = out.get("compliance_notes")
            db.commit()
    return AnalysisResponse(
        document_type=out["document_type"],
        analysis_json=out.get("analysis_json"),
        compliance_notes=out.get("compliance_notes"),
        results=out.get("results", {}),
    )
