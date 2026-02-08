"""API для управления чек-листами."""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
import csv
import io

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import ChecklistTemplate, ChecklistItem
from app.schemas.audit import (
    ChecklistTemplateCreate, ChecklistTemplateOut,
    ChecklistItemCreate, ChecklistItemOut
)

router = APIRouter(tags=["checklists"])


@router.get("/checklists/templates", response_model=list[ChecklistTemplateOut])
def list_templates(
    domain: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Список шаблонов чек-листов."""
    q = db.query(ChecklistTemplate).filter(ChecklistTemplate.is_active == True)
    if domain:
        q = q.filter(ChecklistTemplate.domain == domain)
    templates = q.order_by(ChecklistTemplate.name, ChecklistTemplate.version.desc()).all()
    result = []
    for t in templates:
        items = db.query(ChecklistItem).filter(ChecklistItem.template_id == t.id).order_by(ChecklistItem.sort_order).all()
        out = ChecklistTemplateOut.model_validate(t)
        out.items = [ChecklistItemOut.model_validate(i) for i in items]
        result.append(out)
    return result


@router.post(
    "/checklists/templates",
    response_model=ChecklistTemplateOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def create_template(
    payload: ChecklistTemplateCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Создаёт новый шаблон чек-листа."""
    template = ChecklistTemplate(
        name=payload.name,
        version=payload.version,
        description=payload.description,
        domain=payload.domain
    )
    db.add(template)
    db.flush()
    
    if payload.items:
        for item_data in payload.items:
            item = ChecklistItem(
                template_id=template.id,
                code=item_data.code,
                text=item_data.text,
                domain=item_data.domain,
                sort_order=item_data.sort_order
            )
            db.add(item)
    
    db.commit()
    db.refresh(template)
    
    out = ChecklistTemplateOut.model_validate(template)
    if payload.items:
        items = db.query(ChecklistItem).filter(ChecklistItem.template_id == template.id).all()
        out.items = [ChecklistItemOut.model_validate(i) for i in items]
    return out


@router.post(
    "/checklists/generate",
    response_model=ChecklistTemplateOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def generate_checklist(
    source: str,  # "fap_m_inspection" | "ata" | "custom"
    name: str,
    items: list[ChecklistItemCreate] | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Автоматически генерирует чек-лист из предустановленного шаблона или пользовательских данных."""
    template = ChecklistTemplate(name=name, version=1, domain=source)
    db.add(template)
    db.flush()
    
    if source == "fap_m_inspection":
        # Предустановленный шаблон для проверки по ФАП-М
        preset_items = [
            ChecklistItemCreate(code="M.A.301", text="ВС имеет действующий сертификат лётной годности", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.302", text="ВС эксплуатируется в соответствии с CAME", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.303", text="Выполнены все требования по техническому обслуживанию", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.304", text="Все дефекты устранены или имеют действующие разрешения на полёты", domain="ФАП-М"),
            ChecklistItemCreate(code="M.A.305", text="Документация по ВС актуальна и соответствует требованиям", domain="ФАП-М"),
        ]
        items = preset_items
    elif source == "custom" and items:
        pass  # Используем переданные items
    else:
        raise HTTPException(status_code=400, detail="Неверный source или отсутствуют items")
    
    for item_data in items:
        item = ChecklistItem(
            template_id=template.id,
            code=item_data.code,
            text=item_data.text,
            domain=item_data.domain,
            sort_order=item_data.sort_order
        )
        db.add(item)
    
    db.commit()
    db.refresh(template)
    
    out = ChecklistTemplateOut.model_validate(template)
    items_db = db.query(ChecklistItem).filter(ChecklistItem.template_id == template.id).all()
    out.items = [ChecklistItemOut.model_validate(i) for i in items_db]
    return out


@router.get("/checklists/templates/{template_id}", response_model=ChecklistTemplateOut)
def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получает шаблон с пунктами."""
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    items = db.query(ChecklistItem).filter(ChecklistItem.template_id == template_id).order_by(ChecklistItem.sort_order).all()
    out = ChecklistTemplateOut.model_validate(template)
    out.items = [ChecklistItemOut.model_validate(i) for i in items]
    return out


@router.post(
    "/checklists/generate-from-csv",
    response_model=ChecklistTemplateOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
async def generate_checklist_from_csv(
    file: UploadFile = File(...),
    name: str | None = None,
    domain: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Генерирует чек-лист из CSV файла (например, из REFLY_Jira_Backlog_Subtasks_Dependencies.csv).
    
    Ожидаемые колонки в CSV:
    - Issue Id (или Issue Id) - код пункта
    - Summary (или Description) - текст требования
    - Domain (опционально) - домен
    - Story Points (опционально) - для sort_order
    """
    content = await file.read()
    
    # Парсим CSV
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = content.decode('cp1251')
    
    reader = csv.DictReader(io.StringIO(text))
    fieldnames = reader.fieldnames or []
    rows = list(reader)
    
    if not rows:
        raise HTTPException(status_code=400, detail="CSV файл пуст или неверного формата")
    
    # Определяем колонки (поддерживаем разные варианты названий)
    code_col = None
    text_col = None
    domain_col = None
    order_col = None
    
    for col in fieldnames:
        col_lower = col.lower()
        if 'issue' in col_lower and 'id' in col_lower and not code_col:
            code_col = col
        elif ('summary' in col_lower or 'description' in col_lower) and not text_col:
            text_col = col
        elif 'domain' in col_lower and not domain_col:
            domain_col = col
        elif ('story' in col_lower and 'point' in col_lower) or 'order' in col_lower:
            order_col = col
    
    if not code_col or not text_col:
        raise HTTPException(status_code=400, detail="Не найдены обязательные колонки: Issue Id и Summary/Description")
    
    # Создаём шаблон
    template_name = name or file.filename.replace('.csv', '').replace('_', ' ').title()
    template = ChecklistTemplate(
        name=template_name,
        version=1,
        domain=domain or "REFLY_CSV"
    )
    db.add(template)
    db.flush()
    
    # Создаём пункты
    items_created = []
    for idx, row in enumerate(rows):
        code = str(row.get(code_col, f"ITEM_{idx+1}")).strip()
        text = str(row.get(text_col, "")).strip()
        
        if not code or not text:
            continue  # Пропускаем пустые строки
        
        item_domain = domain or (row.get(domain_col, "") if domain_col else None) or None
        sort_order = int(row.get(order_col, idx + 1)) if order_col and row.get(order_col) else idx + 1
        
        item = ChecklistItem(
            template_id=template.id,
            code=code,
            text=text,
            domain=item_domain,
            sort_order=sort_order
        )
        db.add(item)
        items_created.append(item)
    
    if not items_created:
        db.rollback()
        raise HTTPException(status_code=400, detail="Не удалось создать ни одного пункта из CSV")
    
    db.commit()
    db.refresh(template)
    
    out = ChecklistTemplateOut.model_validate(template)
    items_db = db.query(ChecklistItem).filter(ChecklistItem.template_id == template.id).order_by(ChecklistItem.sort_order).all()
    out.items = [ChecklistItemOut.model_validate(i) for i in items_db]
    return out
