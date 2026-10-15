import os
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import asc, case, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import (
    Brand,
    Category,
    Document,
    Product,
    ProductImage,
    ProductPropertyValue,
    Property,
    Subcategory,
    User,
)
from app.schemas.product import (
    ProductComparePropertyRow,
    ProductCompareResponse,
    ProductCreate,
    ProductFilterOptionsResponse,
    ProductImageCreate,
    ProductImageResponse,
    ProductPropertyValueResponse,
    ProductResponse,
    ProductStatsResponse,
    ProductUpdate,
)
from app.services.filter_cache import filter_cache_service
from app.services.storage import get_storage_service

router = APIRouter(
    prefix="/products",
    tags=["Products & Catalogue"],
)


def is_media_in_use(
    db: Session,
    file_url: str,
    exclude_product_id: Optional[int] = None,
    exclude_image_id: Optional[int] = None,
) -> bool:
    """
    Checks if a given media URL is still referenced by any product brochure,
    product image, product document, or brand logo (excluding specified IDs).
    """
    if not file_url:
        return False

    clean_url = file_url.strip()

    # Check Product brochure_url
    p_query = db.query(Product).filter(Product.brochure_url == clean_url)
    if exclude_product_id is not None:
        p_query = p_query.filter(Product.id != exclude_product_id)
    if p_query.first():
        return True

    # Check ProductImage image_url
    img_query = db.query(ProductImage).filter(ProductImage.image_url == clean_url)
    if exclude_product_id is not None:
        img_query = img_query.filter(ProductImage.product_id != exclude_product_id)
    if exclude_image_id is not None:
        img_query = img_query.filter(ProductImage.id != exclude_image_id)
    if img_query.first():
        return True

    # Check Document file_url
    doc_query = db.query(Document).filter(Document.file_url == clean_url)
    if exclude_product_id is not None:
        doc_query = doc_query.filter(Document.product_id != exclude_product_id)
    if doc_query.first():
        return True

    # Check Brand logo_url
    b_query = db.query(Brand).filter(Brand.logo_url == clean_url)
    if b_query.first():
        return True

    return False


def generate_slug(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.strip().lower())
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    return slug or "product"


def get_unique_slug(db: Session, base_slug: str, current_id: Optional[int] = None) -> str:
    slug = base_slug
    counter = 1
    while True:
        query = db.query(Product).filter(Product.slug == slug)
        if current_id is not None:
            query = query.filter(Product.id != current_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def build_product_response(product: Product) -> ProductResponse:
    # Build list of images
    image_responses = [
        ProductImageResponse(
            id=img.id,
            image_url=img.image_url,
            alt_text=img.alt_text,
            is_primary=img.is_primary,
            display_order=img.display_order,
        )
        for img in sorted(product.images, key=lambda x: (not x.is_primary, x.display_order))
    ]

    # Build list of property values
    prop_responses = []
    specs_dict: Dict[str, Any] = {}
    for pv in product.property_values:
        if pv.property:
            prop_responses.append(
                ProductPropertyValueResponse(
                    property_id=pv.property_id,
                    name=pv.property.name,
                    value=pv.value,
                    group=pv.property.group,
                )
            )
            specs_dict[pv.property.name] = pv.value

    # If specifications column is empty or missing, populate with specs_dict
    final_specs = product.specifications if product.specifications else specs_dict

    return ProductResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        sku=product.sku,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        subcategory_id=product.subcategory_id,
        subcategory_name=product.subcategory.name if product.subcategory else None,
        brand_id=product.brand_id,
        brand_name=product.brand.name if product.brand else None,
        brand_logo_url=product.brand.logo_url if product.brand else None,
        description=product.description,
        short_description=product.short_description,
        primary_image_url=product.primary_image_url,
        images=image_responses,
        brochure_url=product.brochure_url,
        status=product.status,
        specifications=final_specs,
        properties=prop_responses,
        meta_title=product.meta_title,
        meta_description=product.meta_description,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


# ---------------------------------------------------------------------------
# Upload Endpoints (Brochures & Images via Storage Service)
# ---------------------------------------------------------------------------


@router.post("/upload-brochure")
def upload_product_brochure(
    file: UploadFile = File(...),
    current_admin: User = Depends(require_admin),
):
    """
    Upload a product brochure or datasheet document (PDF, DOC, DOCX).
    Stored via active storage service (local media or cloud storage in future).
    """
    storage = get_storage_service()
    allowed = {".pdf", ".doc", ".docx", ".zip"}
    result = storage.save_file(
        file=file,
        folder="brochures",
        allowed_extensions=allowed,
        max_size_bytes=30 * 1024 * 1024,  # 30MB
    )
    return result


@router.post("/upload-image")
def upload_product_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(require_admin),
):
    """
    Upload a product photography/illustration image.
    Stored via active storage service (local media or cloud storage in future).
    """
    storage = get_storage_service()
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"}
    result = storage.save_file(
        file=file,
        folder="products",
        allowed_extensions=allowed,
        max_size_bytes=15 * 1024 * 1024,  # 15MB
    )
    return result


