"""
Сертификация персонала ПЛГ — учёт специалистов, аттестация, повышение квалификации.

Правовые основания:
- ВК РФ ст. 8, 52, 53, 54 — авиационный персонал, обязательная аттестация
- ФАП-147 (приказ Минтранса №147 от 12.09.2008) — требования к специалистам по ТО ВС
- ФАП-145 (приказ Минтранса №367 от 18.10.2024) — организации по ТО, персонал
- ФАП-148 (приказ Минтранса №148 от 23.06.2003) — обязанности эксплуатанта по ПЛГ
- EASA Part-66 — Aircraft maintenance licence
- EASA Part-145.A.30 — Personnel requirements
- EASA Part-CAMO.A.305 — Continuing airworthiness management personnel
- ICAO Annex 1 — Personnel Licensing
- ICAO Doc 9760 ch.6 — Maintenance personnel
"""
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user, require_roles
from app.api.helpers import audit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/personnel-plg", tags=["personnel-plg"])


# ===================================================================
#  PYDANTIC MODELS
# ===================================================================

class SpecialistCreate(BaseModel):
    """Создание карточки специалиста ПЛГ."""
    full_name: str = Field(..., min_length=2, max_length=200)
    personnel_number: str = Field(..., min_length=1, max_length=50, description="Табельный номер")
    position: str = Field(..., description="Должность")
    category: str = Field(..., description="Категория: A, B1, B2, B3, C (по EASA Part-66) / I, II, III (по ФАП-147)")
    specializations: List[str] = Field(default=[], description="Типы ВС / специализации")
    organization_id: Optional[str] = None
    license_number: Optional[str] = Field(None, description="Номер свидетельства авиаспециалиста")
    license_issued: Optional[str] = None
    license_expires: Optional[str] = None
    medical_certificate_expires: Optional[str] = None
    notes: Optional[str] = None


class AttestationCreate(BaseModel):
    """Запись об аттестации (первичной или очередной)."""
    specialist_id: str
    attestation_type: str = Field(..., description="initial | periodic | extraordinary | type_rating")
    program_id: str = Field(..., description="ID программы подготовки")
    program_name: str = Field(..., description="Наименование программы")
    training_center: Optional[str] = Field(None, description="АУЦ / учебный центр")
    date_start: str
    date_end: str
    hours_theory: float = Field(0, ge=0)
    hours_practice: float = Field(0, ge=0)
    exam_score: Optional[float] = Field(None, ge=0, le=100)
    result: str = Field(..., description="passed | failed | conditional")
    certificate_number: Optional[str] = None
    certificate_valid_until: Optional[str] = None
    examiner_name: Optional[str] = None
    notes: Optional[str] = None


class QualificationUpgrade(BaseModel):
    """Повышение квалификации."""
    specialist_id: str
    program_id: str
    program_name: str
    program_type: str = Field(..., description="recurrent | type_extension | crs_authorization | ndt | human_factors | sms | fuel_tank | ewis | rvsm | etops")
    training_center: Optional[str] = None
    date_start: str
    date_end: str
    hours_total: float = Field(0, ge=0)
    result: str = Field("passed", description="passed | failed | in_progress")
    certificate_number: Optional[str] = None
    next_due: Optional[str] = None
    notes: Optional[str] = None


# ===================================================================
#  IN-MEMORY STORAGE (production: PostgreSQL models)
# ===================================================================

_specialists: dict = {}
_attestations: dict = {}
_qualifications: dict = {}

