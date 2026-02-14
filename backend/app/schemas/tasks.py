from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    application_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