@router.delete("/media")
def delete_media_file(
    file_url: str = Query(..., description="Public URL or path of the media file to delete"),
    force: bool = Query(False, description="Force delete even if referenced in catalogue"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Explicitly delete an uploaded media file (image, brochure, or document).
    If force is False, verifies that the file is not currently in use by any product or brand.
    Requires Admin role.
    """
    clean_url = file_url.strip()
    if not clean_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_url parameter is required",
        )

    if not force and is_media_in_use(db, clean_url):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="File is currently associated with catalogue products or brands. Remove associations first or use force=true.",
        )

    storage = get_storage_service()
    deleted = storage.delete_file(clean_url)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in storage or could not be deleted",
        )

    return {"message": "Media file removed successfully", "file_url": clean_url}


# ---------------------------------------------------------------------------
# Statistics Endpoint
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=ProductStatsResponse)
def get_product_stats(db: Session = Depends(get_db)):
    """
    Get catalogue overview statistics for dashboard and admin overview.
    """
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.status == "Active").count()
    draft_products = db.query(Product).filter(Product.status == "Draft").count()
    with_brochure_count = (
        db.query(Product)
        .filter(Product.brochure_url.isnot(None), Product.brochure_url != "")
        .count()
    )
    total_brands = db.query(Brand).count()
    total_categories = db.query(Category).count()
    total_properties = db.query(Property).count()

    # Category distribution
    cat_counts = (
        db.query(Category.name, func.count(Product.id))
        .join(Product, Product.category_id == Category.id, isouter=True)
        .group_by(Category.name)
        .all()
    )
    category_distribution = {name: count for name, count in cat_counts}

    # Brand distribution
    brand_counts = (
        db.query(Brand.name, func.count(Product.id))
        .join(Product, Product.brand_id == Brand.id, isouter=True)
        .group_by(Brand.name)
        .all()
    )
    brand_distribution = {name: count for name, count in brand_counts}

    return ProductStatsResponse(
        total_products=total_products,
        active_products=active_products,
        draft_products=draft_products,
        with_brochure_count=with_brochure_count,
        total_brands=total_brands,
        total_categories=total_categories,
        total_properties=total_properties,
        category_distribution=category_distribution,
        brand_distribution=brand_distribution,
    )


# ---------------------------------------------------------------------------
# Precomputed Filter Options Endpoint (Fast In-Memory Cache)
# ---------------------------------------------------------------------------


@router.get("/filters", response_model=ProductFilterOptionsResponse)
def get_product_filters(db: Session = Depends(get_db)):
    """
    Get all precalculated product catalogue filter options (categories, subcategories,
    brands, dynamic specifications/properties, and availability counts).
    Served directly from in-memory cache for ultra-low latency.
    """
    return filter_cache_service.get_filter_options(db)


# ---------------------------------------------------------------------------
# Comparison Endpoint
# ---------------------------------------------------------------------------


@router.get("/compare", response_model=ProductCompareResponse)
def compare_products(
    items: Optional[str] = Query(
        None,
        description="Comma-separated product slugs or IDs (e.g. 'benevision-n12,intellivue-mx450' or '1,2,3')",
    ),
    ids: Optional[str] = Query(
        None,
        description="Alternative comma-separated product IDs (e.g. '1,2,3')",
    ),
    db: Session = Depends(get_db),
):
    """
    Compare multiple medical products side-by-side using unified property rows.
    Supports looking up products by slug (SEO friendly) or ID.
    """
    raw_identifiers = []
    if items:
        raw_identifiers.extend([x.strip() for x in items.split(",") if x.strip()])
    if ids:
        raw_identifiers.extend([x.strip() for x in ids.split(",") if x.strip()])

    if not raw_identifiers:
        return ProductCompareResponse(products=[], properties=[])

    # Fetch products matching slugs or IDs
    products_found: List[Product] = []
    seen_ids = set()

    for ident in raw_identifiers:
        prod = None
        if ident.isdigit():
            prod = db.query(Product).filter(Product.id == int(ident)).first()
        if not prod:
            prod = db.query(Product).filter(Product.slug == ident).first()

        if prod and prod.id not in seen_ids:
            seen_ids.add(prod.id)
            products_found.append(prod)

    product_responses = [build_product_response(p) for p in products_found]

    # Gather all unique properties present across the compared products
    all_props_dict: Dict[str, Dict[str, Any]] = {}
    for p in products_found:
        for pv in p.property_values:
            if pv.property:
                p_name = pv.property.name
                if p_name not in all_props_dict:
                    all_props_dict[p_name] = {
                        "name": p_name,
                        "group": pv.property.group,
                        "values": {},
                    }

    # Populate comparison row values for each product
    comparison_rows: List[ProductComparePropertyRow] = []
    for prop_name, prop_data in all_props_dict.items():
        row_values: Dict[str, Optional[str]] = {}
        for p in products_found:
            # Find matching property value
            matched_val = None
            for pv in p.property_values:
                if pv.property and pv.property.name == prop_name:
                    matched_val = pv.value
                    break
            # Key by product slug (or id as fallback)
            row_values[p.slug] = matched_val
        comparison_rows.append(
            ProductComparePropertyRow(
                name=prop_name,
                group=prop_data["group"],
                values=row_values,
            )
        )

    return ProductCompareResponse(
        products=product_responses,
        properties=comparison_rows,
    )


# ---------------------------------------------------------------------------
# Listing & Detail Endpoints
# ---------------------------------------------------------------------------


@router.get("", response_model=List[ProductResponse])
def list_products(
    search: Optional[str] = Query(None, description="Search by name, SKU, or description"),
    category: Optional[str] = Query(None, description="Filter by category slug or ID"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory slug or ID"),
    brand: Optional[str] = Query(None, description="Filter by brand slug or ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Active, Draft)"),
    sort_by: Optional[str] = Query("name", pattern="^(id|name|sku|created_at)$"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$"),
    limit: Optional[int] = Query(100, ge=1, le=500),
    skip: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    List products with rich filtering by category, subcategory, brand, status, and full-text search.
    Public endpoint.
    """
    query = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.subcategory),
            joinedload(Product.brand),
            joinedload(Product.images),
            joinedload(Product.property_values).joinedload(ProductPropertyValue.property),
        )
    )

    if search:
        pat = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(pat),
                Product.sku.ilike(pat),
                Product.description.ilike(pat),
                Product.short_description.ilike(pat),
            )
        )

    if category:
        if category.isdigit():
            query = query.filter(Product.category_id == int(category))
        else:
            cat = db.query(Category).filter(Category.slug == category).first()
            if cat:
                query = query.filter(Product.category_id == cat.id)

    if subcategory:
        if subcategory.isdigit():
            query = query.filter(Product.subcategory_id == int(subcategory))
        else:
            sub = db.query(Subcategory).filter(Subcategory.slug == subcategory).first()
            if sub:
                query = query.filter(Product.subcategory_id == sub.id)

    if brand:
        if brand.isdigit():
            query = query.filter(Product.brand_id == int(brand))
        else:
            b = db.query(Brand).filter(Brand.slug == brand).first()
            if b:
                query = query.filter(Product.brand_id == b.id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Product.status.ilike(status_filter.strip()))


    sort_col = getattr(Product, sort_by, Product.name)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    products = query.offset(skip).limit(limit).all()
    return [build_product_response(p) for p in products]