# Pre-built training programs per regulatory framework
TRAINING_PROGRAMS = {
    # ============================================
    #  ПЕРВИЧНАЯ АТТЕСТАЦИЯ (ФАП-147, EASA Part-66)
    # ============================================
    "PLG-INIT-001": {
        "id": "PLG-INIT-001",
        "name": "Первичная подготовка специалиста по ПЛГ",
        "type": "initial",
        "legal_basis": "ФАП-147 п.5, п.17; ВК РФ ст. 53, 54; EASA Part-66.A.25",
        "category": "B1/B2",
        "duration_hours": 240,
        "modules": [
            {"code": "M1", "name": "Математика", "hours": 16, "basis": "EASA Part-66 Mod.1"},
            {"code": "M2", "name": "Физика", "hours": 16, "basis": "EASA Part-66 Mod.2"},
            {"code": "M3", "name": "Основы электротехники", "hours": 20, "basis": "EASA Part-66 Mod.3"},
            {"code": "M4", "name": "Основы электроники", "hours": 16, "basis": "EASA Part-66 Mod.4"},
            {"code": "M5", "name": "Цифровые методы / ЭВМ", "hours": 16, "basis": "EASA Part-66 Mod.5"},
            {"code": "M6", "name": "Материалы и комплектующие", "hours": 20, "basis": "EASA Part-66 Mod.6"},
            {"code": "M7", "name": "Практика технического обслуживания", "hours": 40, "basis": "EASA Part-66 Mod.7; ФАП-147 п.17.4"},
            {"code": "M8", "name": "Основы аэродинамики", "hours": 12, "basis": "EASA Part-66 Mod.8"},
            {"code": "M9", "name": "Человеческий фактор", "hours": 16, "basis": "EASA Part-66 Mod.9; ICAO Doc 9859 ch.2"},
            {"code": "M10", "name": "Авиационное законодательство", "hours": 24, "basis": "EASA Part-66 Mod.10; ВК РФ; ФАП-145; ФАП-148"},
            {"code": "M11A", "name": "Аэродинамика самолёта, конструкции и системы", "hours": 32, "basis": "EASA Part-66 Mod.11A"},
            {"code": "M12", "name": "Авиационные двигатели (вертолёты/самолёты)", "hours": 24, "basis": "EASA Part-66 Mod.12/15"},
            {"code": "P1", "name": "Практика на ВС (стажировка)", "hours": 0, "basis": "ФАП-147 п.17.6; EASA Part-66.A.30(a)", "note": "Не менее 6 месяцев"},
        ],
        "exam": {"theory_pass": 75, "practice_pass": "Демонстрация компетенций"},
        "certificate_validity_years": 0,
        "note": "Свидетельство выдаётся бессрочно при условии прохождения периодических курсов",
    },

    # ============================================
    #  ПЕРИОДИЧЕСКОЕ ПОВЫШЕНИЕ КВАЛИФИКАЦИИ
    # ============================================
    "PLG-REC-001": {
        "id": "PLG-REC-001",
        "name": "Периодическое повышение квалификации специалиста ПЛГ (recurrent)",
        "type": "recurrent",
        "legal_basis": "ФАП-147 п.17.8; ФАП-145 п.145.A.35; EASA Part-145.A.35(d); EASA Part-66.A.40",
        "periodicity": "Каждые 24 месяца",
        "duration_hours": 40,
        "modules": [
            {"code": "R1", "name": "Изменения в авиационном законодательстве", "hours": 8, "basis": "ФАП-145 п.145.A.35; EASA Part-66 Mod.10"},
            {"code": "R2", "name": "Человеческий фактор (refresher)", "hours": 8, "basis": "EASA Part-145.A.30(e); ICAO Doc 9859"},
            {"code": "R3", "name": "Новые методы ТО и диагностики", "hours": 8, "basis": "EASA Part-145.A.35(d)"},
            {"code": "R4", "name": "Безопасность ТО (SMS)", "hours": 8, "basis": "ICAO Annex 19; ВК РФ ст. 24.1"},
            {"code": "R5", "name": "Практические занятия / обзор инцидентов", "hours": 8, "basis": "EASA Part-145.A.35(d); АМРИПП"},
        ],
        "certificate_validity_years": 2,
    },

    # ============================================
    #  ДОПУСК НА ТИП ВС (Type Rating)
    # ============================================
    "PLG-TYPE-001": {
        "id": "PLG-TYPE-001",
        "name": "Подготовка на тип ВС (Type Rating / квалификационная отметка)",
        "type": "type_rating",
        "legal_basis": "ФАП-147 п.17.7, п.17.8; EASA Part-66.A.45; EASA Part-145.A.35(c)",
        "duration_hours": 80,
        "modules": [
            {"code": "T1", "name": "Общее описание типа ВС", "hours": 16, "basis": "EASA Part-66 Appendix III"},
            {"code": "T2", "name": "Конструкция планера", "hours": 16, "basis": "ATA 51-57"},
            {"code": "T3", "name": "Силовая установка", "hours": 16, "basis": "ATA 70-80"},
            {"code": "T4", "name": "Системы ВС", "hours": 16, "basis": "ATA 21-49"},
            {"code": "T5", "name": "Практика на ВС (OJT)", "hours": 16, "basis": "ФАП-147 п.17.8; EASA Part-66.A.45"},
        ],
        "exam": {"theory_pass": 75, "practice_pass": "Демонстрация на ВС"},
        "certificate_validity_years": 0,
        "note": "Квалификационная отметка внесена в свидетельство",
    },

    # ============================================
    #  СПЕЦИАЛЬНЫЕ КУРСЫ
    # ============================================
    "PLG-EWIS-001": {
        "id": "PLG-EWIS-001",
        "name": "EWIS — Электропроводка и соединители",
        "type": "ewis",
        "legal_basis": "EASA Part-145.A.35(f); FAA AC 25.1701-1; ФАП-148",
        "duration_hours": 16,
        "modules": [
            {"code": "E1", "name": "EWIS awareness", "hours": 8},
            {"code": "E2", "name": "EWIS detailed / практика", "hours": 8},
        ],
        "certificate_validity_years": 3,
    },
    "PLG-FUEL-001": {
        "id": "PLG-FUEL-001",
        "name": "FTS — Безопасность топливных баков",
        "type": "fuel_tank",
        "legal_basis": "EASA Part-145.A.35(f); FAA SFAR 88; ФАП-148",
        "duration_hours": 8,
        "modules": [
            {"code": "F1", "name": "Fuel Tank Safety awareness", "hours": 4},
            {"code": "F2", "name": "FTS detailed / практика", "hours": 4},
        ],
        "certificate_validity_years": 3,
    },
    "PLG-NDT-001": {
        "id": "PLG-NDT-001",
        "name": "Неразрушающий контроль (NDT / НК)",
        "type": "ndt",
        "legal_basis": "ФАП-147 п.17.8; EASA Part-145.A.30(g); NAS 410 / EN 4179",
        "duration_hours": 40,
        "modules": [
            {"code": "N1", "name": "Визуальный контроль (VT)", "hours": 8},
            {"code": "N2", "name": "Магнитопорошковый контроль (MT)", "hours": 8},
            {"code": "N3", "name": "Капиллярный контроль (PT)", "hours": 8},
            {"code": "N4", "name": "Ультразвуковой контроль (UT)", "hours": 8},
            {"code": "N5", "name": "Вихретоковый контроль (ET)", "hours": 8},
        ],
        "certificate_validity_years": 5,
    },
    "PLG-HF-001": {
        "id": "PLG-HF-001",
        "name": "Человеческий фактор в ТО (Human Factors / CRM-maintenance)",
        "type": "human_factors",
        "legal_basis": "EASA Part-145.A.30(e); ICAO Doc 9859 ch.2; ФАП-147 п.17.4",
        "duration_hours": 16,
        "modules": [
            {"code": "HF1", "name": "Dirty Dozen + модель SHELL", "hours": 4},
            {"code": "HF2", "name": "Управление ошибками ТО", "hours": 4},
            {"code": "HF3", "name": "Коммуникация и работа в команде", "hours": 4},
            {"code": "HF4", "name": "Случаи из практики (MEDA)", "hours": 4},
        ],
        "certificate_validity_years": 2,
    },
    "PLG-SMS-001": {
        "id": "PLG-SMS-001",
        "name": "Система управления безопасностью полётов (SMS) для персонала ПЛГ",
        "type": "sms",
        "legal_basis": "ICAO Annex 19; ICAO Doc 9859; ВК РФ ст. 24.1; EASA Part-145.A.65",
        "duration_hours": 16,
        "modules": [
            {"code": "S1", "name": "Основы SMS: 4 компонента", "hours": 4},
            {"code": "S2", "name": "Идентификация опасностей и оценка рисков", "hours": 4},
            {"code": "S3", "name": "Добровольное сообщение об событиях (VPOR)", "hours": 4},
            {"code": "S4", "name": "Культура безопасности / Just Culture", "hours": 4},
        ],
        "certificate_validity_years": 2,
    },
    "PLG-CRS-001": {
        "id": "PLG-CRS-001",
        "name": "Допуск к подписанию CRS (Certificate of Release to Service)",
        "type": "crs_authorization",
        "legal_basis": "ФАП-145 п.145.A.35; EASA Part-145.A.35(a)(b); ФАП-147 п.17.8",
        "duration_hours": 24,
        "modules": [
            {"code": "C1", "name": "Ответственность подписанта CRS", "hours": 8},
            {"code": "C2", "name": "Документирование ТО", "hours": 8},
            {"code": "C3", "name": "Лётная годность после ТО — проверка", "hours": 8},
        ],
        "certificate_validity_years": 0,
        "note": "Допуск внутренний — утверждается приказом руководителя",
    },
    "PLG-RVSM-001": {
        "id": "PLG-RVSM-001",
        "name": "RVSM — Обслуживание оборудования RVSM",
        "type": "rvsm",
        "legal_basis": "ICAO Doc 9574; EASA AMC 145.A.30; ФАП-128",
        "duration_hours": 8,
        "certificate_validity_years": 3,
    },
    "PLG-ETOPS-001": {
        "id": "PLG-ETOPS-001",
        "name": "ETOPS — ТО для полётов увеличенной дальности",
        "type": "etops",
        "legal_basis": "EASA AMC 20-6; ICAO Annex 6 Part I; ФАП-128",
        "duration_hours": 8,
        "certificate_validity_years": 3,
    },
}


