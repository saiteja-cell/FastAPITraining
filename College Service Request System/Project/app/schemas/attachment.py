from pydantic import BaseModel
from datetime import datetime


class AttachmentCreate(BaseModel):
    request_id: str
    uploaded_by: str
    file_name: str
    file_path: str


class AttachmentResponse(BaseModel):
    id: str
    request_id: str
    uploaded_by: str
    file_name: str
    file_path: str
    created_at: datetime