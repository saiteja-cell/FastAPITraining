from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection
from uuid import uuid4
from datetime import datetime

from app.dependencies import (
    get_attachments_collection,
    get_current_user
)

from app.schemas.attachment import (
    AttachmentCreate,
    AttachmentResponse
)


router = APIRouter(
    prefix="/attachments",
    tags=["Attachments"]
)


@router.post("/", response_model=AttachmentResponse)
def create_attachment(
    attachment: AttachmentCreate,
    collection: Collection = Depends(
        get_attachments_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    attachment_document = {
        "id": str(uuid4()),
        "request_id": attachment.request_id,
        "uploaded_by": current_user["id"],
        "file_name": attachment.file_name,
        "file_path": attachment.file_path,
        "created_at": datetime.utcnow()
    }

    collection.insert_one(attachment_document)

    return attachment_document


@router.get(
    "/request/{request_id}",
    response_model=list[AttachmentResponse]
)
def get_request_attachments(
    request_id: str,
    collection: Collection = Depends(
        get_attachments_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    attachments = list(
        collection.find(
            {"request_id": request_id},
            {"_id": 0}
        )
    )

    return attachments


@router.get(
    "/{attachment_id}",
    response_model=AttachmentResponse
)
def get_attachment(
    attachment_id: str,
    collection: Collection = Depends(
        get_attachments_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    attachment = collection.find_one(
        {"id": attachment_id},
        {"_id": 0}
    )

    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found"
        )

    return attachment