# ===================================================================
#  ENDPOINTS
# ===================================================================

@router.get("/programs", tags=["personnel-plg"])
def list_training_programs():
    """Каталог программ подготовки специалистов ПЛГ."""
    return {
        "total": len(TRAINING_PROGRAMS),
        "programs": list(TRAINING_PROGRAMS.values()),
        "legal_basis": [
            "ФАП-147 (приказ Минтранса №147 от 12.09.2008)",
            "ФАП-145 (приказ Минтранса №367 от 18.10.2024)",
            "ФАП-148 (приказ Минтранса №148 от 23.06.2003)",
            "EASA Part-66 — Aircraft Maintenance Licence",
            "EASA Part-145.A.30, A.35 — Personnel requirements",
            "EASA Part-CAMO.A.305 — Airworthiness management personnel",
            "ICAO Annex 1 — Personnel Licensing",
            "ICAO Doc 9760 ch.6 — Maintenance personnel",
            "ВК РФ ст. 52, 53, 54 — авиационный персонал",
        ],
    }


@router.get("/programs/{program_id}", tags=["personnel-plg"])
def get_program_detail(program_id: str):
    """Детали программы подготовки с модулями и часами."""
    prog = TRAINING_PROGRAMS.get(program_id)
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    return prog


@router.get("/specialists", tags=["personnel-plg"])
def list_specialists(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    category: Optional[str] = None,
    organization_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=200),
):
    """Реестр специалистов ПЛГ."""
    items = list(_specialists.values())
    if category:
        items = [s for s in items if s.get("category") == category]
    if organization_id:
        items = [s for s in items if s.get("organization_id") == organization_id]
    total = len(items)
    start = (page - 1) * per_page
    return {
        "total": total,
        "page": page,
        "items": items[start:start + per_page],
    }