@router.get("/{slug_or_id}/related", response_model=List[ProductResponse])
def get_related_products(
    slug_or_id: str,
    limit: int = Query(4, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """
    Get related products for a given product by slug or integer ID.
    Relevance Algorithm (Auto):
    1. Resolve reference product.
    2. Exclude current product and inactive products (status != 'Active').
    3. Priority 1: Same subcategory_id (exact clinical peers, e.g. Patient Monitors -> Patient Monitors).
    4. Priority 2: Same category_id (same broader medical equipment domain).
       Prefer same brand_id if possible.
    5. Priority 3: Same brand_id across catalogue.
    6. Priority 4: Active catalogue products fallback if needed.
    """
    target = (
        db.query(Product)
        .filter(Product.slug == slug_or_id.strip())
        .first()
    )
    if not target and slug_or_id.isdigit():
        target = db.query(Product).filter(Product.id == int(slug_or_id)).first()

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{slug_or_id}' not found",
        )

    related_products: List[Product] = []
    collected_ids = {target.id}

    def fetch_candidates(base_filter, order_expressions=None):
        nonlocal related_products
        needed = limit - len(related_products)
        if needed <= 0:
            return

        q = (
            db.query(Product)
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
                joinedload(Product.images),
                joinedload(Product.property_values).joinedload(ProductPropertyValue.property),
            )
            .filter(Product.status == "Active")
            .filter(~Product.id.in_(list(collected_ids)))
            .filter(base_filter)
        )

        if order_expressions:
            for expr in order_expressions:
                q = q.order_by(expr)
        else:
            q = q.order_by(Product.id.desc())

        candidates = q.limit(needed).all()
        for p in candidates:
            if p.id not in collected_ids:
                collected_ids.add(p.id)
                related_products.append(p)

    # 1. Same subcategory (exact clinical peers)
    if target.subcategory_id:
        order = []
        if target.brand_id:
            order.append(case((Product.brand_id == target.brand_id, 1), else_=0).desc())
        order.append(Product.id.desc())
        fetch_candidates(Product.subcategory_id == target.subcategory_id, order)

    # 2. Same category (fallback if subcategory has fewer than limit)
    if target.category_id and len(related_products) < limit:
        order = []
        if target.brand_id:
            order.append(case((Product.brand_id == target.brand_id, 1), else_=0).desc())
        order.append(Product.id.desc())
        fetch_candidates(Product.category_id == target.category_id, order)

    # 3. Same brand (if still under limit)
    if target.brand_id and len(related_products) < limit:
        fetch_candidates(Product.brand_id == target.brand_id, [Product.id.desc()])

    # 4. General active catalogue fallback (if very few items in category/brand)
    if len(related_products) < limit:
        fetch_candidates(Product.id != target.id, [Product.id.desc()])

    return [build_product_response(p) for p in related_products]


