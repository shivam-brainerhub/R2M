import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin
from app.database import get_db
from app.models import Category, Product, Subcategory, User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


def generate_slug(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.strip().lower())
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    return slug or "category"


def get_unique_slug(db: Session, base_slug: str, current_id: Optional[int] = None) -> str:
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


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    search: Optional[str] = Query(None, description="Search categories by name, code or description"),
    sort_by: Optional[str] = Query("code", pattern="^(id|name|code|created_at)$"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """
    List all product categories. Public endpoint accessible without authentication.
    Includes active product count.
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

    # Sorting
    sort_col = getattr(Category, sort_by, Category.code)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col).nulls_last())
    else:
        query = query.order_by(asc(sort_col).nulls_last())

    categories = query.all()

    # Calculate product count for each category
    result = []
    for cat in categories:
        product_count = count_category_products(db, cat.id)
        result.append(
            CategoryResponse(
                id=cat.id,
                name=cat.name,
                slug=cat.slug,
                code=cat.code,
                description=cat.description,
                icon=cat.icon,
                product_count=product_count,
                created_at=cat.created_at,
                updated_at=cat.updated_at,
            )
        )

    return result


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

    product_count = count_category_products(db, cat.id)
    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        code=cat.code,
        description=cat.description,
        icon=cat.icon,
        product_count=product_count,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
    )


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Create a new product category. Requires Admin role.
    """
    existing_name = db.query(Category).filter(Category.name.ilike(payload.name.strip())).first()
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
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
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
            .filter(Category.name.ilike(payload.name.strip()), Category.id != category_id)
            .first()
        )
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with name '{payload.name}' already exists",
            )
        category.name = payload.name.strip()

    if payload.slug is not None and payload.slug.strip() != category.slug:
        category.slug = get_unique_slug(db, generate_slug(payload.slug), current_id=category_id)
    elif payload.name is not None and payload.slug is None:
        # If name updated but slug omitted, generate slug
        category.slug = get_unique_slug(db, generate_slug(payload.name), current_id=category_id)

    if payload.code is not None:
        category.code = payload.code.strip() if payload.code.strip() else None

    if payload.description is not None:
        category.description = payload.description.strip() if payload.description.strip() else None

    if payload.icon is not None:
        category.icon = payload.icon.strip() if payload.icon.strip() else "category"

    db.commit()
    db.refresh(category)

    product_count = count_category_products(db, category.id)
    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        code=category.code,
        description=category.description,
        icon=category.icon,
        product_count=product_count,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
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

    return {"message": f"Category '{name}' deleted successfully"}
