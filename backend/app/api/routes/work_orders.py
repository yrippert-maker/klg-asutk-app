"""
Наряды на ТО (Work Orders) — управление работами по ТО ВС.

Правовые основания:
- ФАП-145 п.145.A.50, A.55, A.60, A.65 — порядок выполнения ТО
- ФАП-148 п.3, п.4 — программы ТО эксплуатанта
- EASA Part-145.A.50-65 — Certification of maintenance
- EASA Part-M.A.801 — Aircraft certificate of release to service
- ICAO Annex 6 Part I 8.7 — Maintenance release
"""
import uuid, logging
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.api.helpers import audit
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/work-orders", tags=["work-orders"])

_work_orders: dict = {}

class WorkOrderCreate(BaseModel):
    wo_number: str = Field(..., description="Номер наряда")
    aircraft_reg: str
    wo_type: str = Field(..., description="scheduled | unscheduled | ad_compliance | sb_compliance | defect_rectification | modification")
    title: str
    description: str = ""
    ata_chapters: List[str] = Field(default=[])
    related_ad_id: Optional[str] = None
    related_sb_id: Optional[str] = None
    related_defect_id: Optional[str] = None
    maintenance_program_ref: Optional[str] = None
    priority: str = Field("normal", description="aog | urgent | normal | deferred")
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    estimated_manhours: float = 0
    assigned_to: Optional[str] = Field(None, description="Специалист / бригада")
    parts_required: List[dict] = Field(default=[], description="P/N, qty")

class WorkOrderClose(BaseModel):
    actual_manhours: float = 0
    findings: str = ""
    parts_used: List[dict] = Field(default=[])
    crs_signed_by: Optional[str] = Field(None, description="CRS подписант (ФАП-145 п.A.50)")
    crs_date: Optional[str] = None

@router.get("/")
def list_work_orders(
    status: Optional[str] = None, aircraft_reg: Optional[str] = None,
    wo_type: Optional[str] = None, priority: Optional[str] = None,
    page: int = Query(1, ge=1), per_page: int = Query(50, le=200),
    user=Depends(get_current_user),
):
    items = list(_work_orders.values())
    if status: items = [w for w in items if w["status"] == status]
    if aircraft_reg: items = [w for w in items if w["aircraft_reg"] == aircraft_reg]
    if wo_type: items = [w for w in items if w["wo_type"] == wo_type]
    if priority: items = [w for w in items if w["priority"] == priority]
    total = len(items)
    start = (page - 1) * per_page
    return {"total": total, "page": page, "items": items[start:start + per_page],
            "legal_basis": "ФАП-145 п.A.50-65; EASA Part-145; ICAO Annex 6 8.7"}

