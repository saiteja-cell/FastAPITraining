from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from pymongo.collection import Collection
from jose import jwt
from datetime import datetime, timedelta

from app.dependencies import (
    get_users_collection,
    SECRET_KEY,
    ALGORITHM
)

from app.schemas.auth import LoginRequest, LoginResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ---------------------------------------------------------
# Normal login used by React frontend
# ---------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    collection: Collection = Depends(get_users_collection)
):
    user = collection.find_one({
        "email": login_data.email,
        "password": login_data.password
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_data = {
        "sub": user["id"],
        "role": user["role"]
    }

    access_token = jwt.encode(
        {
            **token_data,
            "exp": datetime.utcnow() + timedelta(hours=2)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ---------------------------------------------------------
# OAuth2 login used by Swagger Authorize button
# ---------------------------------------------------------

@router.post("/token")
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    collection: Collection = Depends(get_users_collection)
):
    user = collection.find_one({
        "email": form_data.username,
        "password": form_data.password
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_data = {
        "sub": user["id"],
        "role": user["role"]
    }

    access_token = jwt.encode(
        {
            **token_data,
            "exp": datetime.utcnow() + timedelta(hours=2)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }