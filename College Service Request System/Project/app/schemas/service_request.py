from pydantic import BaseModel
from datetime import datetime


class ServiceRequestCreate(BaseModel):
    title: str
    description: str
    category_id: str


class ServiceRequestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: str | None = None


class ServiceRequestAssign(BaseModel):
    assigned_to: str


class ServiceRequestStatusUpdate(BaseModel):
    status: str


class ServiceRequestResponse(BaseModel):
    id: str
    title: str
    description: str
    category_id: str
    created_by: str
    status: str
    assigned_to: str | None
    created_at: datetime
    updated_at: datetime