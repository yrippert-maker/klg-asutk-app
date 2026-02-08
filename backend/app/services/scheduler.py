from __future__ import annotations

from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import CertApplication, CertApplicationStatus
from app.services.notifications import notify
from app.services.risk_scanner import scan_risks

_scheduler: BackgroundScheduler | None = None


def _check_remark_deadlines():
    now = datetime.now(timezone.utc)
    db: Session = SessionLocal()
    try:
        q = db.query(CertApplication).filter(
            CertApplication.status == CertApplicationStatus.REMARKS,
            CertApplication.remarks_deadline_at.isnot(None),
            CertApplication.remarks_deadline_at < now,
        )
        for app in q.all():
            app.status = CertApplicationStatus.EXPIRED
            db.commit()
            # notify applicant
            notify(
                db,
                recipient_user_id=app.created_by_user_id,
                title=f"Заявка {app.number}: срок устранения замечаний истек",
                body=f"Срок {settings.remark_deadline_days} дней истек {app.remarks_deadline_at.isoformat()}. Заявка переведена в статус EXPIRED.",
            )
    finally:
        db.close()


def _scan_risks():
    """Сканирует риски по всем ВС."""
    db: Session = SessionLocal()
    try:
        scan_risks(db)
    except Exception as e:
        # Логируем ошибку, но не падаем
        print(f"Ошибка сканирования рисков: {e}")
    finally:
        db.close()


def start_scheduler(app: FastAPI):
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    # In prod align with ops; here check every 10 minutes.
    _scheduler.add_job(_check_remark_deadlines, trigger=IntervalTrigger(minutes=10), id="remark_deadlines")
    # Сканирование рисков каждый час
    _scheduler.add_job(_scan_risks, trigger=IntervalTrigger(hours=1), id="risk_scan")
    _scheduler.start()

    @app.on_event("shutdown")
    def _shutdown():
        if _scheduler:
            _scheduler.shutdown(wait=False)
