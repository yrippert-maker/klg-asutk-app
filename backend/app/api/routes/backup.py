"""
Data backup/restore — export all data as JSON, import from backup.
Admin only. Production: use pg_dump for full backups.
"""
import json
from datetime import datetime

from fastapi import APIRouter, Depends, Response, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles, get_db
from app.api.helpers import audit
from app.models import Aircraft, Organization, CertApplication, RiskAlert, Audit

router = APIRouter(prefix="/backup", tags=["backup"])

BACKUP_MODELS = {
    "aircraft": Aircraft,
    "organizations": Organization,
    "cert_applications": CertApplication,
    "risk_alerts": RiskAlert,
    "audits": Audit,
}


def serialize_row(row) -> dict:
    d = {}
    for col in row.__table__.columns:
        val = getattr(row, col.name, None)
        if isinstance(val, datetime):
            val = val.isoformat()
        d[col.name] = val
    return d


@router.get(
    "/export",
    dependencies=[Depends(require_roles("admin"))],
)
def backup_export(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Export all data as JSON backup."""
    backup = {
        "version": "2.1.0",
        "created_at": datetime.utcnow().isoformat(),
        "created_by": user.email,
        "data": {},
    }
    total = 0
    for name, model in BACKUP_MODELS.items():
        rows = db.query(model).all()
        backup["data"][name] = [serialize_row(r) for r in rows]
        total += len(rows)

    backup["total_records"] = total
    audit(db, user, "backup", "system", description=f"Exported backup: {total} records")
    db.commit()

    return Response(
        content=json.dumps(backup, ensure_ascii=False, indent=2, default=str),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=klg_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        },
    )


@router.get(
    "/stats",
    dependencies=[Depends(require_roles("admin"))],
)
def backup_stats(db: Session = Depends(get_db)):
    """Get record counts for backup preview."""
    stats = {}
    for name, model in BACKUP_MODELS.items():
        stats[name] = db.query(model).count()
    return {"tables": stats, "total": sum(stats.values())}
