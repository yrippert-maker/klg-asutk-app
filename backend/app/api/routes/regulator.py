"""
Панель регулятора ФАВТ — Read-only endpoints.

Данные предоставляются согласно:
- ВК РФ (ст. 8, 36, 37, 67, 68) — сертификация, поддержание лётной годности
- ФАП-246 (приказ Минтранса № 246 от 13.08.2015) — сертификация эксплуатантов
- ФАП-285 (приказ Минтранса № 285 от 25.09.2015) — поддержание лётной годности
- ФГИС РЭВС (приказ Росавиации № 180-П от 09.03.2017) — реестр эксплуатантов и ВС
- ICAO Annex 8 (Airworthiness) — continuing airworthiness, state oversight
- ICAO Annex 6 (Operation of Aircraft) — operator certification
- ICAO Doc 9760 (Airworthiness Manual) — state safety oversight
- EASA Part-M / Part-CAMO — continuing airworthiness management (аналог)
- EASA Part-145 — maintenance organization approvals (аналог)

ПРИНЦИП: Регулятор видит ТОЛЬКО агрегированные / обезличенные данные,
необходимые для функции государственного надзора (oversight).
Коммерческая тайна и персональные данные НЕ раскрываются.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.api.deps import get_db, get_current_user, require_roles
from app.models import Aircraft, Organization, CertApplication, RiskAlert, Audit

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/regulator",
    tags=["regulator-favt"],
)

# === Access: only favt_inspector and admin ===
FAVT_ROLES = Depends(require_roles("favt_inspector", "admin"))


# -----------------------------------------------------------------------
#  1. СВОДНАЯ СТАТИСТИКА (Overview)
#     ВК РФ ст. 8: функция надзора за соблюдением ФАП
#     ICAO Doc 9734 (Safety Oversight Manual): CE-7 surveillance obligations
# -----------------------------------------------------------------------
@router.get("/overview", dependencies=[FAVT_ROLES])
def regulator_overview(db: Session = Depends(get_db)):
    """
    Сводные показатели подконтрольных организаций.
    Не содержит персональных данных — только агрегированные метрики.
    """
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    # Воздушные суда по статусу лётной годности
    aircraft_stats = db.query(
        func.count(Aircraft.id).label("total"),
        func.count(case((Aircraft.status == "active", 1))).label("airworthy"),
        func.count(case((Aircraft.status == "maintenance", 1))).label("in_maintenance"),
        func.count(case((Aircraft.status == "grounded", 1))).label("grounded"),
        func.count(case((Aircraft.status == "decommissioned", 1))).label("decommissioned"),
    ).first()

    # Организации по типу
    org_total = db.query(func.count(Organization.id)).scalar() or 0

    # Заявки на сертификацию
    cert_stats = db.query(
        func.count(CertApplication.id).label("total"),
        func.count(case((CertApplication.status == "pending", 1))).label("pending"),
        func.count(case((CertApplication.status == "approved", 1))).label("approved"),
        func.count(case((CertApplication.status == "rejected", 1))).label("rejected"),
    ).first()

    # Риски
    risk_stats = db.query(
        func.count(RiskAlert.id).label("total"),
        func.count(case((RiskAlert.severity == "critical", 1))).label("critical"),
        func.count(case((RiskAlert.severity == "high", 1))).label("high"),
        func.count(case((RiskAlert.resolved == False, 1))).label("unresolved"),
    ).first()

    # Аудиты за 30 дней
    audit_count = db.query(func.count(Audit.id)).filter(
        Audit.created_at >= month_ago
    ).scalar() or 0

    return {
        "generated_at": now.isoformat(),
        "report_period": "current",
        "legal_basis": [
            "ВК РФ ст. 8, 35, 36, 37, 37.2 (60-ФЗ)",
            "ФЗ-488 от 30.12.2021 — ст. 37.2 ВК РФ «Поддержание ЛГ»",
            "ФАП-21 (приказ Минтранса № 184 от 17.06.2019)",
            "ФАП-10 / ФАП-246 (серт. требования к эксплуатантам)",
            "ФАП-128 (подготовка и выполнение полётов)",
            "ФАП-145 (приказ Минтранса № 367 от 18.10.2024) — ТО ГВС",
            "ФАП-147 (требования к членам экипажей, спец. по ТО)",
            "ФАП-148 (требования к эксплуатантам по ПЛГ)",
            "ФАП-149 (электросветотехническое обеспечение)",
            "ICAO Annex 6 — Operation of Aircraft",
            "ICAO Annex 8 — Airworthiness of Aircraft",
            "ICAO Annex 19 — Safety Management",
            "ICAO Doc 9734 — Safety Oversight Manual",
            "ICAO Doc 9760 — Airworthiness Manual",
            "EASA Part-M / Part-CAMO — Continuing Airworthiness",
            "EASA Part-145 — Maintenance Organisation",
            "Поручение Президента РФ Пр-1379 от 17.07.2019",
            "ТЗ АСУ ТК (утв. зам. министра транспорта 24.07.2022)",
        ],
        "aircraft": {
            "total": aircraft_stats.total if aircraft_stats else 0,
            "airworthy": aircraft_stats.airworthy if aircraft_stats else 0,
            "in_maintenance": aircraft_stats.in_maintenance if aircraft_stats else 0,
            "grounded": aircraft_stats.grounded if aircraft_stats else 0,
            "decommissioned": aircraft_stats.decommissioned if aircraft_stats else 0,
        },
        "organizations": {
            "total": org_total,
        },
        "certification": {
            "total_applications": cert_stats.total if cert_stats else 0,
            "pending": cert_stats.pending if cert_stats else 0,
            "approved": cert_stats.approved if cert_stats else 0,
            "rejected": cert_stats.rejected if cert_stats else 0,
        },
        "safety": {
            "total_risks": risk_stats.total if risk_stats else 0,
            "critical": risk_stats.critical if risk_stats else 0,
            "high": risk_stats.high if risk_stats else 0,
            "unresolved": risk_stats.unresolved if risk_stats else 0,
        },
        "audits_last_30d": audit_count,
    }


# -----------------------------------------------------------------------
#  2. РЕЕСТР ВС (Aircraft Register)
#     ВК РФ ст. 33: Государственный реестр гражданских ВС
#     ФГИС РЭВС (приказ Росавиации № 180-П)
#     ICAO Annex 7 — Aircraft Nationality and Registration Marks
# -----------------------------------------------------------------------
@router.get("/aircraft-register", dependencies=[FAVT_ROLES])
def aircraft_register(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None, description="Фильтр: active, grounded, maintenance"),
    aircraft_type: Optional[str] = Query(None, description="Тип ВС"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=200),
):
    """
    Реестр ВС — данные, аналогичные ФГИС РЭВС.
    Раскрываются: рег. знак, тип, статус годности, эксплуатант (название).
    НЕ раскрываются: серийные номера двигателей, стоимость, детали ТО.
    """
    q = db.query(Aircraft)
    if status:
        q = q.filter(Aircraft.status == status)
    if aircraft_type:
        q = q.filter(Aircraft.aircraft_type.ilike(f"%{aircraft_type}%"))

    total = q.count()
    items = q.order_by(Aircraft.registration_number).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "legal_basis": "ВК РФ ст. 33; ФГИС РЭВС; ICAO Annex 7",
        "items": [
            {
                "registration_number": a.registration_number,
                "aircraft_type": a.aircraft_type,
                "status": a.status,
                "organization": a.organization.name if hasattr(a, 'organization') and a.organization else None,
                "cert_expiry": a.cert_expiry.isoformat() if hasattr(a, 'cert_expiry') and a.cert_expiry else None,
            }
            for a in items
        ],
    }


# -----------------------------------------------------------------------
#  3. СЕРТИФИКАЦИЯ ЭКСПЛУАТАНТОВ (Operator Certification)
#     ФАП-246: сертификация эксплуатантов КВП
#     ICAO Annex 6 Part I: AOC requirements
#     EASA Part-ORO (аналог): organization requirements for air operations
# -----------------------------------------------------------------------
@router.get("/certifications", dependencies=[FAVT_ROLES])
def certification_applications(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=200),
):
    """
    Заявки на сертификацию / продление сертификата эксплуатанта.
    Раскрываются: тип заявки, статус, дата, организация (название).
    НЕ раскрываются: внутренние комментарии, персональные данные заявителя.
    """
    q = db.query(CertApplication)
    if status:
        q = q.filter(CertApplication.status == status)

    total = q.count()
    items = q.order_by(CertApplication.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "legal_basis": "ФАП-246; ICAO Annex 6; EASA Part-ORO",
        "items": [
            {
                "id": str(c.id),
                "type": c.type if hasattr(c, 'type') else "certification",
                "status": c.status,
                "organization": c.organization.name if hasattr(c, 'organization') and c.organization else None,
                "submitted_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in items
        ],
    }


# -----------------------------------------------------------------------
#  4. ПОКАЗАТЕЛИ БЕЗОПАСНОСТИ ПОЛЁТОВ (Safety Indicators)
#     ВК РФ ст. 24.1: ГПБП — Государственная программа обеспечения БП
#     ICAO Annex 19 — Safety Management
#     ICAO Doc 9859 (SMM) — Safety Management Manual
#     EASA Part-ORO.GEN.200(a)(6): management system / safety reporting
# -----------------------------------------------------------------------
@router.get("/safety-indicators", dependencies=[FAVT_ROLES])
def safety_indicators(
    db: Session = Depends(get_db),
    days: int = Query(90, ge=7, le=365),
):
    """
    Агрегированные показатели безопасности.
    Категоризация рисков по severity — без раскрытия деталей эксплуатанта.
    Соответствует требованиям ГПБП и Annex 19 Safety Management.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Risk distribution by severity
    severity_dist = db.query(
        RiskAlert.severity,
        func.count(RiskAlert.id),
    ).filter(RiskAlert.created_at >= cutoff).group_by(RiskAlert.severity).all()

    # Risk trend by month
    monthly = db.query(
        func.date_trunc("month", RiskAlert.created_at).label("month"),
        func.count(RiskAlert.id).label("count"),
    ).filter(RiskAlert.created_at >= cutoff).group_by("month").order_by("month").all()

    # Unresolved critical risks count
    critical_open = db.query(func.count(RiskAlert.id)).filter(
        RiskAlert.severity == "critical",
        RiskAlert.resolved == False,
    ).scalar() or 0

    return {
        "period_days": days,
        "legal_basis": "ВК РФ ст. 24.1 (ГПБП); ICAO Annex 19; ICAO Doc 9859",
        "severity_distribution": {s: c for s, c in severity_dist},
        "monthly_trend": [
            {"month": m.isoformat() if m else None, "count": c}
            for m, c in monthly
        ],
        "critical_unresolved": critical_open,
    }


