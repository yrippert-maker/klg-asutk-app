"""
API маршруты интеграции с ФГИС РЭВС.

Правовые основания:
- ВК РФ ст. 33 — Государственный реестр ГА ВС РФ
- ВК РФ ст. 36 — Сертификат лётной годности
- ВК РФ ст. 37.2 — Поддержание ЛГ (ФЗ-488)
- Приказ Росавиации № 180-П — ФГИС РЭВС
- ФАП-148 п.4.3 — информирование ФАВТ о выполнении ДЛГ
- ФАП-128 — обязательные донесения
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.api.helpers import audit
from app.services.fgis import SyncDirection
from app.services.fgis_revs import fgis_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fgis-revs", tags=["fgis-revs"])


# ===================================================================
#  PULL — получение данных из ФГИС РЭВС
# ===================================================================

@router.get("/aircraft-registry")
def get_fgis_aircraft(
    registration: Optional[str] = None,
    user=Depends(get_current_user),
):
    """
    Запрос реестра ВС из ФГИС РЭВС.
    ВК РФ ст. 33: государственный реестр ГА ВС РФ.
    """
    aircraft = fgis_client.pull_aircraft_registry(registration)
    return {
        "source": "ФГИС РЭВС",
        "legal_basis": "ВК РФ ст. 33; Приказ Минтранса № 98",
        "total": len(aircraft),
        "items": [a.__dict__ for a in aircraft],
    }


@router.get("/certificates")
def get_fgis_certificates(
    registration: Optional[str] = None,
    user=Depends(get_current_user),
):
    """
    Запрос СЛГ из ФГИС РЭВС.
    ВК РФ ст. 36: удостоверение (сертификат) лётной годности.
    """
    certs = fgis_client.pull_certificates(registration)
    return {
        "source": "ФГИС РЭВС",
        "legal_basis": "ВК РФ ст. 36",
        "total": len(certs),
        "items": [c.__dict__ for c in certs],
    }


@router.get("/operators")
def get_fgis_operators(user=Depends(get_current_user)):
    """
    Реестр эксплуатантов из ФГИС РЭВС.
    ФАП-246: сертификация эксплуатантов.
    """
    operators = fgis_client.pull_operators()
    return {
        "source": "ФГИС РЭВС",
        "legal_basis": "ВК РФ ст. 8; ФАП-246",
        "total": len(operators),
        "items": [o.__dict__ for o in operators],
    }


@router.get("/directives")
def get_fgis_directives(
    since_days: int = Query(30, ge=1, le=365),
    user=Depends(get_current_user),
):
    """
    Директивы ЛГ из ФГИС РЭВС за последние N дней.
    ВК РФ ст. 37: обязательные ДЛГ.
    """
    directives = fgis_client.pull_directives()
    return {
        "source": "ФГИС РЭВС",
        "legal_basis": "ВК РФ ст. 37; ФАП-148 п.4.3",
        "total": len(directives),
        "items": [d.__dict__ for d in directives],
    }


@router.get("/maintenance-organizations")
def get_fgis_maint_orgs(user=Depends(get_current_user)):
    """Реестр организаций по ТО (ФАП-145) из ФГИС РЭВС."""
    orgs = fgis_client.pull_maint_organizations()
    return {
        "source": "ФГИС РЭВС",
        "legal_basis": "ФАП-145",
        "total": len(orgs),
        "items": [o.__dict__ for o in orgs],
    }


# ===================================================================
#  PUSH — отправка данных в ФГИС РЭВС
# ===================================================================

class ComplianceReport(BaseModel):
    directive_number: str
    aircraft_registration: str
    compliance_date: str
    work_order_number: str
    crs_signed_by: str
    notes: str = ""

@router.post("/push/compliance-report")
def push_compliance(
    data: ComplianceReport,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Отправить отчёт о выполнении ДЛГ в ФГИС РЭВС.
    ФАП-148 п.4.3: эксплуатант обязан информировать ФАВТ.
    """
    result = fgis_client.push_compliance_report(data.dict())
    audit(db, user, "fgis_push", "compliance_report",
          description=f"ДЛГ {data.directive_number} → ФГИС РЭВС: {result.get('status', '?')}")
    db.commit()
    return {
        "action": "push_compliance",
        "legal_basis": "ФАП-148 п.4.3",
        "result": result,
    }


class MaintenanceReport(BaseModel):
    work_order_number: str
    aircraft_registration: str
    work_type: str
    completion_date: str
    crs_signed_by: str
    actual_manhours: float = 0
    findings: str = ""

