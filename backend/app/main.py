import os
from contextlib import asynccontextmanager

from app import models as _models  # noqa: F401
from app.api.admin_users import router as admin_users_router
from app.api.auth import router as auth_router
from app.api.brands import router as brands_router
from app.api.categories import router as categories_router
from app.api.categories import subcategories_router
from app.api.inquiries import router as inquiries_router
from app.api.products import router as products_router
from app.api.properties import router as properties_router
from app.api.quotes import router as quotes_router
from app.api.resources import router as resources_router
from app.api.roles import router as roles_router
from app.api.sectors import router as sectors_router
from app.api.site_content import router as site_content_router
from app.database import SessionLocal
from app.init_db import init_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed initial admin user if not present
    db = SessionLocal()
    try:
        init_db(db)
        # Pre-warm filter options cache in memory
        from app.services.filter_cache import filter_cache_service

        filter_cache_service.get_filter_options(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="R2M & SA Healthcare Digital Platform API",
    version="1.0.0",
    description=(
        "Backend API for SA Healthcare e-catalogue, "
        "quotation engine, and administration."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Total-Count",
        "X-Page",
        "X-Page-Size",
        "X-Total-Pages",
        "X-Has-More",
    ],
)

# Include API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(admin_users_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(subcategories_router, prefix="/api")
app.include_router(brands_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(properties_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(site_content_router, prefix="/api")
app.include_router(inquiries_router, prefix="/api")
app.include_router(quotes_router, prefix="/api")
app.include_router(resources_router, prefix="/api")
app.include_router(sectors_router, prefix="/api")


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
