"""
API маршруты для системы юридических документов:
- юрисдикции, документы, перекрёстные ссылки, правовые комментарии, судебная практика
- запуск мультиагентного ИИ-анализа и подготовки документов по нормам
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Jurisdiction, LegalDocument, CrossReference, LegalComment, JudicialPractice
from app.schemas.legal import (
    JurisdictionCreate,
    JurisdictionUpdate,
    JurisdictionOut,
    LegalDocumentCreate,
    LegalDocumentUpdate,
    LegalDocumentOut,
    CrossReferenceCreate,
    CrossReferenceOut,
    LegalCommentCreate,
    LegalCommentUpdate,
    LegalCommentOut,
    JudicialPracticeCreate,
    JudicialPracticeUpdate,
    JudicialPracticeOut,
    AnalysisRequest,
    AnalysisResponse,
)
from app.services.legal_agents import LegalAnalysisOrchestrator

router = APIRouter(prefix="/legal", tags=["legal"])


# --- Jurisdictions ---

@router.get("/jurisdictions", response_model=list[JurisdictionOut])
def list_jurisdictions(
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Jurisdiction)
    if active_only:
        q = q.filter(Jurisdiction.is_active.is_(True))
    return q.order_by(Jurisdiction.code).all()


@router.post("/jurisdictions", response_model=JurisdictionOut, status_code=status.HTTP_201_CREATED)
def create_jurisdiction(
    payload: JurisdictionCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin")),
):
    j = Jurisdiction(**payload.model_dump())
    db.add(j)
    db.commit()
    db.refresh(j)
    return j


@router.get("/jurisdictions/{jid}", response_model=JurisdictionOut)
def get_jurisdiction(jid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    j = db.get(Jurisdiction, jid)
    if not j:
        raise HTTPException(status_code=404, detail="Jurisdiction not found")
    return j


@router.patch("/jurisdictions/{jid}", response_model=JurisdictionOut)
def update_jurisdiction(
    jid: str,
    payload: JurisdictionUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin")),
):
    j = db.get(Jurisdiction, jid)
    if not j:
        raise HTTPException(status_code=404, detail="Jurisdiction not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(j, k, v)
    db.commit()
    db.refresh(j)
    return j


# --- Legal Documents ---

@router.get("/documents", response_model=list[LegalDocumentOut])
def list_legal_documents(
    jurisdiction_id: str | None = Query(None),
    document_type: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(LegalDocument)
    if jurisdiction_id:
        q = q.filter(LegalDocument.jurisdiction_id == jurisdiction_id)
    if document_type:
        q = q.filter(LegalDocument.document_type == document_type)
    return q.order_by(LegalDocument.created_at.desc()).limit(limit).all()


@router.post("/documents", response_model=LegalDocumentOut, status_code=status.HTTP_201_CREATED)
def create_legal_document(
    payload: LegalDocumentCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    d = LegalDocument(**payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.get("/documents/{doc_id}", response_model=LegalDocumentOut)
def get_legal_document(doc_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    return d


@router.patch("/documents/{doc_id}", response_model=LegalDocumentOut)
def update_legal_document(
    doc_id: str,
    payload: LegalDocumentUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@router.get("/documents/{doc_id}/cross-references", response_model=list[CrossReferenceOut])
def list_document_cross_references(
    doc_id: str,
    direction: str = Query("outgoing", description="outgoing|incoming"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(CrossReference)
    if direction == "incoming":
        q = q.filter(CrossReference.target_document_id == doc_id)
    else:
        q = q.filter(CrossReference.source_document_id == doc_id)
    return q.all()


# --- Cross References (ручное добавление) ---

@router.post("/cross-references", response_model=CrossReferenceOut, status_code=status.HTTP_201_CREATED)
def create_cross_reference(
    payload: CrossReferenceCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    ref = CrossReference(**payload.model_dump())
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


# --- Legal Comments ---

@router.get("/comments", response_model=list[LegalCommentOut])
def list_legal_comments(
    jurisdiction_id: str | None = Query(None),
    document_id: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(LegalComment)
    if jurisdiction_id:
        q = q.filter(LegalComment.jurisdiction_id == jurisdiction_id)
    if document_id:
        q = q.filter(LegalComment.document_id == document_id)
    return q.order_by(LegalComment.created_at.desc()).limit(limit).all()


@router.post("/comments", response_model=LegalCommentOut, status_code=status.HTTP_201_CREATED)
def create_legal_comment(
    payload: LegalCommentCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    c = LegalComment(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/comments/{cid}", response_model=LegalCommentOut)
def update_legal_comment(
    cid: str,
    payload: LegalCommentUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    c = db.get(LegalComment, cid)
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


# --- Judicial Practice ---

@router.get("/judicial-practices", response_model=list[JudicialPracticeOut])
def list_judicial_practices(
    jurisdiction_id: str | None = Query(None),
    document_id: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(JudicialPractice)
    if jurisdiction_id:
        q = q.filter(JudicialPractice.jurisdiction_id == jurisdiction_id)
    if document_id:
        q = q.filter(JudicialPractice.document_id == document_id)
    # nulls_last портировано под SQLite < 3.30: (col IS NULL) ASC — не-NULL первыми
    return q.order_by(
        JudicialPractice.decision_date.is_(None),
        JudicialPractice.decision_date.desc(),
        JudicialPractice.created_at.desc(),
    ).limit(limit).all()


@router.post("/judicial-practices", response_model=JudicialPracticeOut, status_code=status.HTTP_201_CREATED)
def create_judicial_practice(
    payload: JudicialPracticeCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    p = JudicialPractice(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/judicial-practices/{pid}", response_model=JudicialPracticeOut)
def update_judicial_practice(
    pid: str,
    payload: JudicialPracticeUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    p = db.get(JudicialPractice, pid)
    if not p:
        raise HTTPException(status_code=404, detail="Judicial practice not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


# --- ИИ-анализ (мультиагентный) ---

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_document(
    payload: AnalysisRequest,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    """
    Запуск мультиагентного анализа: классификация, соответствие нормам, перекрёстные ссылки,
    подбор правовых комментариев и судебной практики, рекомендации по оформлению.
    """
    orch = LegalAnalysisOrchestrator(db=db)
    out = orch.run(
        document_id=payload.document_id,
        jurisdiction_id=payload.jurisdiction_id,
        title=payload.title,
        content=payload.content,
        skip_agents=payload.skip_agents,
        save_cross_references=payload.save_cross_references,
    )

    # Опционально: обновить документ в БД, если document_id передан
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


@router.post("/documents/{doc_id}/analyze", response_model=AnalysisResponse)
def analyze_existing_document(
    doc_id: str,
    skip_agents: list[str] | None = Query(None),
    save_cross_references: bool = Query(True),
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "authority_inspector")),
):
    """Запуск ИИ-анализа для уже существующего документа по id."""
    d = db.get(LegalDocument, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    orch = LegalAnalysisOrchestrator(db=db)
    out = orch.run(
        document_id=doc_id,
        jurisdiction_id=d.jurisdiction_id,
        title=d.title,
        content=d.content,
        existing_document_type=d.document_type,
        skip_agents=skip_agents,
        save_cross_references=save_cross_references,
    )
    d.document_type = out["document_type"]
    d.analysis_json = out.get("analysis_json")
    d.compliance_notes = out.get("compliance_notes")
    db.commit()
    db.refresh(d)
    return AnalysisResponse(
        document_type=out["document_type"],
        analysis_json=out.get("analysis_json"),
        compliance_notes=out.get("compliance_notes"),
        results=out.get("results", {}),
    )
