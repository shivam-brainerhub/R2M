from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.api.admin_users import router as admin_users_router
from app.api.auth import router as auth_router
from app.database import Base, SessionLocal, engine
from app.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
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
