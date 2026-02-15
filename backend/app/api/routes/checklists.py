"""Checklists API — refactored: pagination, audit, DRY."""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.orm import Session
import csv, io

from app.api.deps import get_current_user, require_roles
from app.api.helpers import audit, paginate_query
from app.api.deps import get_db
from app.models import ChecklistTemplate, ChecklistItem
from app.schemas.audit import (
    ChecklistTemplateCreate,
    ChecklistTemplateOut,
    ChecklistTemplateUpdate,
    ChecklistItemCreate,
    ChecklistItemOut,
    ChecklistItemUpdate,
)

router = APIRouter(tags=["checklists"])


def _template_with_items(template, db) -> ChecklistTemplateOut:
    items = db.query(ChecklistItem).filter(ChecklistItem.template_id == template.id).order_by(ChecklistItem.sort_order).all()
    out = ChecklistTemplateOut.model_validate(template)
    out.items = [ChecklistItemOut.model_validate(i) for i in items]
    return out


@router.get("/checklists/templates")
def list_templates(
    domain: str | None = None, page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(ChecklistTemplate).filter(ChecklistTemplate.is_active == True)
    if domain: q = q.filter(ChecklistTemplate.domain == domain)
    q = q.order_by(ChecklistTemplate.name, ChecklistTemplate.version.desc())
    result = paginate_query(q, page, per_page)
    result["items"] = [_template_with_items(t, db) for t in result["items"]]
    return result


@router.post("/checklists/templates", response_model=ChecklistTemplateOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def create_template(payload: ChecklistTemplateCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    template = ChecklistTemplate(name=payload.name, version=payload.version, description=payload.description, domain=payload.domain)
    db.add(template); db.flush()
    if payload.items:
        for d in payload.items:
            db.add(ChecklistItem(template_id=template.id, code=d.code, text=d.text, domain=d.domain, sort_order=d.sort_order))
    audit(db, user, "create", "checklist_template", description=f"Template: {payload.name}")
    db.commit(); db.refresh(template)
    return _template_with_items(template, db)


@router.post("/checklists/generate", response_model=ChecklistTemplateOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def generate_checklist(source: str, name: str, items: list[ChecklistItemCreate] | None = None,
                       db: Session = Depends(get_db), user=Depends(get_current_user)):
    template = ChecklistTemplate(name=name, version=1, domain=source)
    db.add(template); db.flush()
    if source == "fap_m_inspection":
        items = [
            ChecklistItemCreate(code="M.A.301", text="ВС имеет действующий сертификат лётной годности", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.302", text="ВС эксплуатируется в соответствии с CAME", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.303", text="Выполнены все требования по ТО", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.304", text="Все дефекты устранены или имеют разрешения", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.305", text="Документация по ВС актуальна", domain="ФАП-М"),
        ]
    elif source != "custom" or not items:
        raise HTTPException(400, "Invalid source or missing items")
    for d in items:
        db.add(ChecklistItem(template_id=template.id, code=d.code, text=d.text, domain=d.domain, sort_order=d.sort_order))
    audit(db, user, "create", "checklist_template", description=f"Generated: {name}")
    db.commit(); db.refresh(template)
    return _template_with_items(template, db)


@router.get("/checklists/templates/{template_id}", response_model=ChecklistTemplateOut)
def get_template(template_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t: raise HTTPException(404, "Not found")
    return _template_with_items(t, db)


@router.patch("/checklists/templates/{template_id}", response_model=ChecklistTemplateOut,
              dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def update_template(
    template_id: str,
    payload: ChecklistTemplateUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    if payload.name is not None:
        t.name = payload.name
    if payload.description is not None:
        t.description = payload.description
    if payload.domain is not None:
        t.domain = payload.domain
    audit(db, user, "update", "checklist_template", entity_id=template_id)
    db.commit()
    db.refresh(t)
    return _template_with_items(t, db)


@router.patch("/checklists/items/{item_id}", response_model=ChecklistItemOut,
              dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def update_item(
    item_id: str,
    payload: ChecklistItemUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    if payload.code is not None:
        item.code = payload.code
    if payload.text is not None:
        item.text = payload.text
    if payload.sort_order is not None:
        item.sort_order = payload.sort_order
    audit(db, user, "update", "checklist_item", entity_id=item_id)
    db.commit()
    db.refresh(item)
    return ChecklistItemOut.model_validate(item)


@router.post("/checklists/templates/{template_id}/items", response_model=ChecklistItemOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def add_item(
    template_id: str,
    payload: ChecklistItemCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    max_order = db.query(ChecklistItem).filter(ChecklistItem.template_id == template_id).count()
    item = ChecklistItem(
        template_id=template_id,
        code=payload.code,
        text=payload.text,
        domain=payload.domain,
        sort_order=payload.sort_order if payload.sort_order else (max_order + 1),
    )
    db.add(item)
    audit(db, user, "create", "checklist_item")
    db.commit()
    db.refresh(item)
    return ChecklistItemOut.model_validate(item)


@router.delete("/checklists/items/{item_id}", status_code=204,
               dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    audit(db, user, "delete", "checklist_item", entity_id=item_id)
    db.delete(item)
    db.commit()


@router.post("/checklists/generate-from-csv", response_model=ChecklistTemplateOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
async def generate_from_csv(file: UploadFile = File(...), name: str | None = None, domain: str | None = None,
                            db: Session = Depends(get_db), user=Depends(get_current_user)):
    content = await file.read()
    try: text = content.decode('utf-8-sig')
    except UnicodeDecodeError: text = content.decode('cp1251')
    reader = csv.DictReader(io.StringIO(text))
    fields = reader.fieldnames or []
    rows = list(reader)
    if not rows: raise HTTPException(400, "CSV empty")
    code_col = next((c for c in fields if 'issue' in c.lower() and 'id' in c.lower()), None)
    text_col = next((c for c in fields if 'summary' in c.lower() or 'description' in c.lower()), None)
    if not code_col or not text_col: raise HTTPException(400, "Missing Issue Id / Summary columns")
    domain_col = next((c for c in fields if 'domain' in c.lower()), None)
    template = ChecklistTemplate(name=name or file.filename.replace('.csv', ''), version=1, domain=domain or "CSV")
    db.add(template); db.flush()
    count = 0
    for idx, row in enumerate(rows):
        code, txt = str(row.get(code_col, "")).strip(), str(row.get(text_col, "")).strip()
        if not code or not txt: continue
        db.add(ChecklistItem(template_id=template.id, code=code, text=txt,
                             domain=domain or (row.get(domain_col, "") if domain_col else None), sort_order=idx+1))
        count += 1
    if not count: db.rollback(); raise HTTPException(400, "No items created")
    audit(db, user, "create", "checklist_template", description=f"CSV import: {count} items")
    db.commit(); db.refresh(template)
    return _template_with_items(template, db)
