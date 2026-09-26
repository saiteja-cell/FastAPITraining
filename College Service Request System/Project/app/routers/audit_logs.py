from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection
from uuid import uuid4
from datetime import datetime

from app.dependencies import (
    get_audit_logs_collection,
    get_current_user
)

from app.schemas.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


@router.post("/", response_model=AuditLogResponse)
def create_audit_log(
    request_id: str,
    action: str,
    old_value: str | None = None,
    new_value: str | None = None,
    collection: Collection = Depends(
        get_audit_logs_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    audit_document = {
        "id": str(uuid4()),
        "request_id": request_id,
        "user_id": current_user["id"],
        "action": action,
        "old_value": old_value,
        "new_value": new_value,
        "created_at": datetime.utcnow()
    }

    collection.insert_one(audit_document)

    return audit_document


@router.get(
    "/request/{request_id}",
    response_model=list[AuditLogResponse]
)
def get_request_audit_logs(
    request_id: str,
    collection: Collection = Depends(
        get_audit_logs_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    logs = list(
        collection.find(
            {"request_id": request_id},
            {"_id": 0}
        )
    )

    return logs


@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse
)
def get_audit_log(
    audit_id: str,
    collection: Collection = Depends(
        get_audit_logs_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    log = collection.find_one(
        {"id": audit_id},
        {"_id": 0}
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found"
        )

    return log