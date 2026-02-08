from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings


def ensure_storage_dir() -> Path:
    base = Path(settings.storage_dir)
    base.mkdir(parents=True, exist_ok=True)
    return base


async def save_upload(owner_kind: str, owner_id: str, file: UploadFile) -> tuple[str, str]:
    """Save uploaded file and return (storage_path, filename)."""
    base = ensure_storage_dir() / owner_kind / owner_id
    base.mkdir(parents=True, exist_ok=True)

    safe_name = os.path.basename(file.filename or "file")
    uid = str(uuid.uuid4())
    stored_name = f"{uid}_{safe_name}"
    dest = base / stored_name

    with dest.open("wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    return str(dest), safe_name