@router.post("/push/maintenance-report")
def push_maintenance(
    data: MaintenanceReport,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Отправить данные о выполненном ТО (CRS) в ФГИС РЭВС.
    ФАП-145 п.A.55: документация о выполненном ТО.
    """
    result = fgis_client.push_maintenance_report(data.dict())
    audit(db, user, "fgis_push", "maintenance_report",
          description=f"WO {data.work_order_number} → ФГИС РЭВС: {result.get('status', '?')}")
    db.commit()
    return {"action": "push_maintenance", "legal_basis": "ФАП-145 п.A.55", "result": result}


class DefectReport(BaseModel):
    aircraft_registration: str
    defect_description: str
    severity: str
    ata_chapter: str = ""
    discovered_during: str = ""

@router.post("/push/defect-report")
def push_defect(
    data: DefectReport,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Обязательное донесение о дефекте в ФАВТ через ФГИС РЭВС.
    ФАП-128: обязательные донесения о событиях с ВС.
    """
    result = fgis_client.push_defect_report(data.dict())
    audit(db, user, "fgis_push", "defect_report",
          description=f"Дефект {data.aircraft_registration} → ФГИС РЭВС")
    db.commit()
    return {"action": "push_defect", "legal_basis": "ФАП-128", "result": result}


# ===================================================================
#  SYNC — синхронизация реестров
# ===================================================================

@router.post("/sync/aircraft")
def sync_aircraft(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Запустить синхронизацию реестра ВС с ФГИС РЭВС.
    Фоновая задача — результат доступен через /sync/status.
    """
    result = fgis_client.sync_aircraft()
    audit(db, user, "fgis_sync", "aircraft",
          description=f"Sync aircraft: {result.status} ({result.records_synced}/{result.records_total})")
    db.commit()
    return {
        "action": "sync_aircraft",
        "legal_basis": "ВК РФ ст. 33",
        "result": result.__dict__,
    }


@router.post("/sync/certificates")
def sync_certificates(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Синхронизация СЛГ с ФГИС РЭВС."""
    result = fgis_client.sync_certificates()
    audit(db, user, "fgis_sync", "certificates",
          description=f"Sync certs: {result.status}")
    db.commit()
    return {"action": "sync_certificates", "result": result.__dict__}


@router.post("/sync/directives")
def sync_directives(
    since_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Синхронизация директив ЛГ с ФГИС РЭВС.
    Автоматически создаёт новые AD в системе.
    """
    result = fgis_client.sync_directives(since_days)
    audit(db, user, "fgis_sync", "directives",
          description=f"Sync AD: {result.status} ({result.records_synced} synced)")
    db.commit()
    return {"action": "sync_directives", "legal_basis": "ВК РФ ст. 37", "result": result.__dict__}


@router.post("/sync/all")
def sync_all(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Полная синхронизация всех реестров с ФГИС РЭВС."""
    results = {
        "aircraft": fgis_client.sync_aircraft().__dict__,
        "certificates": fgis_client.sync_certificates().__dict__,
        "directives": fgis_client.sync_directives().__dict__,
    }
    audit(db, user, "fgis_sync", "all", description="Full ФГИС РЭВС sync")
    db.commit()
    return {"action": "sync_all", "results": results}


@router.get("/sync/status")
def sync_status(user=Depends(get_current_user)):
    """История и статус синхронизаций."""
    log = fgis_client.get_sync_log()
    return {
        "total_syncs": len(log),
        "last_sync": log[-1] if log else None,
        "history": log[-20:],
    }


# ===================================================================
#  СМЭВ 3.0 — юридически значимый обмен
# ===================================================================

class SMEVRequest(BaseModel):
    service_code: str = Field(..., description="FAVT-001..004")
    data: dict = Field(default={})

@router.post("/smev/send")
def smev_send(
    req: SMEVRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Отправить запрос через СМЭВ 3.0 (юридически значимый обмен).
    Требуется УКЭП (ГОСТ Р 34.10-2012).
    
    Сервисы:
    - FAVT-001: Запрос данных из реестра ВС
    - FAVT-002: Подача заявления на СЛГ
    - FAVT-003: Уведомление о выполнении ДЛГ
    - FAVT-004: Отчёт о ТО
    """
    message_id = fgis_client.smev_send_request(req.service_code, req.data)
    audit(db, user, "smev_send", req.service_code,
          description=f"СМЭВ 3.0: {req.service_code}, msg_id={message_id}")
    db.commit()
    return {
        "action": "smev_send",
        "service_code": req.service_code,
        "message_id": message_id,
        "note": "Ответ будет доступен асинхронно через /smev/responses",
    }


@router.get("/connection-status")
def connection_status(user=Depends(get_current_user)):
    """Статус подключения к ФГИС РЭВС и СМЭВ."""
    return {
        "fgis_revs": {
            "url": fgis_client.config.BASE_URL,
            "status": "mock_mode",
            "note": "Тестовая среда — используются mock-данные. Для production: настроить сертификат ГОСТ.",
        },
        "smev_30": {
            "url": fgis_client.config.SMEV_URL,
            "status": "mock_mode",
            "note": "Требуется УКЭП и регистрация в СМЭВ 3.0.",
        },
        "config": {
            "org_id": fgis_client.config.ORG_ID or "(не задан)",
            "cert_path": fgis_client.config.CERT_PATH,
            "timeout": fgis_client.config.TIMEOUT,
            "max_retries": fgis_client.config.MAX_RETRIES,
        },
    }
