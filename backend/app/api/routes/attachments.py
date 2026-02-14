from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from app.api.deps import get_current_user
from app.api.helpers import audit
from app.db.session import get_db
from app.models import Attachment
from app.schemas.attachment import AttachmentOut
from app.services.storage import save_upload

router = APIRouter(tags=["attachments"])


@router.post("/attachments/{owner_kind}/{owner_id}", response_model=AttachmentOut)
async def upload_attachment(owner_kind: str, owner_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    storage_path, filename = await save_upload(owner_kind, owner_id, file)
    att = Attachment(
        owner_kind=owner_kind,
        owner_id=owner_id,
        filename=filename,
        content_type=file.content_type,
        storage_path=storage_path,
        uploaded_by_user_id=user.id,
    )
    db.add(att)
    audit(db, user, "create", "attachment", description=f"Uploaded {filename} for {owner_kind}/{owner_id}")
    db.commit()
    db.refresh(att)
    return att


@router.get("/attachments/{attachment_id}", response_model=AttachmentOut)
def get_attachment_meta(attachment_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    att = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Not found")
    return att


@router.get("/attachments/{attachment_id}/download")
def download_attachment(attachment_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    att = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path=att.storage_path, filename=att.filename, media_type=att.content_type)


@router.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(attachment_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    att = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Удаляем файл с диска
    if os.path.exists(att.storage_path):
        try:
            os.remove(att.storage_path)
        except Exception as e:
            # Логируем ошибку, но продолжаем удаление записи из БД
            print(f"Error deleting file {att.storage_path}: {e}")
    
    # Удаляем запись из БД
    audit(db, user, "delete", "attachment", attachment_id, description=f"Deleted {att.filename}")
    db.delete(att)
    db.commit()
    return None


@router.get("/attachments/{owner_kind}/{owner_id}", response_model=list[AttachmentOut])
def list_attachments(
    owner_kind: str,
    owner_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return (
        db.query(Attachment)
        .filter(Attachment.owner_kind == owner_kind)
        .filter(Attachment.owner_id == owner_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )
