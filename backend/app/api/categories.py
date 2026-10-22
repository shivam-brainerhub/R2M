import re
from typing import List, Optional

from app.core.dependencies import require_permission
from app.database import get_db
from app.models import Category, Product, Subcategory, User
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    SubcategoryCreate,
    SubcategoryResponse,
    SubcategoryUpdate,
)
from app.services.filter_cache import filter_cache_service
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


def generate_slug(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.strip().lower())
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    return slug or "category"


def get_unique_slug(
    db: Session, base_slug: str, current_id: Optional[int] = None
) -> str:
    slug = base_slug
    counter = 1
    while True:
        query = db.query(Category).filter(Category.slug == slug)
        if current_id is not None:
            query = query.filter(Category.id != current_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def count_category_products(db: Session, category_id: int) -> int:
    count = (
        db.query(func.count(func.distinct(Product.id)))
        .outerjoin(Subcategory, Product.subcategory_id == Subcategory.id)
        .filter(
            or_(
                Product.category_id == category_id,
                Subcategory.category_id == category_id,
            )
        )
        .scalar()
    )
    return count or 0


def build_category_response(db: Session, cat: Category) -> CategoryResponse:
    product_count = count_category_products(db, cat.id)
    subcategories_list = []
    if cat.subcategories:
        for sub in sorted(cat.subcategories, key=lambda s: s.name):
            sub_count = (
                db.query(func.count(func.distinct(Product.id)))
                .filter(Product.subcategory_id == sub.id)
                .scalar()
                or 0
            )
            subcategories_list.append(
                SubcategoryResponse(
                    id=sub.id,
                    category_id=sub.category_id,
                    name=sub.name,
                    slug=sub.slug,
                    product_count=sub_count,
                    created_at=sub.created_at,
                    updated_at=sub.updated_at,
                )
            )

    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        code=cat.code,
        description=cat.description,
        icon=cat.icon,
        product_count=product_count,
        subcategories=subcategories_list,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
    )


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    search: Optional[str] = Query(
        None, description="Search categories by name, code or description"
    ),
    sort_by: Optional[str] = Query("code", pattern="^(id|name|code|created_at)$"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$"),
    skip: Optional[int] = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    List all product categories. Public endpoint accessible without authentication.
    Includes active product count, subcategories, and server-side pagination.
    """
    query = db.query(Category)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Category.name.ilike(pattern),
                Category.code.ilike(pattern),
                Category.description.ilike(pattern),
            )
        )

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

    # Sorting
    sort_col = getattr(Category, sort_by, Category.code)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col).nulls_last())
    else:
        query = query.order_by(asc(sort_col).nulls_last())

    if limit is not None:
        categories = query.offset(effective_skip).limit(effective_limit).all()
    else:
        categories = query.all()
    return [build_category_response(db, cat) for cat in categories]


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """
    Get a single category by ID.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return build_category_response(db, cat)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Create a new product category. Requires Admin role.
    """
    existing_name = (
        db.query(Category).filter(Category.name.ilike(payload.name.strip())).first()
    )
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with name '{payload.name}' already exists",
        )

    base_slug = payload.slug.strip() if payload.slug else generate_slug(payload.name)
    slug = get_unique_slug(db, base_slug)

    category = Category(
        name=payload.name.strip(),
        slug=slug,
        code=payload.code.strip() if payload.code else None,
        description=payload.description.strip() if payload.description else None,
        icon=payload.icon.strip() if payload.icon else "category",
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        code=category.code,
        description=category.description,
        icon=category.icon,
        product_count=0,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Update an existing category. Requires Admin role.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if payload.name is not None and payload.name.strip() != category.name:
        existing_name = (
            db.query(Category)
            .filter(
                Category.name.ilike(payload.name.strip()), Category.id != category_id
            )
            .first()
        )
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with name '{payload.name}' already exists",
            )
        category.name = payload.name.strip()

    if payload.slug is not None and payload.slug.strip() != category.slug:
        category.slug = get_unique_slug(
            db, generate_slug(payload.slug), current_id=category_id
        )
    elif payload.name is not None and payload.slug is None:
        # If name updated but slug omitted, generate slug
        category.slug = get_unique_slug(
            db, generate_slug(payload.name), current_id=category_id
        )

    if payload.code is not None:
        category.code = payload.code.strip() if payload.code.strip() else None

    if payload.description is not None:
        category.description = (
            payload.description.strip() if payload.description.strip() else None
        )

    if payload.icon is not None:
        category.icon = payload.icon.strip() if payload.icon.strip() else "category"

    db.commit()
    db.refresh(category)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return build_category_response(db, category)


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Delete a category. Requires Admin role.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    name = category.name
    db.delete(category)
    db.commit()

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return {"message": f"Category '{name}' deleted successfully"}


# ---------------------------------------------------------------------------
# Subcategory CRUD Operations
# ---------------------------------------------------------------------------


def get_unique_subcategory_slug(
    db: Session, base_slug: str, current_id: Optional[int] = None
) -> str:
    slug = base_slug
    counter = 1
    while True:
        query = db.query(Subcategory).filter(Subcategory.slug == slug)
        if current_id is not None:
            query = query.filter(Subcategory.id != current_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


@router.post(
    "/{category_id}/subcategories",
    response_model=SubcategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_subcategory(
    category_id: int,
    payload: SubcategoryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Create a new subcategory under the specified category. Requires Admin role.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent category not found",
        )

    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subcategory name cannot be empty",
        )

    existing_name = (
        db.query(Subcategory)
        .filter(
            Subcategory.category_id == category_id, Subcategory.name.ilike(clean_name)
        )
        .first()
    )
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subcategory with name '{clean_name}' already exists in '{category.name}'",
        )

    base_slug = payload.slug.strip() if payload.slug else generate_slug(clean_name)
    slug = get_unique_subcategory_slug(db, base_slug)

    subcat = Subcategory(
        category_id=category_id,
        name=clean_name,
        slug=slug,
    )
    db.add(subcat)
    db.commit()
    db.refresh(subcat)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return SubcategoryResponse(
        id=subcat.id,
        category_id=subcat.category_id,
        name=subcat.name,
        slug=subcat.slug,
        product_count=0,
        created_at=subcat.created_at,
        updated_at=subcat.updated_at,
    )


@router.put("/subcategories/{subcategory_id}", response_model=SubcategoryResponse)
def update_subcategory(
    subcategory_id: int,
    payload: SubcategoryUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Update an existing subcategory. Requires Admin role.
    """
    subcat = db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    if not subcat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found",
        )

    target_category_id = (
        payload.category_id if payload.category_id is not None else subcat.category_id
    )
    if payload.category_id is not None and payload.category_id != subcat.category_id:
        parent_cat = (
            db.query(Category).filter(Category.id == payload.category_id).first()
        )
        if not parent_cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target category does not exist",
            )
        subcat.category_id = payload.category_id

    if (
        payload.name is not None
        and payload.name.strip()
        and payload.name.strip() != subcat.name
    ):
        clean_name = payload.name.strip()
        existing = (
            db.query(Subcategory)
            .filter(
                Subcategory.category_id == target_category_id,
                Subcategory.name.ilike(clean_name),
                Subcategory.id != subcategory_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subcategory with name '{clean_name}' already exists in this category",
            )
        subcat.name = clean_name

    if (
        payload.slug is not None
        and payload.slug.strip()
        and payload.slug.strip() != subcat.slug
    ):
        subcat.slug = get_unique_subcategory_slug(
            db, generate_slug(payload.slug.strip()), current_id=subcategory_id
        )
    elif payload.name is not None and payload.slug is None:
        subcat.slug = get_unique_subcategory_slug(
            db, generate_slug(subcat.name), current_id=subcategory_id
        )

    db.commit()
    db.refresh(subcat)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    product_count = (
        db.query(func.count(func.distinct(Product.id)))
        .filter(Product.subcategory_id == subcat.id)
        .scalar()
        or 0
    )

    return SubcategoryResponse(
        id=subcat.id,
        category_id=subcat.category_id,
        name=subcat.name,
        slug=subcat.slug,
        product_count=product_count,
        created_at=subcat.created_at,
        updated_at=subcat.updated_at,
    )


@router.delete("/subcategories/{subcategory_id}")
def delete_subcategory(
    subcategory_id: int,
    background_tasks: BackgroundTasks,
    force: bool = Query(
        False, description="If true, unassigns products instead of blocking deletion"
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Delete a subcategory. Requires Admin role.
    If products are assigned, requires force=true to unassign them before deletion.
    """
    subcat = db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    if not subcat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found",
        )

    assigned_count = (
        db.query(Product).filter(Product.subcategory_id == subcategory_id).count()
    )
    if assigned_count > 0:
        if not force:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete subcategory '{subcat.name}' because {assigned_count} product(s) are assigned to it. Reassign those products first or confirm force delete.",
            )
        # Unlink products safely so they remain in parent category
        db.query(Product).filter(Product.subcategory_id == subcategory_id).update(
            {"subcategory_id": None}, synchronize_session="fetch"
        )

    name = subcat.name
    db.delete(subcat)
    db.commit()

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return {
        "message": f"Subcategory '{name}' deleted successfully",
        "unassigned_products": assigned_count,
    }


# Direct subcategories router for /api/subcategories
subcategories_router = APIRouter(
    prefix="/subcategories",
    tags=["Categories & Subcategories"],
)


@subcategories_router.post(
    "", response_model=SubcategoryResponse, status_code=status.HTTP_201_CREATED
)
def create_subcategory_direct(
    payload: SubcategoryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    if not payload.category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="category_id is required",
        )
    return create_subcategory(
        payload.category_id, payload, background_tasks, db, current_admin
    )


@subcategories_router.put("/{subcategory_id}", response_model=SubcategoryResponse)
def update_subcategory_direct(
    subcategory_id: int,
    payload: SubcategoryUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    return update_subcategory(
        subcategory_id, payload, background_tasks, db, current_admin
    )


@subcategories_router.delete("/{subcategory_id}")
def delete_subcategory_direct(
    subcategory_id: int,
    background_tasks: BackgroundTasks,
    force: bool = Query(False),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    return delete_subcategory(
        subcategory_id, background_tasks, force, db, current_admin
    )