# -----------------------------------------------------------------------
#  5. АУДИТЫ И ИНСПЕКЦИИ (Audit & Inspection Results)
#     ВК РФ ст. 28: инспектирование ГА
#     ICAO Doc 9734 (Safety Oversight Manual): CE-7, CE-8
#     EASA Part-ARO.GEN.300: oversight programme
# -----------------------------------------------------------------------
@router.get("/audits", dependencies=[FAVT_ROLES])
def audit_results(
    db: Session = Depends(get_db),
    days: int = Query(90, ge=7, le=365),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=200),
):
    """
    Результаты аудитов и чек-листов.
    Раскрываются: дата, тип, результат (pass/fail/open).
    НЕ раскрываются: имена инспекторов, детальные замечания.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(Audit).filter(Audit.created_at >= cutoff)
    total = q.count()
    items = q.order_by(Audit.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "total": total,
        "period_days": days,
        "legal_basis": "ВК РФ ст. 28; ICAO Doc 9734 CE-7, CE-8; EASA Part-ARO.GEN.300",
        "items": [
            {
                "id": str(a.id),
                "type": a.checklist_type if hasattr(a, 'checklist_type') else "standard",
                "status": a.status if hasattr(a, 'status') else "completed",
                "aircraft_reg": a.aircraft.registration_number if hasattr(a, 'aircraft') and a.aircraft else None,
                "conducted_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in items
        ],
    }


# -----------------------------------------------------------------------
#  6. ОТЧЁТ ДЛЯ ФАВТ (Exportable Report)
#     Консолидированный отчёт в формате, готовом для загрузки
# -----------------------------------------------------------------------
@router.get("/report", dependencies=[FAVT_ROLES])
def generate_report(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Консолидированный отчёт для ФАВТ — все разделы в одном JSON."""
    from app.api.helpers import audit
    overview = regulator_overview(db)
    safety = safety_indicators(db)

    audit(db, user, "regulator_report", "system",
          description="Сформирован отчёт для ФАВТ")
    db.commit()

    return {
        "report_type": "ФАВТ oversight report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": user.display_name,
        "legal_basis": [
            "ВК РФ ст. 8, 24.1, 28, 33, 36, 37, 67, 68",
            "ФАП-246, ФАП-285",
            "ФГИС РЭВС (приказ Росавиации № 180-П)",
            "ICAO Annex 6, 7, 8, 19",
            "ICAO Doc 9734, Doc 9760, Doc 9859",
            "EASA Part-M, Part-CAMO, Part-145, Part-ARO",
        ],
        "overview": overview,
        "safety": safety,
    }


