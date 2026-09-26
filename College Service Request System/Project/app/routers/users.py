from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection
from uuid import uuid4
from datetime import datetime

from app.dependencies import (
    get_users_collection,
    get_current_user
)

from app.schemas.user import UserCreate, UserResponse


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate,
    collection: Collection = Depends(get_users_collection),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can create users"
        )

    existing_user = collection.find_one(
        {"email": user.email}
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    user_document = {
        "id": str(uuid4()),
        "name": user.name,
        "email": user.email,
        "password": user.password,
        "role": user.role,
        "created_at": datetime.utcnow()
    }

    collection.insert_one(user_document)

    return user_document


@router.get("/", response_model=list[UserResponse])
def get_users(
    collection: Collection = Depends(get_users_collection),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can view all users"
        )

    return list(
        collection.find({}, {"_id": 0})
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    collection: Collection = Depends(get_users_collection),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        if current_user["id"] != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own profile"
            )

    user = collection.find_one(
        {"id": user_id},
        {"_id": 0}
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user