@router.post("/specialists", tags=["personnel-plg"])
def create_specialist(
    data: SpecialistCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Создать карточку специалиста ПЛГ."""
    sid = str(uuid.uuid4())
    specialist = {
        "id": sid,
        **data.dict(),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "attestations": [],
        "qualifications": [],
    }
    _specialists[sid] = specialist
    audit(db, user, "create", "personnel_plg", entity_id=sid, description=f"Создан специалист: {data.full_name}")
    db.commit()
    return specialist


@router.get("/specialists/{specialist_id}", tags=["personnel-plg"])
def get_specialist(specialist_id: str, user=Depends(get_current_user)):
    """Карточка специалиста с историей аттестаций и квалификаций."""
    spec = _specialists.get(specialist_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Specialist not found")

    # Attach attestations and qualifications
    spec["attestations"] = [a for a in _attestations.values() if a["specialist_id"] == specialist_id]
    spec["qualifications"] = [q for q in _qualifications.values() if q["specialist_id"] == specialist_id]

    # Calculate compliance status
    now = datetime.now(timezone.utc)
    overdue = []
    for q in spec["qualifications"]:
        if q.get("next_due"):
            due = datetime.fromisoformat(q["next_due"])
            if due < now:
                overdue.append(q["program_name"])
    spec["compliance"] = {
        "status": "non_compliant" if overdue else "compliant",
        "overdue_items": overdue,
    }
    return spec


@router.post("/attestations", tags=["personnel-plg"])
def record_attestation(
    data: AttestationCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Записать первичную аттестацию или переаттестацию."""
    if data.specialist_id not in _specialists:
        raise HTTPException(status_code=404, detail="Specialist not found")
    if data.program_id not in TRAINING_PROGRAMS:
        raise HTTPException(status_code=400, detail=f"Unknown program: {data.program_id}")

    aid = str(uuid.uuid4())
    record = {"id": aid, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _attestations[aid] = record
    audit(db, user, "attestation", "personnel_plg", entity_id=data.specialist_id,
          description=f"Аттестация {data.attestation_type}: {data.program_name} — {data.result}")
    db.commit()
    return record


@router.post("/qualifications", tags=["personnel-plg"])
def record_qualification(
    data: QualificationUpgrade,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Записать повышение квалификации."""
    if data.specialist_id not in _specialists:
        raise HTTPException(status_code=404, detail="Specialist not found")

    qid = str(uuid.uuid4())
    record = {"id": qid, **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    _qualifications[qid] = record
    audit(db, user, "qualification", "personnel_plg", entity_id=data.specialist_id,
          description=f"ПК {data.program_type}: {data.program_name} — {data.result}")
    db.commit()
    return record


@router.get("/compliance-report", tags=["personnel-plg"])
def compliance_report(user=Depends(get_current_user)):
    """Отчёт о соответствии: кто просрочил ПК, у кого истекает свидетельство."""
    try:
        return _compliance_report_data()
    except Exception:
        return {"total_specialists": 0, "compliant": 0, "non_compliant": 0, "expiring_soon": [], "overdue": []}


def _compliance_report_data():
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=90)
    report = {"total_specialists": len(_specialists), "compliant": 0, "non_compliant": 0, "expiring_soon": [], "overdue": []}

    for sid, spec in _specialists.items():
        quals = [q for q in _qualifications.values() if q["specialist_id"] == sid]
        is_overdue = False
        for q in quals:
            if q.get("next_due"):
                due = datetime.fromisoformat(q["next_due"])
                if due < now:
                    report["overdue"].append({"specialist": spec["full_name"], "program": q["program_name"], "due": q["next_due"]})
                    is_overdue = True
                elif due < soon:
                    report["expiring_soon"].append({"specialist": spec["full_name"], "program": q["program_name"], "due": q["next_due"]})

        if spec.get("license_expires"):
            lic_exp = datetime.fromisoformat(spec["license_expires"])
            if lic_exp < soon:
                report["expiring_soon"].append({"specialist": spec["full_name"], "item": "Свидетельство", "due": spec["license_expires"]})

        if is_overdue:
            report["non_compliant"] += 1
        else:
            report["compliant"] += 1

    return report




# ===================================================================
#  SCHEDULED: проверка истекающих квалификаций → создание рисков
# ===================================================================

def check_expiring_qualifications(db_session=None):
    """
    Проверяет квалификации персонала.
    Создаёт risk alerts для просроченных и истекающих в <30 дней.
    Вызывается из risk_scheduler (каждые 6 часов).
    
    Правовые основания:
    - ФАП-147 п.17.8: эксплуатант обязан обеспечить действующую квалификацию
    - ФАП-145 п.145.A.30(e): организация обязана иметь квалифицированный персонал
    - EASA Part-145.A.30: personnel requirements
    """
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=30)
    alerts = []

    for sid, spec in _specialists.items():
        # Check license expiry
        if spec.get("license_expires"):
            try:
                exp = datetime.fromisoformat(spec["license_expires"]).replace(tzinfo=timezone.utc)
                if exp < now:
                    alerts.append({
                        "type": "personnel_license_expired",
                        "severity": "critical",
                        "specialist_id": sid,
                        "message": f"Свидетельство {spec.get('license_number', '?')} просрочено",
                    })
                elif exp < soon:
                    alerts.append({
                        "type": "personnel_license_expiring",
                        "severity": "high",
                        "specialist_id": sid,
                        "message": f"Свидетельство {spec.get('license_number', '?')} истекает {exp.strftime('%d.%m.%Y')}",
                    })
            except (ValueError, TypeError):
                pass

        # Check qualification expiry
        quals = [q for q in _qualifications.values() if q["specialist_id"] == sid]
        for q in quals:
            if q.get("next_due"):
                try:
                    due = datetime.fromisoformat(q["next_due"]).replace(tzinfo=timezone.utc)
                    if due < now:
                        alerts.append({
                            "type": "qualification_expired",
                            "severity": "high",
                            "specialist_id": sid,
                            "message": f"ПК просрочена: {q['program_name']}",
                        })
                    elif due < soon:
                        alerts.append({
                            "type": "qualification_expiring",
                            "severity": "medium",
                            "specialist_id": sid,
                            "message": f"ПК истекает: {q['program_name']} — до {due.strftime('%d.%m.%Y')}",
                        })
                except (ValueError, TypeError):
                    pass

        # Check medical certificate
        if spec.get("medical_certificate_expires"):
            try:
                med = datetime.fromisoformat(spec["medical_certificate_expires"]).replace(tzinfo=timezone.utc)
                if med < now:
                    alerts.append({
                        "type": "medical_expired",
                        "severity": "critical",
                        "specialist_id": sid,
                        "message": "Медицинское заключение просрочено",
                    })
            except (ValueError, TypeError):
                pass

    logger.info("Personnel PLG check: %d alerts generated", len(alerts))
    return alerts


@router.get("/expiry-alerts", tags=["personnel-plg"])
def get_expiry_alerts(user=Depends(get_current_user)):
    """Alerts о просроченных и истекающих квалификациях / свидетельствах."""
    alerts = check_expiring_qualifications()
    return {
        "total": len(alerts),
        "critical": len([a for a in alerts if a["severity"] == "critical"]),
        "high": len([a for a in alerts if a["severity"] == "high"]),
        "medium": len([a for a in alerts if a["severity"] == "medium"]),
        "alerts": alerts,
    }



@router.get("/export", tags=["personnel-plg"])
def export_personnel(
    format: str = "json",
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Экспорт реестра специалистов ПЛГ (JSON или CSV)."""
    from app.api.helpers import audit
    from fastapi.responses import StreamingResponse
    from io import StringIO

    items = list(_specialists.values())

    audit(db, user, "export", "personnel_plg",
          description=f"Экспорт персонала ПЛГ ({format}, {len(items)} записей)")
    db.commit()

    if format == "csv":
        buf = StringIO()
        headers = ["id", "full_name", "personnel_number", "position", "category",
                    "license_number", "license_expires", "status"]
        buf.write(",".join(headers) + "\n")
        for s in items:
            row = [str(s.get(h, "")) for h in headers]
            buf.write(",".join(row) + "\n")
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=personnel_plg.csv"},
        )

    return {"total": len(items), "items": items}
