from pydantic import BaseModel
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    request_id: str
    user_id: str
    action: str
    old_value: str | None
    new_value: str | None
    created_at: datetime