@router.get("/{slug_or_id}", response_model=ProductResponse)
def get_product(slug_or_id: str, db: Session = Depends(get_db)):
    """
    Get a single product by its SEO slug or integer ID.
    Prioritizes slug lookup for SEO support.
    """
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.brand),
        joinedload(Product.images),
        joinedload(Product.property_values).joinedload(ProductPropertyValue.property),
    )

    product = query.filter(Product.slug == slug_or_id.strip()).first()
    if not product and slug_or_id.isdigit():
        product = query.filter(Product.id == int(slug_or_id)).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{slug_or_id}' not found",
        )

    return build_product_response(product)


# ---------------------------------------------------------------------------
# Create & Update & Delete Endpoints (Admin only)
# ---------------------------------------------------------------------------


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Create a new medical product with images, SEO slug, and dynamic properties.
    If a property name is provided that does not exist in the platform, it is created
    on-the-fly automatically.
    """
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name is required",
        )

    # Generate unique slug
    base_slug = payload.slug.strip() if payload.slug else generate_slug(clean_name)
    slug = get_unique_slug(db, base_slug)

    # Check SKU uniqueness if provided
    if payload.sku:
        existing_sku = db.query(Product).filter(Product.sku == payload.sku.strip()).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{payload.sku}' already exists",
            )

    # Validate category & brand if provided
    if payload.category_id:
        if not db.query(Category).filter(Category.id == payload.category_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected category does not exist",
            )

    if payload.brand_id:
        if not db.query(Brand).filter(Brand.id == payload.brand_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected brand does not exist",
            )

    product = Product(
        name=clean_name,
        slug=slug,
        sku=payload.sku.strip() if payload.sku else None,
        category_id=payload.category_id,
        subcategory_id=payload.subcategory_id,
        brand_id=payload.brand_id,
        description=payload.description.strip() if payload.description else None,
        short_description=payload.short_description.strip() if payload.short_description else None,
        brochure_url=payload.brochure_url.strip() if payload.brochure_url else None,
        status=payload.status or "Active",
        meta_title=payload.meta_title.strip() if payload.meta_title else clean_name,
        meta_description=payload.meta_description.strip() if payload.meta_description else None,
        specifications={},
    )
    db.add(product)
    db.flush()  # Generate product.id

    # 1. Attach images
    if payload.images:
        for idx, img_input in enumerate(payload.images):
            if isinstance(img_input, str):
                image_url = img_input.strip()
                alt_text = f"{clean_name} image {idx + 1}"
                is_primary = idx == 0
                display_order = idx
            else:
                image_url = img_input.image_url.strip()
                alt_text = img_input.alt_text or f"{clean_name} image {idx + 1}"
                is_primary = img_input.is_primary if img_input.is_primary else (idx == 0)
                display_order = img_input.display_order or idx

            if image_url:
                db.add(
                    ProductImage(
                        product_id=product.id,
                        image_url=image_url,
                        alt_text=alt_text,
                        is_primary=is_primary,
                        display_order=display_order,
                    )
                )

    # 2. Attach dynamic properties (creating on-the-fly if needed)
    specs_dict = {}
    if payload.properties:
        for prop_input in payload.properties:
            prop_name = prop_input.name.strip()
            prop_value = prop_input.value.strip()
            if not prop_name or not prop_value:
                continue

            # Look up or create canonical Property
            canonical_prop = None
            if prop_input.property_id:
                canonical_prop = db.query(Property).filter(Property.id == prop_input.property_id).first()

            if not canonical_prop:
                canonical_prop = db.query(Property).filter(Property.name.ilike(prop_name)).first()

            if not canonical_prop:
                # Create property on the fly
                canonical_prop = Property(
                    name=prop_name,
                    category_id=payload.category_id,
                    group=prop_input.group,
                )
                db.add(canonical_prop)
                db.flush()

            # Create product property value
            db.add(
                ProductPropertyValue(
                    product_id=product.id,
                    property_id=canonical_prop.id,
                    value=prop_value,
                )
            )
            specs_dict[canonical_prop.name] = prop_value

    product.specifications = specs_dict
    db.commit()
    db.refresh(product)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return build_product_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Update product details, SEO slug, images, and property specifications.
    """
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.property_values),
        )
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if payload.name is not None and payload.name.strip():
        product.name = payload.name.strip()

    if payload.slug is not None and payload.slug.strip() != product.slug:
        product.slug = get_unique_slug(db, generate_slug(payload.slug), current_id=product_id)
    elif payload.name is not None and payload.slug is None and payload.name.strip() != product.name:
        product.slug = get_unique_slug(db, generate_slug(payload.name), current_id=product_id)

    if payload.sku is not None:
        clean_sku = payload.sku.strip() if payload.sku.strip() else None
        if clean_sku and clean_sku != product.sku:
            existing = (
                db.query(Product)
                .filter(Product.sku == clean_sku, Product.id != product_id)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with SKU '{clean_sku}' already exists",
                )
        product.sku = clean_sku

    if payload.category_id is not None:
        if payload.category_id == 0:
            product.category_id = None
        else:
            if not db.query(Category).filter(Category.id == payload.category_id).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected category does not exist",
                )
            product.category_id = payload.category_id

    if payload.subcategory_id is not None:
        product.subcategory_id = payload.subcategory_id or None

    if payload.brand_id is not None:
        if payload.brand_id == 0:
            product.brand_id = None
        else:
            if not db.query(Brand).filter(Brand.id == payload.brand_id).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected brand does not exist",
                )
            product.brand_id = payload.brand_id

    if payload.description is not None:
        product.description = payload.description.strip() if payload.description.strip() else None

    if payload.short_description is not None:
        product.short_description = payload.short_description.strip() if payload.short_description.strip() else None

    storage = get_storage_service()

    if payload.brochure_url is not None:
        new_brochure = payload.brochure_url.strip() if payload.brochure_url.strip() else None
        old_brochure = product.brochure_url
        if old_brochure and old_brochure != new_brochure:
            if not is_media_in_use(db, old_brochure, exclude_product_id=product.id):
                storage.delete_file(old_brochure)
        product.brochure_url = new_brochure

    if payload.status is not None:
        product.status = payload.status

    if payload.meta_title is not None:
        product.meta_title = payload.meta_title.strip() if payload.meta_title.strip() else None

    if payload.meta_description is not None:
        product.meta_description = payload.meta_description.strip() if payload.meta_description.strip() else None

    # Update images if provided
    if payload.images is not None:
        # Detect images that were removed
        old_images = db.query(ProductImage).filter(ProductImage.product_id == product.id).all()
        old_urls = {img.image_url.strip() for img in old_images if img.image_url}

        new_urls = set()
        for img_input in payload.images:
            if isinstance(img_input, str):
                u = img_input.strip()
            else:
                u = img_input.image_url.strip() if img_input.image_url else ""
            if u:
                new_urls.add(u)

        # Removed URLs are deleted from disk if not referenced elsewhere
        removed_urls = old_urls - new_urls
        for removed_url in removed_urls:
            if not is_media_in_use(db, removed_url, exclude_product_id=product.id):
                storage.delete_file(removed_url)

        # Delete existing images from DB
        db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
        for idx, img_input in enumerate(payload.images):
            if isinstance(img_input, str):
                image_url = img_input.strip()
                alt_text = f"{product.name} image {idx + 1}"
                is_primary = idx == 0
                display_order = idx
            else:
                image_url = img_input.image_url.strip()
                alt_text = img_input.alt_text or f"{product.name} image {idx + 1}"
                is_primary = img_input.is_primary if img_input.is_primary else (idx == 0)
                display_order = img_input.display_order or idx

            if image_url:
                db.add(
                    ProductImage(
                        product_id=product.id,
                        image_url=image_url,
                        alt_text=alt_text,
                        is_primary=is_primary,
                        display_order=display_order,
                    )
                )

    # Update properties if provided
    if payload.properties is not None:
        # Remove existing property values
        db.query(ProductPropertyValue).filter(ProductPropertyValue.product_id == product.id).delete()
        specs_dict = {}

        for prop_input in payload.properties:
            prop_name = prop_input.name.strip()
            prop_value = prop_input.value.strip()
            if not prop_name or not prop_value:
                continue

            canonical_prop = None
            if prop_input.property_id:
                canonical_prop = db.query(Property).filter(Property.id == prop_input.property_id).first()

            if not canonical_prop:
                canonical_prop = db.query(Property).filter(Property.name.ilike(prop_name)).first()

            if not canonical_prop:
                canonical_prop = Property(
                    name=prop_name,
                    category_id=product.category_id,
                    group=prop_input.group,
                )
                db.add(canonical_prop)
                db.flush()

            db.add(
                ProductPropertyValue(
                    product_id=product.id,
                    property_id=canonical_prop.id,
                    value=prop_value,
                )
            )
            specs_dict[canonical_prop.name] = prop_value

        product.specifications = specs_dict

    db.commit()
    db.refresh(product)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return build_product_response(product)


