"""
Ядро системы ПЛГ — контроль лётной годности ВС.

Модули:
1. Директивы лётной годности (AD/ДЛГ) — ВК РФ ст. 37; ФАП-148 п.4.3; EASA Part-M.A.301; ICAO Annex 8
2. Сервисные бюллетени (SB) — ФАП-148 п.4.5; EASA Part-M.A.301; EASA Part-21.A.3B
3. Ресурсы и сроки службы (Life Limits) — ФАП-148 п.4.2; EASA Part-M.A.302; ICAO Annex 8 Part II 4.2
4. Программы ТО (MP) — ФАП-148 п.3; EASA Part-M.A.302; ICAO Annex 6 Part I 8.3
5. Карточки компонентов — ФАП-145 п.145.A.42; EASA Part-M.A.501
"""
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.api.helpers import audit
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/airworthiness-core", tags=["airworthiness-core"])

# ===================================================================
#  IN-MEMORY STORAGE (prod: PostgreSQL)
# ===================================================================
_directives: dict = {}
_bulletins: dict = {}
_life_limits: dict = {}
_maint_programs: dict = {}
_components: dict = {}


# ===================================================================
#  1. ДИРЕКТИВЫ ЛЁТНОЙ ГОДНОСТИ (AD / ДЛГ)
# ===================================================================

class DirectiveCreate(BaseModel):
    number: str = Field(..., description="Номер ДЛГ (напр. AD 2025-01-15R1)")
    title: str
    issuing_authority: str = Field("FATA", description="ФАВТ / EASA / FAA / другой")
    aircraft_types: List[str] = Field(default=[])
    ata_chapter: Optional[str] = Field(None, description="ATA Chapter (напр. 32 Landing Gear)")
    effective_date: str
    compliance_type: str = Field("mandatory", description="mandatory | recommended | info")
    compliance_deadline: Optional[str] = None
    repetitive: bool = False
    repetitive_interval_hours: Optional[float] = None
    repetitive_interval_days: Optional[int] = None
    description: str = ""
    affected_parts: List[str] = Field(default=[], description="P/N затронутых компонентов")
    supersedes: Optional[str] = None
    status: str = Field("open", description="open | complied | not_applicable | deferred")

@router.get("/directives")
def list_directives(
    status: Optional[str] = None,
    aircraft_type: Optional[str] = None,
    user=Depends(get_current_user),
):
    """Реестр директив лётной годности (AD/ДЛГ)."""
    items = list(_directives.values())
    if status:
        items = [d for d in items if d["status"] == status]
    if aircraft_type:
        items = [d for d in items if aircraft_type in d.get("aircraft_types", [])]
    return {"total": len(items), "items": items,
            "legal_basis": "ВК РФ ст. 37; ФАП-148 п.4.3; EASA Part-M.A.301; ICAO Annex 8"}

