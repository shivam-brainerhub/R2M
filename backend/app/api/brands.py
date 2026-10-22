import re
from typing import List, Optional

from app.core.dependencies import require_permission
from app.database import get_db
from app.models import Brand, Product, User
from app.schemas.brand import (
    BrandCreate,
    BrandResponse,
    BrandToggleSliderResponse,
    BrandUpdate,
)
from app.services.filter_cache import filter_cache_service
from app.services.storage import get_storage_service
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/brands",
    tags=["Brands & Manufacturers"],
)


def generate_slug(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.strip().lower())
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    return slug or "brand"


def get_unique_slug(
    db: Session, base_slug: str, current_id: Optional[int] = None
) -> str:
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


ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}


@router.post("/upload-logo")
def upload_brand_logo(
    file: UploadFile = File(...),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Upload a brand manufacturer logo file using the active storage service.
    """
    storage = get_storage_service()
    result = storage.save_file(
        file=file,
        folder="brands",
        allowed_extensions=ALLOWED_IMAGE_EXTENSIONS,
        max_size_bytes=10 * 1024 * 1024,
    )
    return result


@router.get("", response_model=List[BrandResponse])
def list_brands(
    search: Optional[str] = Query(
        None, description="Search brands by name, country, or description"
    ),
    featured_in_slider: Optional[bool] = Query(
        None, description="Filter by featured in homepage slider"
    ),
    sort_by: Optional[str] = Query("name", pattern="^(id|name|country|created_at)$"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$"),
    skip: Optional[int] = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    List all medical brands and manufacturers. Public endpoint.
    Supports filtering by slider status, search, and server-side pagination.
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

    total = query.order_by(None).count()
    effective_skip = skip or 0
    effective_limit = limit if limit is not None else total
    page = (
        (effective_skip // effective_limit) + 1
        if (effective_limit and effective_limit > 0)
        else 1
    )
    total_pages = (
        max(1, (total + effective_limit - 1) // effective_limit)
        if (effective_limit and effective_limit > 0)
        else 1
    )
    has_more = (
        (effective_skip + effective_limit) < total if limit is not None else False
    )

    if response:
        response.headers["X-Total-Count"] = str(total)
        response.headers["X-Page"] = str(page)
        response.headers["X-Page-Size"] = str(effective_limit)
        response.headers["X-Total-Pages"] = str(total_pages)
        response.headers["X-Has-More"] = "true" if has_more else "false"
        response.headers["Access-Control-Expose-Headers"] = (
            "X-Total-Count, X-Page, X-Page-Size, X-Total-Pages, X-Has-More"
        )

    sort_col = getattr(Brand, sort_by, Brand.name)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col).nulls_last())
    else:
        query = query.order_by(asc(sort_col).nulls_last())

    if limit is not None:
        brands = query.offset(effective_skip).limit(effective_limit).all()
    else:
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Register a new manufacturer / brand. Requires Admin role.
    """
    existing_name = (
        db.query(Brand).filter(Brand.name.ilike(payload.name.strip())).first()
    )
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

    background_tasks.add_task(filter_cache_service.refresh_in_background)

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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
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
        brand.slug = get_unique_slug(
            db, generate_slug(payload.slug), current_id=brand_id
        )
    elif payload.name is not None and payload.slug is None:
        brand.slug = get_unique_slug(
            db, generate_slug(payload.name), current_id=brand_id
        )

    if payload.logo_url is not None:
        new_logo = payload.logo_url.strip() if payload.logo_url.strip() else None
        old_logo = brand.logo_url
        if old_logo and old_logo != new_logo:
            # Check if any other brand references the old logo
            other_using = (
                db.query(Brand)
                .filter(Brand.logo_url == old_logo, Brand.id != brand.id)
                .first()
            )
            if not other_using:
                get_storage_service().delete_file(old_logo)
        brand.logo_url = new_logo

    if payload.country is not None:
        brand.country = payload.country.strip() if payload.country.strip() else None

    if payload.description is not None:
        brand.description = (
            payload.description.strip() if payload.description.strip() else None
        )

    if payload.website_url is not None:
        brand.website_url = (
            payload.website_url.strip() if payload.website_url.strip() else None
        )

    if payload.featured_in_slider is not None:
        brand.featured_in_slider = payload.featured_in_slider

    db.commit()
    db.refresh(brand)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

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
    current_admin: User = Depends(require_permission("categories", "write")),
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Delete a brand and clean up its logo from media storage. Requires Admin role.
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )

    name = brand.name
    if brand.logo_url:
        other_using = (
            db.query(Brand)
            .filter(Brand.logo_url == brand.logo_url, Brand.id != brand.id)
            .first()
        )
        if not other_using:
            get_storage_service().delete_file(brand.logo_url)

    db.delete(brand)
    db.commit()

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return {"message": f"Brand '{name}' deleted successfully"}
