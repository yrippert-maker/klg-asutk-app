"""Health check with dependency status."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check with DB, Redis, and service status."""
    checks = {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

    # Database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {"status": "up", "type": "postgresql"}
    except Exception as e:
        checks["database"] = {"status": "down", "error": str(e)[:100]}
        checks["status"] = "degraded"

    # Redis
    try:
        import redis
        import os
        r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), socket_timeout=2)
        r.ping()
        checks["redis"] = {"status": "up"}
    except Exception:
        checks["redis"] = {"status": "down"}
        # Redis is optional — don't degrade status

    # Risk scheduler
    try:
        from app.services.risk_scheduler import get_last_scan_time
        last_scan = get_last_scan_time()
        checks["risk_scanner"] = {
            "status": "running",
            "last_scan": last_scan.isoformat() if last_scan else "never",
        }
    except Exception:
        checks["risk_scanner"] = {"status": "not_configured"}

    # Version info
    checks["version"] = "2.2.0"
    checks["environment"] = "production" if not __import__("os").getenv("ENABLE_DEV_AUTH", "true").lower() == "true" else "development"

    return checks


@router.get("/openapi.json", tags=["health"])
async def export_openapi():
    """Export OpenAPI specification."""
    from app.main import app
    return app.openapi()



@router.get("/health/detailed")
def detailed_health():
    """Расширенная проверка всех компонентов системы."""
    import time
    from app.db.session import SessionLocal
    from app.core.config import settings

    checks = {}

    # Database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        checks["database"] = {"status": "ok", "type": "PostgreSQL"}
    except Exception as e:
        checks["database"] = {"status": "error", "error": str(e)[:100]}

    # Redis (from config)
    try:
        import redis
        r = redis.from_url(settings.REDIS_URL, socket_timeout=2)
        r.ping()
        checks["redis"] = {"status": "ok"}
    except Exception:
        checks["redis"] = {"status": "unavailable", "note": "Optional component"}

    # Disk space
    import shutil
    usage = shutil.disk_usage("/")
    checks["disk"] = {
        "status": "ok" if usage.free > 1_000_000_000 else "warning",
        "free_gb": round(usage.free / 1_000_000_000, 1),
        "total_gb": round(usage.total / 1_000_000_000, 1),
    }

    # Memory
    try:
        import psutil
        mem = psutil.virtual_memory()
        checks["memory"] = {
            "status": "ok" if mem.percent < 90 else "warning",
            "used_percent": mem.percent,
        }
    except ImportError:
        checks["memory"] = {"status": "unknown", "note": "psutil not installed"}

    # Module counts
    from app.api.routes import personnel_plg, airworthiness_core, work_orders, defects
    checks["data"] = {
        "specialists": len(personnel_plg._specialists),
        "directives": len(airworthiness_core._directives),
        "bulletins": len(airworthiness_core._bulletins),
        "work_orders": len(work_orders._work_orders),
        "defects": len(defects._defects),
        "components": len(airworthiness_core._components),
    }

    overall = "ok" if all(c.get("status") in ("ok", "unavailable", "unknown") for c in checks.values() if isinstance(c, dict) and "status" in c) else "degraded"

    return {
        "status": overall,
        "timestamp": time.time(),
        "version": "v26",
        "checks": checks,
    }
