from datetime import datetime
from pydantic import BaseModel, field_validator


class ORMBase(BaseModel):
    model_config = {"from_attributes": True}


def _coerce_datetime(v):
    """SQLite может вернуть datetime как str — приводим к datetime."""
    if isinstance(v, datetime):
        return v
    if isinstance(v, str):
        s = v.strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f"):
            try:
                return datetime.strptime(s[:26] if fmt.endswith(".%f") else s[:19], fmt)
            except (ValueError, TypeError):
                continue
        try:
            return datetime.fromisoformat(s.replace(" ", "T", 1))
        except Exception:
            pass
    return v


class TimestampOut(ORMBase):
    created_at: datetime
    updated_at: datetime

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def parse_dt(cls, v):
        return _coerce_datetime(v)