@router.post("/")
def create_work_order(data: WorkOrderCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    wid = str(uuid.uuid4())
    wo = {"id": wid, **data.dict(), "status": "draft", "created_at": datetime.now(timezone.utc).isoformat()}
    _work_orders[wid] = wo
    if data.priority == "aog":
        try:
            from app.services.ws_manager import notify_wo_aog
            asyncio.create_task(notify_wo_aog(data.wo_number, data.aircraft_reg))
        except Exception:
            pass
    audit(db, user, "create", "work_order", entity_id=wid, description=f"WO {data.wo_number}: {data.title}")
    db.commit()
    return wo

@router.get("/{wo_id}")
def get_work_order(wo_id: str, user=Depends(get_current_user)):
    wo = _work_orders.get(wo_id)
    if not wo: raise HTTPException(404)
    return wo

@router.put("/{wo_id}/open")
def open_work_order(wo_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Открыть наряд → в работу."""
    wo = _work_orders.get(wo_id)
    if not wo: raise HTTPException(404)
    wo["status"] = "in_progress"
    wo["opened_at"] = datetime.now(timezone.utc).isoformat()
    audit(db, user, "open", "work_order", entity_id=wo_id)
    db.commit()
    return wo

@router.put("/{wo_id}/close")
def close_work_order(wo_id: str, data: WorkOrderClose, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Закрыть наряд + CRS (Certificate of Release to Service).
    ФАП-145 п.145.A.50: после ТО оформляется свидетельство о допуске к эксплуатации.
    """
    wo = _work_orders.get(wo_id)
    if not wo: raise HTTPException(404)
    wo["status"] = "closed"
    wo["closed_at"] = datetime.now(timezone.utc).isoformat()
    wo["actual_manhours"] = data.actual_manhours
    wo["findings"] = data.findings
    wo["parts_used"] = data.parts_used
    wo["crs_signed_by"] = data.crs_signed_by
    wo["crs_date"] = data.crs_date or datetime.now(timezone.utc).isoformat()
    try:
        from app.services.ws_manager import notify_wo_closed
        asyncio.create_task(notify_wo_closed(wo["wo_number"], wo["aircraft_reg"], data.crs_signed_by or ""))
    except Exception:
        pass
    audit(db, user, "close", "work_order", entity_id=wo_id,
          description=f"WO закрыт, CRS: {data.crs_signed_by}")
    db.commit()
    return wo

@router.put("/{wo_id}/cancel")
def cancel_work_order(wo_id: str, reason: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    wo = _work_orders.get(wo_id)
    if not wo: raise HTTPException(404)
    wo["status"] = "cancelled"
    wo["cancel_reason"] = reason
    audit(db, user, "cancel", "work_order", entity_id=wo_id)
    db.commit()
    return wo

@router.get("/stats/summary")
def work_order_stats(user=Depends(get_current_user)):
    """Статистика нарядов для Dashboard."""
    items = list(_work_orders.values())
    return {
        "total": len(items),
        "draft": len([w for w in items if w["status"] == "draft"]),
        "in_progress": len([w for w in items if w["status"] == "in_progress"]),
        "closed": len([w for w in items if w["status"] == "closed"]),
        "cancelled": len([w for w in items if w["status"] == "cancelled"]),
        "aog": len([w for w in items if w.get("priority") == "aog"]),
        "total_manhours": sum(w.get("actual_manhours", 0) for w in items if w["status"] == "closed"),
    }


# ===================================================================
#  СКВОЗНАЯ ИНТЕГРАЦИЯ: AD → WO, Defect → WO, LL → WO
#  ФАП-145 п.A.50: все работы по ТО оформляются нарядом
# ===================================================================

@router.post("/from-directive/{directive_id}")
def create_wo_from_directive(directive_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Создать наряд на выполнение ДЛГ."""
    from app.api.routes.airworthiness_core import _directives
    ad = _directives.get(directive_id)
    if not ad:
        raise HTTPException(404, "Directive not found")
    wid = str(uuid.uuid4())
    wo = {
        "id": wid,
        "wo_number": f"WO-AD-{ad['number'][:20]}",
        "aircraft_reg": ", ".join(ad.get("aircraft_types", [])),
        "wo_type": "ad_compliance",
        "title": f"Выполнение ДЛГ {ad['number']}: {ad.get('title', '')}",
        "description": ad.get("description", ""),
        "related_ad_id": directive_id,
        "priority": "urgent" if ad.get("compliance_type") == "mandatory" else "normal",
        "status": "draft",
        "estimated_manhours": 0,
        "ata_chapters": [ad["ata_chapter"]] if ad.get("ata_chapter") else [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _work_orders[wid] = wo
    audit(db, user, "create_from_ad", "work_order", entity_id=wid,
          description=f"WO из ДЛГ {ad['number']}")
    db.commit()
    return wo


@router.post("/from-defect/{defect_id}")
def create_wo_from_defect(defect_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Создать наряд на устранение дефекта."""
    from app.api.routes.defects import _defects
    defect = _defects.get(defect_id)
    if not defect:
        raise HTTPException(404, "Defect not found")
    wid = str(uuid.uuid4())
    wo = {
        "id": wid,
        "wo_number": f"WO-DEF-{defect_id[:8].upper()}",
        "aircraft_reg": defect["aircraft_reg"],
        "wo_type": "defect_rectification",
        "title": f"Устранение дефекта: {defect.get('description', '')[:80]}",
        "description": defect.get("description", ""),
        "related_defect_id": defect_id,
        "priority": "aog" if defect.get("severity") == "critical" else "urgent" if defect.get("severity") == "major" else "normal",
        "status": "draft",
        "estimated_manhours": 0,
        "ata_chapters": [defect["ata_chapter"]] if defect.get("ata_chapter") else [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _work_orders[wid] = wo
    audit(db, user, "create_from_defect", "work_order", entity_id=wid,
          description=f"WO из дефекта {defect['aircraft_reg']}")
    db.commit()
    return wo


@router.post("/from-bulletin/{bulletin_id}")
def create_wo_from_bulletin(bulletin_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Создать наряд на внедрение SB."""
    from app.api.routes.airworthiness_core import _bulletins
    sb = _bulletins.get(bulletin_id)
    if not sb:
        raise HTTPException(404, "Bulletin not found")
    wid = str(uuid.uuid4())
    wo = {
        "id": wid,
        "wo_number": f"WO-SB-{sb['number'][:20]}",
        "aircraft_reg": ", ".join(sb.get("aircraft_types", [])),
        "wo_type": "sb_compliance",
        "title": f"Внедрение SB {sb['number']}: {sb.get('title', '')}",
        "description": sb.get("description", ""),
        "related_sb_id": bulletin_id,
        "priority": "urgent" if sb.get("category") == "mandatory" else "normal",
        "status": "draft",
        "estimated_manhours": sb.get("estimated_manhours", 0),
        "ata_chapters": [sb["ata_chapter"]] if sb.get("ata_chapter") else [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _work_orders[wid] = wo
    audit(db, user, "create_from_sb", "work_order", entity_id=wid,
          description=f"WO из SB {sb['number']}")
    db.commit()
    return wo



@router.get("/{wo_id}/report/pdf")
def generate_wo_pdf(wo_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Генерация PDF отчёта по наряду на ТО (включая CRS).
    ФАП-145 п.145.A.55: документация о выполненном ТО.
    """
    from io import BytesIO
    from datetime import datetime as dt
    from fastapi.responses import StreamingResponse

    wo = _work_orders.get(wo_id)
    if not wo:
        raise HTTPException(404, "Work Order not found")

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors

        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=30, bottomMargin=30)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f"НАРЯД НА ТО / WORK ORDER", styles["Title"]))
        elements.append(Paragraph(f"No: {wo.get('wo_number', '?')}", styles["Heading2"]))
        elements.append(Spacer(1, 12))

        # Main info table
        data = [
            ["Борт / Aircraft:", wo.get("aircraft_reg", "")],
            ["Тип работ / Type:", wo.get("wo_type", "")],
            ["Наименование / Title:", wo.get("title", "")],
            ["Приоритет / Priority:", wo.get("priority", "")],
            ["Статус / Status:", wo.get("status", "")],
            ["План. ч/ч / Est. MH:", str(wo.get("estimated_manhours", 0))],
            ["Факт. ч/ч / Actual MH:", str(wo.get("actual_manhours", "—"))],
        ]
        t = Table(data, colWidths=[180, 340])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.Color(0.9, 0.9, 0.9)),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 16))

        # Description
        if wo.get("description"):
            elements.append(Paragraph("Описание работ:", styles["Heading4"]))
            elements.append(Paragraph(wo["description"], styles["Normal"]))
            elements.append(Spacer(1, 12))

        # Findings
        if wo.get("findings"):
            elements.append(Paragraph("Замечания / Findings:", styles["Heading4"]))
            elements.append(Paragraph(wo["findings"], styles["Normal"]))
            elements.append(Spacer(1, 12))

        # CRS block
        if wo.get("crs_signed_by"):
            elements.append(Spacer(1, 20))
            elements.append(Paragraph("CERTIFICATE OF RELEASE TO SERVICE (CRS)", styles["Heading3"]))
            elements.append(Paragraph(
                f"Certifies that the work specified was carried out in accordance with "
                f"Part-145 and the aircraft/component is considered ready for release to service.",
                styles["Normal"]
            ))
            elements.append(Spacer(1, 8))
            crs_data = [
                ["CRS подписал / Signed by:", wo["crs_signed_by"]],
                ["Дата / Date:", wo.get("crs_date", "")],
                ["Основание / Ref:", "ФАП-145 п.145.A.50; EASA Part-145.A.50"],
            ]
            ct = Table(crs_data, colWidths=[180, 340])
            ct.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.Color(0.85, 0.95, 0.85)),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]))
            elements.append(ct)

        # Footer
        elements.append(Spacer(1, 30))
        elements.append(Paragraph(
            f"Сформировано: {dt.now().strftime('%d.%m.%Y %H:%M')} | АСУ ТК КЛГ",
            styles["Normal"]
        ))

        doc.build(elements)
        buf.seek(0)

        audit(db, user, "pdf_export", "work_order", entity_id=wo_id,
              description=f"PDF WO {wo.get('wo_number', '?')}")
        db.commit()

        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=WO_{wo.get('wo_number', 'report')}.pdf"},
        )
    except ImportError:
        raise HTTPException(500, "ReportLab not installed")



