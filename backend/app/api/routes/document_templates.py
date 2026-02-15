"""Шаблоны документов — CRUD + предпросмотр."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user, require_roles, get_db
from app.api.helpers import paginate_query
from app.models.document_template import DocumentTemplate

router = APIRouter(tags=["document_templates"])


class TemplateOut(BaseModel):
    id: str
    code: str
    name: str
    category: str
    standard: str
    description: str | None
    html_content: str
    version: int

    class Config:
        from_attributes = True


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    html_content: str | None = None


@router.get("/document-templates")
def list_templates(
    category: str | None = None,
    standard: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(DocumentTemplate).filter(DocumentTemplate.is_active == True)
    if category:
        q = q.filter(DocumentTemplate.category == category)
    if standard:
        q = q.filter(DocumentTemplate.standard == standard)
    q = q.order_by(DocumentTemplate.sort_order, DocumentTemplate.name)
    return paginate_query(q, page, per_page)


@router.get("/document-templates/{template_id}", response_model=TemplateOut)
def get_template(template_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(DocumentTemplate).filter(DocumentTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    return t


@router.patch("/document-templates/{template_id}", response_model=TemplateOut,
              dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def update_template(
    template_id: str,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    t = db.query(DocumentTemplate).filter(DocumentTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    if payload.name is not None:
        t.name = payload.name
    if payload.description is not None:
        t.description = payload.description
    if payload.html_content is not None:
        t.html_content = payload.html_content
    db.commit()
    db.refresh(t)
    return t
