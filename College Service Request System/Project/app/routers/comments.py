from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection
from uuid import uuid4
from datetime import datetime

from app.dependencies import (
    get_comments_collection,
    get_current_user
)

from app.schemas.comment import (
    CommentCreate,
    CommentResponse
)


router = APIRouter(
    prefix="/comments",
    tags=["Comments"]
)


@router.post("/", response_model=CommentResponse)
def create_comment(
    comment: CommentCreate,
    collection: Collection = Depends(
        get_comments_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    comment_document = {
        "id": str(uuid4()),
        "request_id": comment.request_id,
        "user_id": current_user["id"],
        "comment": comment.comment,
        "created_at": datetime.utcnow()
    }

    collection.insert_one(comment_document)

    return comment_document


@router.get(
    "/request/{request_id}",
    response_model=list[CommentResponse]
)
def get_request_comments(
    request_id: str,
    collection: Collection = Depends(
        get_comments_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    comments = list(
        collection.find(
            {"request_id": request_id},
            {"_id": 0}
        )
    )

    return comments


@router.get(
    "/{comment_id}",
    response_model=CommentResponse
)
def get_comment(
    comment_id: str,
    collection: Collection = Depends(
        get_comments_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    comment = collection.find_one(
        {"id": comment_id},
        {"_id": 0}
    )

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )

    return comment