"""
Дефекты и неисправности ВС.
ВК РФ ст. 37.2; ФАП-145 п.145.A.50; EASA Part-M.A.403; ICAO Annex 8 Part II 4.2.3
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
router = APIRouter(prefix="/defects", tags=["defects"])

_defects: dict = {}

class DefectCreate(BaseModel):
    aircraft_reg: str
    ata_chapter: Optional[str] = None
    description: str
    severity: str = Field("minor", description="critical | major | minor")
    discovered_by: Optional[str] = None
    discovered_during: str = Field("preflight", description="preflight | transit | daily | a_check | c_check | report")
    component_pn: Optional[str] = None
    component_sn: Optional[str] = None
    mel_reference: Optional[str] = Field(None, description="MEL/CDL reference если применимо")
    deferred: bool = False
    deferred_until: Optional[str] = None
    corrective_action: Optional[str] = None
    status: str = Field("open", description="open | deferred | rectified | closed")

@router.get("/")
def list_defects(status: Optional[str] = None, aircraft_reg: Optional[str] = None,
                 severity: Optional[str] = None, user=Depends(get_current_user)):
    try:
        items = list(_defects.values())
        if status: items = [d for d in items if d.get("status") == status]
        if aircraft_reg: items = [d for d in items if d.get("aircraft_reg") == aircraft_reg]
        if severity: items = [d for d in items if d.get("severity") == severity]
        return {"total": len(items), "items": items,
                "legal_basis": "ФАП-145 п.145.A.50; EASA Part-M.A.403; ICAO Annex 8"}
    except Exception:
        return {"total": 0, "items": [], "legal_basis": "ФАП-145 п.145.A.50; EASA Part-M.A.403; ICAO Annex 8"}

@router.post("/")
def create_defect(data: DefectCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    did = str(uuid.uuid4())
    d = {"id": did, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _defects[did] = d
    if data.severity == "critical":
        try:
            from app.services.ws_manager import notify_critical_defect
            asyncio.create_task(notify_critical_defect(data.aircraft_reg, data.description, did))
        except Exception:
            pass
    audit(db, user, "create", "defect", entity_id=did, description=f"Дефект: {data.aircraft_reg} — {data.description[:60]}")
    db.commit()
    return d

@router.get("/{defect_id}")
def get_defect(defect_id: str, user=Depends(get_current_user)):
    d = _defects.get(defect_id)
    if not d: raise HTTPException(404)
    return d

@router.put("/{defect_id}/rectify")
def rectify_defect(defect_id: str, action: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = _defects.get(defect_id)
    if not d: raise HTTPException(404)
    d["status"] = "rectified"
    d["corrective_action"] = action
    d["rectified_at"] = datetime.now(timezone.utc).isoformat()
    audit(db, user, "rectify", "defect", entity_id=defect_id, description=f"Дефект устранён: {d['aircraft_reg']}")
    db.commit()
    return d

@router.put("/{defect_id}/defer")
def defer_defect(defect_id: str, mel_ref: str = "", until: str = "",
                 db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Отложить дефект по MEL/CDL (EASA Part-M.A.403(c))."""
    d = _defects.get(defect_id)
    if not d: raise HTTPException(404)
    d["status"] = "deferred"
    d["deferred"] = True
    d["mel_reference"] = mel_ref
    d["deferred_until"] = until
    audit(db, user, "defer", "defect", entity_id=defect_id, description=f"Дефект отложен по MEL: {mel_ref}")
    db.commit()
    return d
