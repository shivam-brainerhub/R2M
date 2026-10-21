import os
from typing import List, Optional, Union

from app.core.dependencies import get_current_user_from_header_or_query
from app.database import get_db
from app.models import Brand, Category, Document, Product, User
from app.schemas.product import PaginatedResourcesResponse, ResourceItemResponse
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

router = APIRouter(
    tags=["Resource Centre & Documents"],
)

MEDIA_DIR = os.path.realpath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media")
)


@router.get(
    "/resources",
    response_model=Union[PaginatedResourcesResponse, List[ResourceItemResponse]],
)
def list_resources(
    search: Optional[str] = Query(
        None, description="Search by document title, product name, or brand"
    ),
    category: Optional[str] = Query(None, description="Filter by category slug or ID"),
    brand: Optional[str] = Query(None, description="Filter by brand slug or ID"),
    type: Optional[str] = Query(
        None,
        description="Filter by document type (Brochure, Specifications, User Manual, Certificate)",
    ),
    page: Optional[int] = Query(None, ge=1, description="Page number (1-indexed)"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Items per page"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Items to return"),
    skip: Optional[int] = Query(None, ge=0, description="Items to skip"),
    paginated: bool = Query(
        False, description="Whether to return a PaginatedResourcesResponse envelope"
    ),
    response: Response = None,
    db: Session = Depends(get_db),
):
    """
    Public listing of downloadable product documentation for the Dedicated Resource Centre.
    Combines registered Document entities and product brochures.
    """
    # 1. Query registered Documents
    doc_query = (
        db.query(Document)
        .join(Product, Document.product_id == Product.id, isouter=True)
        .options(
            joinedload(Document.product).joinedload(Product.category),
            joinedload(Document.product).joinedload(Product.brand),
        )
    )

    if type and type.strip() and type.strip().lower() != "all":
        doc_query = doc_query.filter(Document.type.ilike(f"%{type.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        doc_query = doc_query.filter(
            or_(
                Document.title.ilike(term),
                Product.name.ilike(term),
                Product.sku.ilike(term),
            )
        )

    if category and category.strip() and category.strip().lower() != "all":
        if category.isdigit():
            doc_query = doc_query.filter(Product.category_id == int(category))
        else:
            cat = db.query(Category).filter(Category.slug == category.strip()).first()
            if cat:
                doc_query = doc_query.filter(Product.category_id == cat.id)

    if brand and brand.strip() and brand.strip().lower() != "all":
        if brand.isdigit():
            doc_query = doc_query.filter(Product.brand_id == int(brand))
        else:
            b = db.query(Brand).filter(Brand.slug == brand.strip()).first()
            if b:
                doc_query = doc_query.filter(Product.brand_id == b.id)

    registered_docs = doc_query.all()
    seen_urls = set()
    results: List[ResourceItemResponse] = []

    for d in registered_docs:
        seen_urls.add(d.file_url)
        prod = d.product
        cat = prod.category if prod else None
        br = prod.brand if prod else None
        results.append(
            ResourceItemResponse(
                id=d.id,
                title=d.title,
                file_url=d.file_url,
                type=d.type or "Brochure",
                product_id=prod.id if prod else None,
                product_name=prod.name if prod else None,
                product_slug=prod.slug if prod else None,
                product_sku=prod.sku if prod else None,
                category_id=cat.id if cat else None,
                category_name=cat.name if cat else None,
                category_slug=cat.slug if cat else None,
                brand_id=br.id if br else None,
                brand_name=br.name if br else None,
                brand_logo_url=br.logo_url if br else None,
                created_at=d.created_at,
            )
        )

    # 2. Also include active products that have brochure_url not already in results
    if not type or type.strip().lower() in ["all", "brochure"]:
        prod_query = (
            db.query(Product)
            .filter(Product.status == "Active")
            .filter(Product.brochure_url.isnot(None))
            .filter(Product.brochure_url != "")
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
            )
        )

        if search and search.strip():
            term = f"%{search.strip()}%"
            prod_query = prod_query.filter(
                or_(
                    Product.name.ilike(term),
                    Product.sku.ilike(term),
                    Product.description.ilike(term),
                )
            )

        if category and category.strip() and category.strip().lower() != "all":
            if category.isdigit():
                prod_query = prod_query.filter(Product.category_id == int(category))
            else:
                cat = (
                    db.query(Category).filter(Category.slug == category.strip()).first()
                )
                if cat:
                    prod_query = prod_query.filter(Product.category_id == cat.id)

        if brand and brand.strip() and brand.strip().lower() != "all":
            if brand.isdigit():
                prod_query = prod_query.filter(Product.brand_id == int(brand))
            else:
                b = db.query(Brand).filter(Brand.slug == brand.strip()).first()
                if b:
                    prod_query = prod_query.filter(Product.brand_id == b.id)

        brochure_prods = prod_query.all()
        for p in brochure_prods:
            if p.brochure_url and p.brochure_url not in seen_urls:
                seen_urls.add(p.brochure_url)
                cat = p.category
                br = p.brand
                results.append(
                    ResourceItemResponse(
                        id=100000 + p.id,
                        title=f"{p.name} Product Brochure",
                        file_url=p.brochure_url,
                        type="Brochure",
                        product_id=p.id,
                        product_name=p.name,
                        product_slug=p.slug,
                        product_sku=p.sku,
                        category_id=cat.id if cat else None,
                        category_name=cat.name if cat else None,
                        category_slug=cat.slug if cat else None,
                        brand_id=br.id if br else None,
                        brand_name=br.name if br else None,
                        brand_logo_url=br.logo_url if br else None,
                        created_at=p.created_at,
                    )
                )

    # Sort by title
    results.sort(key=lambda r: (r.product_name or r.title or "").lower())
    total = len(results)

    # Determine pagination parameters
    if page is not None:
        effective_page_size = page_size or limit or 12
        effective_page = page
        effective_skip = (effective_page - 1) * effective_page_size
        effective_limit = effective_page_size
    else:
        effective_limit = (
            limit
            if limit is not None
            else (page_size if page_size is not None else (12 if paginated else 100))
        )
        effective_skip = skip if skip is not None else 0
        effective_page_size = effective_limit
        effective_page = (
            (effective_skip // effective_limit) + 1 if effective_limit > 0 else 1
        )

    total_pages = (
        max(1, (total + effective_page_size - 1) // effective_page_size)
        if effective_page_size > 0
        else 1
    )
    has_more = (effective_skip + effective_limit) < total
    paged_items = results[effective_skip : effective_skip + effective_limit]

    if response:
        response.headers["X-Total-Count"] = str(total)
        response.headers["X-Page"] = str(effective_page)
        response.headers["X-Page-Size"] = str(effective_page_size)
        response.headers["X-Total-Pages"] = str(total_pages)
        response.headers["X-Has-More"] = "true" if has_more else "false"
        response.headers["Access-Control-Expose-Headers"] = (
            "X-Total-Count, X-Page, X-Page-Size, X-Total-Pages, X-Has-More"
        )

    if paginated:
        return PaginatedResourcesResponse(
            items=paged_items,
            total=total,
            page=effective_page,
            page_size=effective_page_size,
            total_pages=total_pages,
            has_more=has_more,
        )

    return paged_items


@router.get("/documents/download")
def download_document(
    url: str = Query(
        ..., description="Media URL or relative path of the document to download"
    ),
    token: Optional[str] = Query(
        None, description="Auth token for direct browser downloads"
    ),
    current_user: User = Depends(get_current_user_from_header_or_query),
):
    """
    Gated, authenticated download endpoint for official manufacturer documentation,
    datasheets, and clinical specifications. Requires active user credentials.
    """
    clean_url = url.strip()
    if clean_url.startswith("http://") or clean_url.startswith("https://"):
        # Extract relative path from absolute URL if it points to /media/
        if "/media/" in clean_url:
            clean_url = clean_url.split("/media/", 1)[1]
    elif clean_url.startswith("/media/"):
        clean_url = clean_url[len("/media/") :]
    elif clean_url.startswith("media/"):
        clean_url = clean_url[len("media/") :]

    clean_url = clean_url.lstrip("/")

    # Security check: resolve realpath and ensure within MEDIA_DIR
    safe_target = os.path.realpath(os.path.join(MEDIA_DIR, clean_url))
    if not safe_target.startswith(MEDIA_DIR):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path.",
        )

    if not os.path.exists(safe_target) or not os.path.isfile(safe_target):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested medical document was not found on the server.",
        )

    filename = os.path.basename(safe_target)
    media_type = "application/pdf"
    if filename.lower().endswith(".zip"):
        media_type = "application/zip"
    elif filename.lower().endswith(".docx"):
        media_type = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    elif filename.lower().endswith(".doc"):
        media_type = "application/msword"

    return FileResponse(
        path=safe_target,
        filename=filename,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
    )
