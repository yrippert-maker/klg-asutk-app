"""
Scheduled risk scanner — runs periodically to detect new risks.
Uses APScheduler for lightweight background scheduling.
Production: migrate to Celery + Redis for distributed workers.
"""
import logging
from datetime import datetime, timezone
from contextlib import contextmanager

from app.db.session import SessionLocal
from app.services.risk_scanner import scan_risks as scan_risks_for_aircraft

logger = logging.getLogger(__name__)

# Track last scan time
_last_scan: datetime | None = None


@contextmanager
def _get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_scheduled_scan():
    """Run a full risk scan across all aircraft."""
    global _last_scan
    logger.info("Starting scheduled risk scan...")

    with _get_db() as db:
        from app.models import Aircraft
        aircraft_list = db.query(Aircraft).all()

        total_created = 0
        for ac in aircraft_list:
            try:
                created = scan_risks_for_aircraft(db, ac)
                total_created += created
            except Exception as e:
                logger.error(f"Risk scan error for {ac.id}: {e}")

        db.commit()
        _last_scan = datetime.now(timezone.utc)
        logger.info(f"Scheduled scan complete: {total_created} new risks from {len(aircraft_list)} aircraft")

    return total_created


def get_last_scan_time() -> datetime | None:
    return _last_scan


def setup_scheduler(app=None):
    """Setup background scheduler. Без app — заглушка (logger.info). С app — запуск APScheduler."""
    if app is None:
        logger.info("Risk scheduler: stub — планировщик не сконфигурирован (вызовите setup_scheduler(app) при старте).")
        return
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(run_scheduled_scan, 'interval', hours=6, id='risk_scan', next_run_time=None)
        scheduler.start()
        logger.info("Risk scanner scheduler started (interval: 6h)")

        @app.on_event("shutdown")
        def shutdown_scheduler():
            scheduler.shutdown()

    except ImportError:
        logger.warning("APScheduler not installed — scheduled scans disabled. pip install apscheduler")



# ===================================================================
#  ФГИС РЭВС: автоматическая синхронизация (каждые 24ч)
# ===================================================================

def scheduled_fgis_sync():
    """
    Периодическая синхронизация с ФГИС РЭВС.
    Выполняется каждые 24 часа (настраивается).
    
    Порядок:
    1. Pull реестра ВС → обновление локальной БД
    2. Pull СЛГ → проверка сроков действия
    3. Pull новых ДЛГ → создание записей + risk alerts
    4. Log результатов
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from app.services.fgis_revs import fgis_client
        from app.api.routes.fgis_revs import _sync_state
        
        if not _sync_state.get("auto_sync_enabled", True):
            logger.info("ФГИС auto-sync disabled, skipping")
            return
        
        logger.info("=== ФГИС РЭВС auto-sync started ===")
        
        # 1. Sync aircraft
        r1 = fgis_client.sync_aircraft()
        logger.info("Aircraft: %s (%d/%d)", r1.status, r1.records_synced, r1.records_total)
        
        # 2. Sync certificates
        r2 = fgis_client.sync_certificates()
        logger.info("Certificates: %s (%d/%d)", r2.status, r2.records_synced, r2.records_total)
        
        # 3. Sync directives (last 30 days)
        r3 = fgis_client.sync_directives(since_days=30)
        logger.info("Directives: %s (%d/%d)", r3.status, r3.records_synced, r3.records_total)
        
        # 4. Check for new mandatory ADs → create risk alerts
        if r3.records_synced > 0:
            from app.api.routes.airworthiness_core import _directives
            new_mandatory = [d for d in _directives.values() 
                          if d.get("source") == "ФГИС РЭВС" 
                          and d.get("compliance_type") == "mandatory"
                          and d.get("status") == "open"]
            if new_mandatory:
                logger.warning("⚠️ %d new mandatory ADs from ФГИС РЭВС!", len(new_mandatory))
                # Create risk alerts
                from app.api.routes.risk_alerts import _alerts
                import uuid
                from datetime import datetime, timezone
                for ad in new_mandatory:
                    aid = str(uuid.uuid4())
                    _alerts[aid] = {
                        "id": aid,
                        "title": f"Новая обязательная ДЛГ из ФГИС: {ad['number']}",
                        "severity": "critical",
                        "category": "fgis_directive",
                        "status": "open",
                        "source": "ФГИС РЭВС auto-sync",
                        "entity_type": "directive",
                        "entity_id": ad["id"],
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
        
        # 5. Check expired certificates → alerts
        from app.services.fgis_revs import fgis_client as fc
        certs = fc.pull_certificates()
        expired = [c for c in certs if c.status == "expired"]
        if expired:
            logger.warning("⚠️ %d expired certificates found in ФГИС!", len(expired))
        
        from datetime import datetime, timezone
        _sync_state["last_sync"] = datetime.now(timezone.utc).isoformat()
        logger.info("=== ФГИС РЭВС auto-sync completed ===")
        
    except Exception as e:
        logger.error("ФГИС auto-sync error: %s", str(e))
