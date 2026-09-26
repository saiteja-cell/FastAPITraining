from pydantic import BaseModel
from datetime import datetime


class CommentCreate(BaseModel):
    request_id: str
    user_id: str
    comment: str


class CommentResponse(BaseModel):
    id: str
    request_id: str
    user_id: str
    comment: str
    created_at: datetime