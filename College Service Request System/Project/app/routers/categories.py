from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection
from uuid import uuid4
from datetime import datetime

from app.dependencies import (
    get_categories_collection,
    get_current_user
)

from app.schemas.category import (
    CategoryCreate,
    CategoryResponse
)


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.post("/", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    collection: Collection = Depends(
        get_categories_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can create categories"
        )

    existing_category = collection.find_one(
        {"name": category.name}
    )

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    category_document = {
        "id": str(uuid4()),
        "name": category.name,
        "description": category.description,
        "created_at": datetime.utcnow()
    }

    collection.insert_one(category_document)

    return category_document


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    collection: Collection = Depends(
        get_categories_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    return list(
        collection.find({}, {"_id": 0})
    )


@router.get(
    "/{category_id}",
    response_model=CategoryResponse
)
def get_category(
    category_id: str,
    collection: Collection = Depends(
        get_categories_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    category = collection.find_one(
        {"id": category_id},
        {"_id": 0}
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category