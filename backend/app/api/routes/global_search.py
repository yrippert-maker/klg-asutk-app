"""
Глобальный поиск по всем сущностям АСУ ТК.
Ищет по: ВС, компонентам, директивам, бюллетеням, нарядам, дефектам, персоналу.
"""
import logging
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


@router.get("/global")
def global_search(q: str = Query(..., min_length=2), user=Depends(get_current_user)):
    """Поиск по всем модулям системы."""
    q_lower = q.lower()
    results = []

    # Search in directives
    from app.api.routes.airworthiness_core import _directives, _bulletins, _life_limits, _components
    for d in _directives.values():
        if q_lower in d.get("number", "").lower() or q_lower in d.get("title", "").lower():
            results.append({"type": "directive", "id": d["id"], "title": f"ДЛГ {d['number']}", "subtitle": d.get("title", ""), "url": "/airworthiness-core"})

    # Bulletins
    for b in _bulletins.values():
        if q_lower in b.get("number", "").lower() or q_lower in b.get("title", "").lower():
            results.append({"type": "bulletin", "id": b["id"], "title": f"SB {b['number']}", "subtitle": b.get("title", ""), "url": "/airworthiness-core"})

    # Components
    for c in _components.values():
        if q_lower in c.get("name", "").lower() or q_lower in c.get("part_number", "").lower() or q_lower in c.get("serial_number", "").lower():
            results.append({"type": "component", "id": c["id"], "title": f"{c['name']} P/N {c['part_number']}", "subtitle": f"S/N {c['serial_number']}", "url": "/airworthiness-core"})

    # Work orders
    from app.api.routes.work_orders import _work_orders
    for w in _work_orders.values():
        if q_lower in w.get("wo_number", "").lower() or q_lower in w.get("title", "").lower() or q_lower in w.get("aircraft_reg", "").lower():
            results.append({"type": "work_order", "id": w["id"], "title": f"WO {w['wo_number']}", "subtitle": w.get("title", ""), "url": "/maintenance"})

    # Defects
    from app.api.routes.defects import _defects
    for d in _defects.values():
        if q_lower in d.get("aircraft_reg", "").lower() or q_lower in d.get("description", "").lower():
            results.append({"type": "defect", "id": d["id"], "title": f"Дефект {d['aircraft_reg']}", "subtitle": d.get("description", "")[:80], "url": "/defects"})

    # Personnel
    from app.api.routes.personnel_plg import _specialists
    for s in _specialists.values():
        if q_lower in s.get("full_name", "").lower() or q_lower in s.get("personnel_number", "").lower() or q_lower in s.get("license_number", "").lower():
            results.append({"type": "specialist", "id": s["id"], "title": s["full_name"], "subtitle": f"Кат. {s['category']} · {s.get('license_number', '')}", "url": "/personnel-plg"})

    return {"query": q, "total": len(results), "results": results[:50]}
