"""
COD-004: Inbox API — интеграция из Express inbox-server в FastAPI.
Использует тот же формат данных (SQLite + файлы) для совместимости.
"""

import os
import hashlib
import uuid
from pathlib import Path
from typing import Optional
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter(prefix="/inbox", tags=["inbox"])

DATA_DIR = Path(settings.INBOX_DATA_DIR).resolve()
INBOX_DIR = DATA_DIR / "ai-inbox"
DB_PATH = DATA_DIR / "db" / "inbox.db"


def _ensure_dirs():
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def _get_db():
    _ensure_dirs()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS file_registry (
            id TEXT PRIMARY KEY,
            original_name TEXT NOT NULL,
            stored_path TEXT NOT NULL,
            mime TEXT NOT NULL,
            size INTEGER NOT NULL,
            sha256 TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'pending'
        );
        CREATE TABLE IF NOT EXISTS ai_extraction_run (
            id TEXT PRIMARY KEY,
            file_id TEXT NOT NULL,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            status TEXT DEFAULT 'running',
            error TEXT,
            FOREIGN KEY (file_id) REFERENCES file_registry(id)
        );
        CREATE TABLE IF NOT EXISTS ai_extraction_field (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            field_code TEXT NOT NULL,
            value TEXT,
            confidence REAL,
            provenance TEXT,
            FOREIGN KEY (run_id) REFERENCES ai_extraction_run(id)
        );
        CREATE TABLE IF NOT EXISTS tmc_request_draft (
            id TEXT PRIMARY KEY,
            file_id TEXT NOT NULL,
            extraction_run_id TEXT,
            status TEXT DEFAULT 'draft',
            data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (file_id) REFERENCES file_registry(id),
            FOREIGN KEY (extraction_run_id) REFERENCES ai_extraction_run(id)
        );
    """)
    conn.commit()
    return conn


@router.get("/files")
def list_files(user=Depends(get_current_user)):
    """Список файлов в inbox"""
    conn = _get_db()
    try:
        rows = conn.execute(
            "SELECT id, original_name, stored_path, mime, size, sha256, created_at, status FROM file_registry ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@router.post("/upload")
def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Загрузка файла в inbox"""
    allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ]
    if file.content_type not in allowed:
        raise HTTPException(400, "Разрешены только PDF и DOCX")
    max_size = settings.INBOX_UPLOAD_MAX_MB * 1024 * 1024

    _ensure_dirs()
    file_id = str(uuid.uuid4())
    safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in (file.filename or "file"))
    stored_name = f"{file_id}_{safe_name}"
    stored_path = INBOX_DIR / stored_name

    content = file.file.read()
    if len(content) > max_size:
        raise HTTPException(400, f"Файл превышает {settings.INBOX_UPLOAD_MAX_MB} МБ")
    sha256 = hashlib.sha256(content).hexdigest()
    stored_path.write_bytes(content)

    db_path_rel = f"ai-inbox/{stored_name}"
    created_at = __import__("datetime").datetime.utcnow().isoformat() + "Z"

    conn = _get_db()
    try:
        conn.execute(
            "INSERT INTO file_registry (id, original_name, stored_path, mime, size, sha256, created_at, status) VALUES (?,?,?,?,?,?,?,?)",
            (file_id, file.filename or "file", db_path_rel, file.content_type or "application/octet-stream", len(content), sha256, created_at, "pending"),
        )
        conn.commit()
    finally:
        conn.close()

    return {
        "id": file_id,
        "originalName": file.filename or "file",
        "storedPath": db_path_rel,
        "mime": file.content_type or "application/octet-stream",
        "size": len(content),
        "sha256": sha256,
        "createdAt": created_at,
        "status": "pending",
    }


@router.get("/files/{file_id}/download")
def download_file(file_id: str, user=Depends(get_current_user)):
    """Скачать файл"""
    conn = _get_db()
    try:
        row = conn.execute("SELECT * FROM file_registry WHERE id = ?", (file_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(404, "File not found")
    path = DATA_DIR / row["stored_path"] if not str(row["stored_path"]).startswith("/") else Path(row["stored_path"])
    if not path.exists():
        raise HTTPException(404, "File not found on disk")
    return FileResponse(path, filename=row["original_name"])


@router.delete("/files/{file_id}")
def delete_file(file_id: str, user=Depends(get_current_user)):
    """Удалить файл"""
    conn = _get_db()
    try:
        row = conn.execute("SELECT * FROM file_registry WHERE id = ?", (file_id,)).fetchone()
        if not row:
            raise HTTPException(404, "File not found")
        path = DATA_DIR / row["stored_path"] if not str(row["stored_path"]).startswith("/") else Path(row["stored_path"])
        if path.exists():
            path.unlink()
        conn.execute("DELETE FROM file_registry WHERE id = ?", (file_id,))
        conn.commit()
    finally:
        conn.close()
    return {"success": True}
