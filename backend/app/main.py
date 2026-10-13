import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import app.models
from app.api.admin_users import router as admin_users_router
from app.api.auth import router as auth_router
from app.api.brands import router as brands_router
from app.api.categories import router as categories_router
from app.database import Base, SessionLocal, engine
from app.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed initial admin user if not present
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="R2M & SA Healthcare Digital Platform API",
    version="1.0.0",
    description="Backend API for SA Healthcare e-catalogue, quotation engine, and administration.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(admin_users_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(brands_router, prefix="/api")

# Mount Media Files
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


@app.get("/")
def read_root():
    return {"message": "Welcome to R2M API"}


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "r2m-backend",
        "auth_enabled": True,
    }