@router.post("/directives")
def create_directive(data: DirectiveCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Зарегистрировать директиву ЛГ."""
    did = str(uuid.uuid4())
    d = {"id": did, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _directives[did] = d
    if data.compliance_type == "mandatory":
        try:
            from app.services.ws_manager import notify_new_ad
            asyncio.create_task(notify_new_ad(data.number, data.aircraft_types, data.compliance_type))
        except Exception:
            pass
    audit(db, user, "create", "directive", entity_id=did, description=f"ДЛГ: {data.number}")
    db.commit()
    return d

@router.get("/directives/{directive_id}")
def get_directive(directive_id: str, user=Depends(get_current_user)):
    d = _directives.get(directive_id)
    if not d: raise HTTPException(404, "Directive not found")
    return d

@router.put("/directives/{directive_id}/comply")
def comply_directive(directive_id: str, compliance_date: str = "", notes: str = "",
                     db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Отметить выполнение ДЛГ."""
    d = _directives.get(directive_id)
    if not d: raise HTTPException(404)
    d["status"] = "complied"
    d["compliance_date"] = compliance_date or datetime.now(timezone.utc).isoformat()
    d["compliance_notes"] = notes
    audit(db, user, "comply", "directive", entity_id=directive_id, description=f"ДЛГ выполнена: {d['number']}")
    db.commit()
    return d


# ===================================================================
#  2. СЕРВИСНЫЕ БЮЛЛЕТЕНИ (SB)
# ===================================================================

class BulletinCreate(BaseModel):
    number: str = Field(..., description="Номер SB (напр. SB-737-32-1456)")
    title: str
    manufacturer: str = Field(..., description="ОКБ / OEM")
    aircraft_types: List[str] = Field(default=[])
    ata_chapter: Optional[str] = None
    category: str = Field("recommended", description="mandatory | alert | recommended | info")
    issued_date: str
    compliance_deadline: Optional[str] = None
    estimated_manhours: Optional[float] = None
    description: str = ""
    related_ad: Optional[str] = Field(None, description="Связанная ДЛГ")
    status: str = Field("open", description="open | incorporated | not_applicable | deferred")

@router.get("/bulletins")
def list_bulletins(status: Optional[str] = None, user=Depends(get_current_user)):
    items = list(_bulletins.values())
    if status: items = [b for b in items if b["status"] == status]
    return {"total": len(items), "items": items,
            "legal_basis": "ФАП-148 п.4.5; EASA Part-M.A.301; Part-21.A.3B"}

@router.post("/bulletins")
def create_bulletin(data: BulletinCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    bid = str(uuid.uuid4())
    b = {"id": bid, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _bulletins[bid] = b
    audit(db, user, "create", "bulletin", entity_id=bid, description=f"SB: {data.number}")
    db.commit()
    return b

@router.put("/bulletins/{bulletin_id}/incorporate")
def incorporate_bulletin(bulletin_id: str, date: str = "", notes: str = "",
                         db: Session = Depends(get_db), user=Depends(get_current_user)):
    b = _bulletins.get(bulletin_id)
    if not b: raise HTTPException(404)
    b["status"] = "incorporated"
    b["incorporation_date"] = date or datetime.now(timezone.utc).isoformat()
    b["incorporation_notes"] = notes
    audit(db, user, "incorporate", "bulletin", entity_id=bulletin_id, description=f"SB выполнен: {b['number']}")
    db.commit()
    return b


# ===================================================================
#  3. РЕСУРСЫ И СРОКИ СЛУЖБЫ (Life Limits)
# ===================================================================

class LifeLimitCreate(BaseModel):
    aircraft_id: Optional[str] = None
    component_name: str
    part_number: str
    serial_number: str
    limit_type: str = Field(..., description="calendar | flight_hours | cycles | combined")
    calendar_limit_months: Optional[int] = None
    flight_hours_limit: Optional[float] = None
    cycles_limit: Optional[int] = None
    current_hours: float = 0
    current_cycles: int = 0
    install_date: Optional[str] = None
    last_overhaul_date: Optional[str] = None
    notes: Optional[str] = None

@router.get("/life-limits")
def list_life_limits(aircraft_id: Optional[str] = None, user=Depends(get_current_user)):
    items = list(_life_limits.values())
    if aircraft_id: items = [ll for ll in items if ll.get("aircraft_id") == aircraft_id]
    # Calculate remaining
    for ll in items:
        remaining = {}
        if ll.get("flight_hours_limit"):
            remaining["hours"] = round(ll["flight_hours_limit"] - ll.get("current_hours", 0), 1)
        if ll.get("cycles_limit"):
            remaining["cycles"] = ll["cycles_limit"] - ll.get("current_cycles", 0)
        if ll.get("calendar_limit_months") and ll.get("install_date"):
            from dateutil.relativedelta import relativedelta
            try:
                install = datetime.fromisoformat(ll["install_date"])
                expiry = install + timedelta(days=ll["calendar_limit_months"] * 30)
                remaining["days"] = (expiry - datetime.now(timezone.utc).replace(tzinfo=None)).days
            except:
                pass
        ll["remaining"] = remaining
        ll["critical"] = any(v <= 0 for v in remaining.values() if isinstance(v, (int, float)))
    return {"total": len(items), "items": items,
            "legal_basis": "ФАП-148 п.4.2; EASA Part-M.A.302; ICAO Annex 8 Part II 4.2"}

@router.post("/life-limits")
def create_life_limit(data: LifeLimitCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    lid = str(uuid.uuid4())
    ll = {"id": lid, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _life_limits[lid] = ll
    audit(db, user, "create", "life_limit", entity_id=lid, description=f"Ресурс: {data.component_name} P/N {data.part_number}")
    db.commit()
    return ll

@router.put("/life-limits/{limit_id}/update-usage")
def update_usage(limit_id: str, hours: Optional[float] = None, cycles: Optional[int] = None,
                 db: Session = Depends(get_db), user=Depends(get_current_user)):
    ll = _life_limits.get(limit_id)
    if not ll: raise HTTPException(404)
    if hours is not None: ll["current_hours"] = hours
    if cycles is not None: ll["current_cycles"] = cycles
    audit(db, user, "update_usage", "life_limit", entity_id=limit_id)
    db.commit()
    return ll


# ===================================================================
#  4. ПРОГРАММЫ ТО (Maintenance Programs)
# ===================================================================

class MaintProgramCreate(BaseModel):
    name: str
    aircraft_type: str
    revision: str = "Rev.0"
    approved_by: Optional[str] = Field(None, description="Кем утверждена (ФАВТ / CAMO)")
    approval_date: Optional[str] = None
    tasks: List[dict] = Field(default=[], description="Список задач ТО с интервалами")

@router.get("/maintenance-programs")
def list_maint_programs(aircraft_type: Optional[str] = None, user=Depends(get_current_user)):
    items = list(_maint_programs.values())
    if aircraft_type: items = [m for m in items if m.get("aircraft_type") == aircraft_type]
    return {"total": len(items), "items": items,
            "legal_basis": "ФАП-148 п.3; EASA Part-M.A.302; ICAO Annex 6 Part I 8.3"}

@router.post("/maintenance-programs")
def create_maint_program(data: MaintProgramCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    mid = str(uuid.uuid4())
    m = {"id": mid, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _maint_programs[mid] = m
    audit(db, user, "create", "maint_program", entity_id=mid, description=f"Программа ТО: {data.name}")
    db.commit()
    return m

@router.get("/maintenance-programs/{program_id}")
def get_maint_program(program_id: str, user=Depends(get_current_user)):
    m = _maint_programs.get(program_id)
    if not m: raise HTTPException(404)
    return m


# ===================================================================
#  5. КАРТОЧКИ КОМПОНЕНТОВ (Component Cards)
# ===================================================================

class ComponentCreate(BaseModel):
    name: str
    part_number: str
    serial_number: str
    aircraft_id: Optional[str] = None
    ata_chapter: Optional[str] = None
    manufacturer: Optional[str] = None
    install_date: Optional[str] = None
    install_position: Optional[str] = None
    current_hours: float = 0
    current_cycles: int = 0
    condition: str = Field("serviceable", description="serviceable | unserviceable | overhauled | scrapped")
    certificate_type: Optional[str] = Field(None, description="EASA Form 1 / FAA 8130-3 / ФАП-145 Форма 1")
    certificate_number: Optional[str] = None
    last_shop_visit: Optional[str] = None
    next_overhaul_due: Optional[str] = None
    notes: Optional[str] = None

@router.get("/components")
def list_components(aircraft_id: Optional[str] = None, condition: Optional[str] = None,
                    page: int = Query(1, ge=1), per_page: int = Query(50, le=200),
                    user=Depends(get_current_user)):
    items = list(_components.values())
    if aircraft_id: items = [c for c in items if c.get("aircraft_id") == aircraft_id]
    if condition: items = [c for c in items if c.get("condition") == condition]
    total = len(items)
    start = (page - 1) * per_page
    return {"total": total, "page": page, "items": items[start:start + per_page],
            "legal_basis": "ФАП-145 п.145.A.42; EASA Part-M.A.501; EASA Part-M.A.307"}

@router.post("/components")
def create_component(data: ComponentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cid = str(uuid.uuid4())
    c = {"id": cid, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _components[cid] = c
    audit(db, user, "create", "component", entity_id=cid, description=f"Компонент: {data.name} S/N {data.serial_number}")
    db.commit()
    return c

@router.get("/components/{component_id}")
def get_component(component_id: str, user=Depends(get_current_user)):
    c = _components.get(component_id)
    if not c: raise HTTPException(404)
    return c

@router.put("/components/{component_id}/transfer")
def transfer_component(component_id: str, new_aircraft_id: str = "", position: str = "",
                       db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Перемещение компонента между ВС (Part-M.A.501)."""
    c = _components.get(component_id)
    if not c: raise HTTPException(404)
    old_aircraft = c.get("aircraft_id", "склад")
    c["aircraft_id"] = new_aircraft_id or None
    c["install_position"] = position
    c["install_date"] = datetime.now(timezone.utc).isoformat()
    audit(db, user, "transfer", "component", entity_id=component_id,
          description=f"Компонент {c['name']} S/N {c['serial_number']}: {old_aircraft} → {new_aircraft_id or 'склад'}")
    db.commit()
    return c


# ===================================================================
#  6. СВОДНЫЙ ОТЧЁТ ПО ЛГ КОНКРЕТНОГО ВС
# ===================================================================
@router.get("/aircraft-status/{aircraft_reg}")
def aircraft_airworthiness_status(aircraft_reg: str, user=Depends(get_current_user)):
    """Полный статус лётной годности конкретного ВС."""
    open_ads = [d for d in _directives.values() if d["status"] == "open"]
    open_sbs = [b for b in _bulletins.values() if b["status"] == "open"]
    critical_ll = [ll for ll in _life_limits.values()
                   if ll.get("remaining", {}) and any(v <= 0 for v in ll["remaining"].values() if isinstance(v, (int, float)))]
    components = [c for c in _components.values() if c.get("aircraft_id")]

    return {
        "aircraft": aircraft_reg,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "open_directives": len(open_ads),
            "open_bulletins": len(open_sbs),
            "critical_life_limits": len(critical_ll),
            "installed_components": len(components),
        },
        "airworthy": len(open_ads) == 0 and len(critical_ll) == 0,
        "legal_basis": "ВК РФ ст. 36, 37, 37.2; ФАП-148; EASA Part-M.A.901; ICAO Annex 8",
    }
