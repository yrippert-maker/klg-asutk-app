"""
КЛГ АСУ ТК — FastAPI entry point.
Серверное многопользовательское решение.
Разработчик: АО «REFLY»
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.services.risk_scheduler import setup_scheduler
from app.api.routes import (
    health_router,
    stats_router,
    organizations_router,
    aircraft_router,
    cert_applications_router,
    attachments_router,
    notifications_router,
    ingest_router,
    airworthiness_router,
    modifications_router,
    users_router,
    legal_router,
    risk_alerts_router,
    checklists_router,
    checklist_audits_router,
    inbox_router,
    tasks_router,
    audit_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    # Create tables if they don't exist (dev only; production uses Alembic)
    Base.metadata.create_all(bind=engine)
    # Планировщик рисков: заглушка без app; с app — см. setup_scheduler(app) при необходимости
    setup_scheduler()
    yield


from app.middleware.request_logger import RequestLoggerMiddleware

app = FastAPI(
    title="КЛГ АСУ ТК",
    description="""
## Контроль лётной годности — серверное многопользовательское решение

АО «REFLY» · Система автоматизированного управления техническим контролем.

### Авторизация
- **DEV mode**: `Authorization: Bearer dev` (при ENABLE_DEV_AUTH=true)
- **Production**: Keycloak OIDC — JWT Bearer tokens

### Мульти-тенантность
- PostgreSQL Row-Level Security (RLS)
- Автоматическая изоляция данных по организациям
- Tenant ID из JWT claim `organization_id`

### Роли (RBAC)
| Роль | Доступ |
|------|--------|
| `admin` | Полный доступ ко всем данным и операциям |
| `authority_inspector` | Инспекция, утверждение заявок, аудиты |
| `operator_manager` | Управление ВС и заявками своей организации |
| `operator_user` | Просмотр ВС и создание заявок |
| `mro_manager` | Управление задачами ТОиР |
| `mro_user` | Выполнение задач ТОиР |
    """,
    version="2.1.0",
    openapi_tags=[
        {"name": "aircraft", "description": "Воздушные суда — CRUD + поиск"},
        {"name": "organizations", "description": "Организации — операторы, ТОиР, органы власти"},
        {"name": "cert_applications", "description": "Заявки на сертификацию — workflow submit→review→approve/reject"},
        {"name": "checklists", "description": "Чек-листы и шаблоны — ФАП-М, ATA, CSV"},
        {"name": "audits", "description": "Аудиты воздушных судов"},
        {"name": "risk_alerts", "description": "Предупреждения о рисках — автосканирование"},
        {"name": "airworthiness", "description": "Сертификаты лётной годности"},
        {"name": "modifications", "description": "Модификации и SB/AD"},
        {"name": "notifications", "description": "Уведомления + WebSocket realtime"},
        {"name": "users", "description": "Пользователи и роли"},
        {"name": "audit_log", "description": "Журнал аудита — все изменения в системе"},
        {"name": "inbox", "description": "Входящие документы — загрузка PDF/DOCX"},
        {"name": "ingest", "description": "Импорт данных — CSV/XLSX/ZIP"},
        {"name": "legal", "description": "Нормативно-правовая база"},
        {"name": "attachments", "description": "Файловые вложения"},
        {"name": "stats", "description": "Статистика и дашборд"},
        {"name": "health", "description": "Мониторинг здоровья системы"},
        {"name": "monitoring", "description": "Prometheus метрики"},
    ],
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request logging (после CORS, до роутеров)
# ---------------------------------------------------------------------------
app.add_middleware(RequestLoggerMiddleware)

# ---------------------------------------------------------------------------
# Prometheus metrics
# ---------------------------------------------------------------------------
from app.api.routes.fgis_revs import router as fgis_revs_router
from app.api.routes.notification_prefs import router as notification_prefs_router
from app.api.routes.import_export import router as import_export_router
from app.api.routes.global_search import router as global_search_router
from app.api.routes.work_orders import router as work_orders_router
from app.api.routes.defects import router as defects_router
from app.api.routes.airworthiness_core import router as airworthiness_core_router
from app.api.routes.personnel_plg import router as personnel_plg_router
from app.api.routes.regulator import router as regulator_router
from app.api.routes.backup import router as backup_router
from app.api.routes.batch import router as batch_router
from app.api.routes.export import router as export_router
from app.api.routes.metrics import router as metrics_router, MetricsMiddleware
app.include_router(fgis_revs_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(notification_prefs_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(import_export_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(global_search_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(work_orders_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(defects_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(airworthiness_core_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(personnel_plg_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(regulator_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(backup_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(batch_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(export_router, prefix=settings.API_V1_PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(metrics_router, prefix=settings.API_V1_PREFIX)
app.add_middleware(MetricsMiddleware)


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------
from app.core.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware)


# ---------------------------------------------------------------------------
# Exception handlers (specific first, then generic)
# ---------------------------------------------------------------------------
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.api.exceptions import (
    validation_exception_handler,
    pydantic_validation_error_handler,
    integrity_error_handler,
    sqlalchemy_error_handler,
    general_exception_handler,
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, pydantic_validation_error_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
app.add_exception_handler(Exception, general_exception_handler)


# ---------------------------------------------------------------------------
# Global authentication dependency for all API routes
from app.api.deps import get_current_user
from fastapi import Depends

AUTH_DEPENDENCY = [Depends(get_current_user)]

# Routers — все API v1
# ---------------------------------------------------------------------------
PREFIX = settings.API_V1_PREFIX

app.include_router(health_router, prefix=PREFIX)
app.include_router(stats_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(organizations_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(aircraft_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(cert_applications_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(attachments_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(notifications_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(ingest_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(airworthiness_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(modifications_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(users_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(legal_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(risk_alerts_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(checklists_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(checklist_audits_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(inbox_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(tasks_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)
app.include_router(audit_router, prefix=PREFIX, dependencies=AUTH_DEPENDENCY)

# WebSocket (no prefix — direct path)
from app.api.routes.ws_notifications import router as ws_router
app.include_router(ws_router, prefix=PREFIX, dependencies=[])