@router.post("/{product_id}/toggle-status", response_model=ProductResponse)
def toggle_product_status(
    product_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Toggle product catalogue status between 'Active' and 'Draft'. Requires Admin.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.status = "Draft" if product.status == "Active" else "Active"
    db.commit()
    db.refresh(product)

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return build_product_response(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Delete a product from the catalogue and clean up associated media files. Requires Admin.
    """
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.documents),
        )
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    name = product.name
    storage = get_storage_service()

    # 1. Clean up brochure if not referenced by another product
    if product.brochure_url:
        if not is_media_in_use(db, product.brochure_url, exclude_product_id=product.id):
            storage.delete_file(product.brochure_url)

    # 2. Clean up images if not referenced by another product
    for img in product.images:
        if img.image_url:
            if not is_media_in_use(db, img.image_url, exclude_product_id=product.id):
                storage.delete_file(img.image_url)

    # 3. Clean up documents if not referenced elsewhere
    for doc in product.documents:
        if doc.file_url:
            if not is_media_in_use(db, doc.file_url, exclude_product_id=product.id):
                storage.delete_file(doc.file_url)

    db.delete(product)
    db.commit()

    background_tasks.add_task(filter_cache_service.refresh_in_background)

    return {"message": f"Product '{name}' deleted successfully"}
