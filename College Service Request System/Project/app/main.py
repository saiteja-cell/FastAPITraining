from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import ping_database

from app.routers import users
from app.routers import categories
from app.routers import service_requests
from app.routers import comments
from app.routers import attachments
from app.routers import audit_logs
from app.routers import auth


app = FastAPI(
    title=settings.APP_NAME
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users.router)
app.include_router(categories.router)
app.include_router(service_requests.router)
app.include_router(comments.router)
app.include_router(attachments.router)
app.include_router(audit_logs.router)
app.include_router(auth.router)


@app.on_event("startup")
def on_startup() -> None:
    if not ping_database():
        raise RuntimeError(
            "Could not connect to MongoDB"
        )

    print(
        f"[startup] Connected to MongoDB. "
        f"App: {settings.APP_NAME}"
    )


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME
    }