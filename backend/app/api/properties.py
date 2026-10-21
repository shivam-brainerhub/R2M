from typing import List, Optional

from app.core.dependencies import require_permission
from app.database import get_db
from app.models import Category, ProductPropertyValue, Property, User
from app.schemas.property import PropertyCreate, PropertyResponse, PropertyUpdate
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/properties",
    tags=["Product Properties & Specifications"],
)


@router.get("", response_model=List[PropertyResponse])
def list_properties(
    search: Optional[str] = Query(None, description="Search properties by name"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    group: Optional[str] = Query(None, description="Filter by group"),
    db: Session = Depends(get_db),
):
    """
    List all predefined product properties/specifications.
    Public endpoint used for comparison matrices and product editor dropdowns.
    """
    query = db.query(Property)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(Property.name.ilike(pattern))

    if category_id is not None:
        query = query.filter(
            or_(Property.category_id == category_id, Property.category_id.is_(None))
        )

    if group:
        query = query.filter(Property.group == group)

    properties = query.order_by(Property.name.asc()).all()

    # Pre-fetch counts of products per property
    usage_counts = dict(
        db.query(
            ProductPropertyValue.property_id,
            func.count(ProductPropertyValue.product_id),
        )
        .group_by(ProductPropertyValue.property_id)
        .all()
    )

    result = []
    for prop in properties:
        category_name = prop.category.name if prop.category else None
        result.append(
            PropertyResponse(
                id=prop.id,
                name=prop.name,
                category_id=prop.category_id,
                category_name=category_name,
                group=prop.group,
                description=prop.description,
                product_count=usage_counts.get(prop.id, 0),
                created_at=prop.created_at,
                updated_at=prop.updated_at,
            )
        )
    return result


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    """
    Get a single property by ID.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    product_count = (
        db.query(ProductPropertyValue)
        .filter(ProductPropertyValue.property_id == prop.id)
        .count()
    )

    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        category_id=prop.category_id,
        category_name=prop.category.name if prop.category else None,
        group=prop.group,
        description=prop.description,
        product_count=product_count,
        created_at=prop.created_at,
        updated_at=prop.updated_at,
    )


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Create a new product property / attribute definition. Requires Admin.
    """
    clean_name = payload.name.strip()
    existing = db.query(Property).filter(Property.name.ilike(clean_name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Property '{clean_name}' already exists",
        )

    if payload.category_id:
        cat = db.query(Category).filter(Category.id == payload.category_id).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found",
            )

    prop = Property(
        name=clean_name,
        category_id=payload.category_id,
        group=payload.group.strip() if payload.group else None,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)

    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        category_id=prop.category_id,
        category_name=prop.category.name if prop.category else None,
        group=prop.group,
        description=prop.description,
        product_count=0,
        created_at=prop.created_at,
        updated_at=prop.updated_at,
    )


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Update a property definition. Requires Admin.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    if payload.name is not None and payload.name.strip() != prop.name:
        clean_name = payload.name.strip()
        existing = (
            db.query(Property)
            .filter(Property.name.ilike(clean_name), Property.id != property_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Property '{clean_name}' already exists",
            )
        prop.name = clean_name

    if payload.category_id is not None:
        if payload.category_id == 0:
            prop.category_id = None
        else:
            cat = db.query(Category).filter(Category.id == payload.category_id).first()
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category not found",
                )
            prop.category_id = payload.category_id

    update_data = payload.model_dump(exclude_unset=True)
    if "group" in update_data:
        val = update_data["group"]
        prop.group = val.strip() if (isinstance(val, str) and val.strip()) else None

    if "description" in update_data:
        val = update_data["description"]
        prop.description = (
            val.strip() if (isinstance(val, str) and val.strip()) else None
        )

    db.commit()
    db.refresh(prop)

    product_count = (
        db.query(ProductPropertyValue)
        .filter(ProductPropertyValue.property_id == prop.id)
        .count()
    )

    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        category_id=prop.category_id,
        category_name=prop.category.name if prop.category else None,
        group=prop.group,
        description=prop.description,
        product_count=product_count,
        created_at=prop.created_at,
        updated_at=prop.updated_at,
    )


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("categories", "write")),
):
    """
    Delete a property. Requires Admin.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    name = prop.name
    db.delete(prop)
    db.commit()

    return {"message": f"Property '{name}' deleted successfully"}
