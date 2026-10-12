import os
import re
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin
from app.database import get_db
from app.models import Brand, Product, User
from app.schemas.brand import (
    BrandCreate,
    BrandResponse,
    BrandToggleSliderResponse,
    BrandUpdate,
)

router = APIRouter(
    prefix="/brands",
    tags=["Brands & Manufacturers"],
)


def generate_slug(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.strip().lower())
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    return slug or "brand"


def get_unique_slug(db: Session, base_slug: str, current_id: Optional[int] = None) -> str:
    slug = base_slug
    counter = 1
    while True:
        query = db.query(Brand).filter(Brand.slug == slug)
        if current_id is not None:
            query = query.filter(Brand.id != current_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media")
BRAND_MEDIA_DIR = os.path.join(MEDIA_DIR, "brands")
os.makedirs(BRAND_MEDIA_DIR, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}


@router.post("/upload-logo")
def upload_brand_logo(
    file: UploadFile = File(...),
    current_admin: User = Depends(require_admin),
):
    """
    Upload a brand manufacturer logo file. Saved to media/brands disk storage
    and returns relative public media URL (/media/brands/filename.ext).
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File has no name",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}",
        )

    # Generate a clean, unique file name
    clean_stem = re.sub(r"[^\w-]", "_", os.path.splitext(file.filename)[0].lower())
    unique_suffix = uuid.uuid4().hex[:8]
    saved_filename = f"{clean_stem}_{unique_suffix}{ext}"
    target_path = os.path.join(BRAND_MEDIA_DIR, saved_filename)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/media/brands/{saved_filename}",
        "filename": saved_filename,
    }


@router.get("", response_model=List[BrandResponse])
def list_brands(
    search: Optional[str] = Query(None, description="Search brands by name, country, or description"),
    featured_in_slider: Optional[bool] = Query(None, description="Filter by featured in homepage slider"),
    sort_by: Optional[str] = Query("name", pattern="^(id|name|country|created_at)$"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """
    List all medical brands and manufacturers. Public endpoint.
    Supports filtering by slider status and search.
    """
    query = db.query(Brand)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Brand.name.ilike(pattern),
                Brand.country.ilike(pattern),
                Brand.description.ilike(pattern),
            )
        )

    if featured_in_slider is not None:
        query = query.filter(Brand.featured_in_slider == featured_in_slider)

    sort_col = getattr(Brand, sort_by, Brand.name)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col).nulls_last())
    else:
        query = query.order_by(asc(sort_col).nulls_last())

    brands = query.all()

    result = []
    for brand in brands:
        product_count = db.query(Product).filter(Product.brand_id == brand.id).count()
        result.append(
            BrandResponse(
                id=brand.id,
                name=brand.name,
                slug=brand.slug,
                logo_url=brand.logo_url,
                country=brand.country,
                description=brand.description,
                website_url=brand.website_url,
                featured_in_slider=brand.featured_in_slider,
                product_count=product_count,
                created_at=brand.created_at,
                updated_at=brand.updated_at,
            )
        )

    return result


@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """
    Get a single brand by ID.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )

    product_count = db.query(Product).filter(Product.brand_id == brand.id).count()
    return BrandResponse(
        id=brand.id,
        name=brand.name,
        slug=brand.slug,
        logo_url=brand.logo_url,
        country=brand.country,
        description=brand.description,
        website_url=brand.website_url,
        featured_in_slider=brand.featured_in_slider,
        product_count=product_count,
        created_at=brand.created_at,
        updated_at=brand.updated_at,
    )


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(
    payload: BrandCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Register a new manufacturer / brand. Requires Admin role.
    """
    existing_name = db.query(Brand).filter(Brand.name.ilike(payload.name.strip())).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand with name '{payload.name}' already exists",
        )

    base_slug = payload.slug.strip() if payload.slug else generate_slug(payload.name)
    slug = get_unique_slug(db, base_slug)

    brand = Brand(
        name=payload.name.strip(),
        slug=slug,
        logo_url=payload.logo_url.strip() if payload.logo_url else None,
        country=payload.country.strip() if payload.country else None,
        description=payload.description.strip() if payload.description else None,
        website_url=payload.website_url.strip() if payload.website_url else None,
        featured_in_slider=payload.featured_in_slider,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)

    return BrandResponse(
        id=brand.id,
        name=brand.name,
        slug=brand.slug,
        logo_url=brand.logo_url,
        country=brand.country,
        description=brand.description,
        website_url=brand.website_url,
        featured_in_slider=brand.featured_in_slider,
        product_count=0,
        created_at=brand.created_at,
        updated_at=brand.updated_at,
    )


@router.put("/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: int,
    payload: BrandUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Update brand profile details. Requires Admin role.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )

    if payload.name is not None and payload.name.strip() != brand.name:
        existing_name = (
            db.query(Brand)
            .filter(Brand.name.ilike(payload.name.strip()), Brand.id != brand_id)
            .first()
        )
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Brand with name '{payload.name}' already exists",
            )
        brand.name = payload.name.strip()

    if payload.slug is not None and payload.slug.strip() != brand.slug:
        brand.slug = get_unique_slug(db, generate_slug(payload.slug), current_id=brand_id)
    elif payload.name is not None and payload.slug is None:
        brand.slug = get_unique_slug(db, generate_slug(payload.name), current_id=brand_id)

    if payload.logo_url is not None:
        brand.logo_url = payload.logo_url.strip() if payload.logo_url.strip() else None

    if payload.country is not None:
        brand.country = payload.country.strip() if payload.country.strip() else None

    if payload.description is not None:
        brand.description = payload.description.strip() if payload.description.strip() else None

    if payload.website_url is not None:
        brand.website_url = payload.website_url.strip() if payload.website_url.strip() else None

    if payload.featured_in_slider is not None:
        brand.featured_in_slider = payload.featured_in_slider

    db.commit()
    db.refresh(brand)

    product_count = db.query(Product).filter(Product.brand_id == brand.id).count()
    return BrandResponse(
        id=brand.id,
        name=brand.name,
        slug=brand.slug,
        logo_url=brand.logo_url,
        country=brand.country,
        description=brand.description,
        website_url=brand.website_url,
        featured_in_slider=brand.featured_in_slider,
        product_count=product_count,
        created_at=brand.created_at,
        updated_at=brand.updated_at,
    )


@router.post("/{brand_id}/toggle-slider", response_model=BrandToggleSliderResponse)
@router.patch("/{brand_id}/toggle-slider", response_model=BrandToggleSliderResponse)
def toggle_brand_slider(
    brand_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Toggle brand inclusion in homepage BrandSlider. Requires Admin role.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )

    brand.featured_in_slider = not brand.featured_in_slider
    db.commit()
    db.refresh(brand)

    state_str = "featured on" if brand.featured_in_slider else "removed from"
    return BrandToggleSliderResponse(
        id=brand.id,
        name=brand.name,
        featured_in_slider=brand.featured_in_slider,
        message=f"{brand.name} has been {state_str} the homepage slider",
    )


@router.delete("/{brand_id}")
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Delete a brand. Requires Admin role.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )

    name = brand.name
    db.delete(brand)
    db.commit()

    return {"message": f"Brand '{name}' deleted successfully"}
