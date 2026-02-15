from .health import router as health_router
from .stats import router as stats_router
from .organizations import router as organizations_router
from .aircraft import router as aircraft_router
from .cert_applications import router as cert_applications_router
from .attachments import router as attachments_router
from .notifications import router as notifications_router
from .ingest import router as ingest_router
from .airworthiness import router as airworthiness_router
from .modifications import router as modifications_router
from .users import router as users_router
from .legal import router as legal_router
from .risk_alerts import router as risk_alerts_router
from .checklists import router as checklists_router
from .checklist_audits import router as checklist_audits_router
from .inbox import router as inbox_router
from .tasks import router as tasks_router
from .audit import router as audit_router
from .ai import router as ai_router

__all__ = [
    "health_router",
    "stats_router",
    "organizations_router",
    "aircraft_router",
    "cert_applications_router",
    "attachments_router",
    "notifications_router",
    "ingest_router",
    "airworthiness_router",
    "modifications_router",
    "users_router",
    "legal_router",
    "risk_alerts_router",
    "checklists_router",
    "checklist_audits_router",
    "inbox_router",
    "tasks_router",
    "audit_router",
    "ai_router",
]

