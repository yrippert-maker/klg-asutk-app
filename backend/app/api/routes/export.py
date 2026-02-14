"""
Export endpoint — CSV, JSON export of system data.
Production: add XLSX via openpyxl, PDF via reportlab.
"""
import csv
import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles, get_db
from app.api.helpers import audit
from app.models import Aircraft, Organization, CertApplication, RiskAlert, Audit

router = APIRouter(prefix="/export", tags=["export"])

EXPORTABLE = {
    "aircraft": Aircraft,
    "organizations": Organization,
    "cert_applications": CertApplication,
    "risk_alerts": RiskAlert,
    "audits": Audit,
}


@router.get(
    "/{dataset}",
    dependencies=[Depends(require_roles("admin", "authority_inspector", "operator_manager"))],
)
def export_data(
    dataset: str,
    format: str = Query("csv", regex="^(csv|json)$"),
    limit: int = Query(5000, le=50000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Export dataset as CSV or JSON."""
    model = EXPORTABLE.get(dataset)
    if not model:
        return Response(
            content=json.dumps({"error": f"Unknown dataset: {dataset}. Available: {list(EXPORTABLE.keys())}"}),
            media_type="application/json", status_code=400,
        )

    rows = db.query(model).limit(limit).all()
    audit(db, user, "export", dataset, description=f"Exported {len(rows)} {dataset} as {format}")
    db.commit()

    if format == "json":
        data = []
        for row in rows:
            d = {}
            for col in row.__table__.columns:
                val = getattr(row, col.name, None)
                if isinstance(val, datetime):
                    val = val.isoformat()
                d[col.name] = val
            data.append(d)
        return Response(
            content=json.dumps(data, ensure_ascii=False, indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={dataset}_{datetime.utcnow().strftime('%Y%m%d')}.json"},
        )

    # CSV
    output = io.StringIO()
    if rows:
        cols = [col.name for col in rows[0].__table__.columns]
        writer = csv.DictWriter(output, fieldnames=cols)
        writer.writeheader()
        for row in rows:
            d = {}
            for col in cols:
                val = getattr(row, col, None)
                d[col] = val.isoformat() if isinstance(val, datetime) else val
            writer.writerow(d)

    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={dataset}_{datetime.utcnow().strftime('%Y%m%d')}.csv"},
    )
