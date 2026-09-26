from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from pymongo.collection import Collection
from pymongo.database import Database

from jose import JWTError, jwt

from app.database import database
from app.config import settings


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token"
)

def get_db() -> Database:
    return database


def get_users_collection(
    db: Database = Depends(get_db)
) -> Collection:
    return db["users"]


def get_categories_collection(
    db: Database = Depends(get_db)
) -> Collection:
    return db["categories"]


def get_service_requests_collection(
    db: Database = Depends(get_db)
) -> Collection:
    return db["service_requests"]


def get_comments_collection(
    db: Database = Depends(get_db)
) -> Collection:
    return db["comments"]


def get_attachments_collection(
    db: Database = Depends(get_db)
) -> Collection:
    return db["attachments"]


def get_audit_logs_collection(
    db: Database = Depends(get_db)
) -> Collection:
    return db["audit_logs"]


def get_current_user(
    token: str = Depends(oauth2_scheme),
    users_collection: Collection = Depends(get_users_collection)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = users_collection.find_one(
        {"id": user_id},
        {"_id": 0}
    )

    if user is None:
        raise credentials_exception

    return user