@router.post("/batch-from-program/{program_id}")
def batch_create_from_program(
    program_id: str,
    aircraft_reg: str = "",
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Массовое создание нарядов из программы ТО.
    Для каждой задачи в программе создаётся отдельный WO.
    ФАП-148 п.3: программа ТО → наряды на выполнение.
    """
    from app.api.routes.airworthiness_core import _maint_programs

    mp = _maint_programs.get(program_id)
    if not mp:
        raise HTTPException(404, "Maintenance Program not found")

    tasks = mp.get("tasks", [])
    if not tasks:
        raise HTTPException(400, "Program has no tasks")

    created = []
    for task in tasks:
        wid = str(uuid.uuid4())
        wo = {
            "id": wid,
            "wo_number": f"WO-MP-{task.get('task_id', wid[:6])}",
            "aircraft_reg": aircraft_reg or mp.get("aircraft_type", ""),
            "wo_type": "scheduled",
            "title": task.get("description", task.get("task_id", "Task")),
            "description": f"Из программы ТО: {mp['name']} ({mp['revision']})",
            "maintenance_program_ref": f"{program_id}:{task.get('task_id', '')}",
            "priority": "normal",
            "status": "draft",
            "estimated_manhours": task.get("manhours", 0),
            "ata_chapters": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _work_orders[wid] = wo
        created.append(wo)

    audit(db, user, "batch_create", "work_order", entity_id=program_id,
          description=f"Batch WO из MP {mp['name']}: {len(created)} нарядов")
    db.commit()

    return {"program": mp["name"], "created_count": len(created), "work_orders": created}