# -----------------------------------------------------------------------
#  7. PDF ОТЧЁТ ДЛЯ ФАВТ
#     Формат, пригодный для приобщения к делу
# -----------------------------------------------------------------------
@router.get("/report/pdf", dependencies=[FAVT_ROLES])
def generate_pdf_report(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Генерация PDF отчёта для ФАВТ.
    Структура: титульный лист, сводка, реестр ВС, безопасность.
    """
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    from app.api.helpers import audit

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
    except ImportError:
        return {"error": "reportlab not installed. Install with: pip install reportlab"}

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    # Try to register Cyrillic font
    try:
        pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
        font = "DejaVu"
    except Exception:
        font = "Helvetica"

    # Title page
    c.setFont(font, 24)
    c.drawCentredString(w / 2, h - 80 * mm, "ОТЧЁТ")
    c.setFont(font, 14)
    c.drawCentredString(w / 2, h - 95 * mm, "для Федерального агентства воздушного транспорта")
    c.drawCentredString(w / 2, h - 105 * mm, "(Росавиация)")
    c.setFont(font, 10)
    c.drawCentredString(w / 2, h - 125 * mm, f"Дата формирования: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')}")
    c.drawCentredString(w / 2, h - 135 * mm, f"Сформировал: {user.display_name}")
    c.setFont(font, 8)
    c.drawCentredString(w / 2, h - 160 * mm, "Правовые основания: ВК РФ ст. 8, 24.1, 28, 33, 36, 37, 67, 68;")
    c.drawCentredString(w / 2, h - 168 * mm, "ФАП-246, ФАП-285; ICAO Annex 6, 7, 8, 19; EASA Part-M, Part-ARO")
    c.drawCentredString(w / 2, h - 185 * mm, "АСУ ТК КЛГ — АО «REFLY»")
    c.showPage()

    # Overview page
    overview = regulator_overview(db)
    c.setFont(font, 16)
    c.drawString(20 * mm, h - 20 * mm, "1. Сводные показатели")
    c.setFont(font, 10)
    y = h - 40 * mm
    sections = [
        ("Парк ВС", [
            f"Всего: {overview['aircraft']['total']}",
            f"Годные к полётам: {overview['aircraft']['airworthy']}",
            f"На ТО: {overview['aircraft']['in_maintenance']}",
            f"Приостановлены: {overview['aircraft']['grounded']}",
            f"Списаны: {overview['aircraft']['decommissioned']}",
        ]),
        ("Сертификация", [
            f"Всего заявок: {overview['certification']['total_applications']}",
            f"На рассмотрении: {overview['certification']['pending']}",
            f"Одобрено: {overview['certification']['approved']}",
            f"Отклонено: {overview['certification']['rejected']}",
        ]),
        ("Безопасность полётов", [
            f"Всего рисков: {overview['safety']['total_risks']}",
            f"Критические: {overview['safety']['critical']}",
            f"Высокие: {overview['safety']['high']}",
            f"Не устранены: {overview['safety']['unresolved']}",
        ]),
        ("Надзор", [
            f"Аудитов за 30 дней: {overview['audits_last_30d']}",
            f"Организации: {overview['organizations']['total']}",
        ]),
    ]
    for title, items in sections:
        c.setFont(font, 12)
        c.drawString(20 * mm, y, title)
        y -= 6 * mm
        c.setFont(font, 9)
        for item in items:
            c.drawString(25 * mm, y, f"• {item}")
            y -= 5 * mm
        y -= 4 * mm
        if y < 30 * mm:
            c.showPage()
            y = h - 20 * mm

    # Footer
    c.setFont(font, 7)
    c.drawCentredString(w / 2, 10 * mm, "Документ сформирован автоматически. Персональные данные не раскрываются.")
    c.showPage()
    c.save()
    buf.seek(0)

    audit(db, user, "regulator_pdf_report", "system",
          description="Сформирован PDF отчёт для ФАВТ")
    db.commit()

    filename = f"favt_report_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )



# -----------------------------------------------------------------------
#  8. ПЕРСОНАЛ ПЛГ — сводка для регулятора
#     ВК РФ ст. 52-54; ФАП-147; ICAO Annex 1
# -----------------------------------------------------------------------
@router.get("/personnel-summary", dependencies=[FAVT_ROLES])
def personnel_summary():
    """
    Агрегированные данные о персонале ПЛГ для ФАВТ.
    Показываются: количество специалистов, категории, compliance.
    НЕ показываются: ФИО, табельные номера, персональные данные.
    """
    from app.api.routes.personnel_plg import _specialists, _qualifications
    from datetime import datetime, timezone, timedelta

    now = datetime.now(timezone.utc)
    total = len(_specialists)
    by_category = {}
    compliant = 0
    non_compliant = 0

    for sid, spec in _specialists.items():
        cat = spec.get("category", "?")
        by_category[cat] = by_category.get(cat, 0) + 1
        quals = [q for q in _qualifications.values() if q["specialist_id"] == sid]
        is_ok = True
        for q in quals:
            if q.get("next_due"):
                due = datetime.fromisoformat(q["next_due"])
                if due.replace(tzinfo=timezone.utc) < now:
                    is_ok = False
        if is_ok:
            compliant += 1
        else:
            non_compliant += 1

    return {
        "legal_basis": "ВК РФ ст. 52-54; ФАП-147; ICAO Annex 1",
        "total_specialists": total,
        "by_category": by_category,
        "compliant": compliant,
        "non_compliant": non_compliant,
        "compliance_rate": round(compliant / total * 100, 1) if total > 0 else 100.0,
        "note": "ПДн не раскрываются — только агрегированные показатели",
    }



@router.get("/maintenance-summary", dependencies=[FAVT_ROLES])
def maintenance_summary_for_regulator():
    """
    Агрегированные данные о ТО для ФАВТ.
    НЕ раскрываются: детали нарядов, ФИО персонала.
    Правовые основания: ВК РФ ст. 28; ФАП-145; ICAO Doc 9734 CE-7.
    """
    from app.api.routes.work_orders import _work_orders
    from app.api.routes.defects import _defects

    wos = list(_work_orders.values())
    defs = list(_defects.values())

    return {
        "legal_basis": "ВК РФ ст. 28; ФАП-145; ICAO Doc 9734 CE-7",
        "work_orders": {
            "total": len(wos),
            "in_progress": len([w for w in wos if w["status"] == "in_progress"]),
            "closed_last_30d": len([w for w in wos if w["status"] == "closed"]),
            "aog": len([w for w in wos if w.get("priority") == "aog"]),
            "by_type": {},
        },
        "defects": {
            "total": len(defs),
            "open": len([d for d in defs if d["status"] == "open"]),
            "deferred_mel": len([d for d in defs if d.get("deferred")]),
            "critical": len([d for d in defs if d.get("severity") == "critical"]),
        },
        "note": "Детали нарядов и ПДн не раскрываются (ФЗ-152)",
    }
