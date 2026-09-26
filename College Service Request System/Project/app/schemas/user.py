from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    SERVICE_STAFF = "service_staff"
    SERVICE_LEAD = "service_lead"
    ADMIN = "admin"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime