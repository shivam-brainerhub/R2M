import secrets
import uuid
from datetime import datetime
from typing import List, Optional

from app.core.dependencies import (
    get_current_user,
    get_optional_current_user,
    require_permission,
)
from app.database import get_db
from app.models import Product, QuoteRequest, QuoteRequestItem, User
from app.schemas.quote import (
    QuoteRequestCreate,
    QuoteRequestResponse,
    QuoteRequestUpdate,
    QuoteStatsResponse,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session, joinedload

router = APIRouter(
    prefix="/quotes",
    tags=["Quotes & RFQ"],
)


def generate_quote_number(db: Session) -> str:
    """
    Generates a secure, non-sequential unique quote number.
    Format: QR-YYYY-XXXXXX (e.g., QR-2026-8K4T9M)
    Avoids exposing the total quotation count or serial sequence.
    """
    current_year = datetime.now().year
    prefix = f"QR-{current_year}-"
    # Unambiguous characters (excludes 0, O, 1, I to prevent read errors)
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

    for _ in range(100):
        random_suffix = "".join(secrets.choice(alphabet) for _ in range(6))
        candidate_number = f"{prefix}{random_suffix}"
        if (
            not db.query(QuoteRequest.id)
            .filter(QuoteRequest.quote_number == candidate_number)
            .first()
        ):
            return candidate_number

    # Fallback to uuid hex if repeated collision occurs (statistically near impossible)
    return f"{prefix}{uuid.uuid4().hex[:6].upper()}"


# ==============================================================================
# Public / Customer Endpoints
# ==============================================================================


@router.post(
    "", response_model=QuoteRequestResponse, status_code=status.HTTP_201_CREATED
)
def submit_quote_request(
    payload: QuoteRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a Request for Quote (RFQ).
    Requires user authentication.
    Automatically links the quotation request to the authenticated user account.
    """
    quote_number = generate_quote_number(db)

    quote = QuoteRequest(
        quote_number=quote_number,
        user_id=current_user.id,
        facility_name=payload.facility_name.strip(),
        contact_name=payload.contact_name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip(),
        sector=payload.sector.strip() if payload.sector else None,
        department=payload.department.strip() if payload.department else None,
        city=payload.city.strip() if payload.city else None,
        address=payload.address.strip() if payload.address else None,
        postal_code=payload.postal_code.strip() if payload.postal_code else None,
        urgency=payload.urgency.strip() if payload.urgency else "Standard",
        status="New",
        notes=payload.notes.strip() if payload.notes else None,
    )

    db.add(quote)
    db.flush()  # Populates quote.id for foreign key relationship

    for item in payload.items:
        db_item = QuoteRequestItem(
            quote_request_id=quote.id,
            product_id=item.product_id,
            product_name=item.product_name.strip(),
            product_sku=item.product_sku.strip() if item.product_sku else None,
            brand_name=item.brand_name.strip() if item.brand_name else None,
            quantity=max(1, item.quantity),
            item_notes=item.item_notes.strip() if item.item_notes else None,
        )
        db.add(db_item)

    db.commit()
    db.refresh(quote)
    return quote


@router.get("/my-quotes", response_model=List[QuoteRequestResponse])
def get_my_quote_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all quote requests submitted by the logged-in customer.
    Matched by user_id or account email address.
    """
    quotes = (
        db.query(QuoteRequest)
        .options(
            joinedload(QuoteRequest.items)
            .joinedload(QuoteRequestItem.product)
            .joinedload(Product.images)
        )
        .filter(
            or_(
                QuoteRequest.user_id == current_user.id,
                QuoteRequest.email.ilike(current_user.email.strip()),
            )
        )
        .order_by(desc(QuoteRequest.created_at))
        .all()
    )
    return quotes


# ==============================================================================
# Admin Endpoints
# ==============================================================================


@router.get("/stats", response_model=QuoteStatsResponse)
def get_quote_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("quotes", "read")),
):
    """
    Summary counts of quote requests by status for admin badges and widgets.
    """
    total = db.query(func.count(QuoteRequest.id)).scalar() or 0
    new_q = (
        db.query(func.count(QuoteRequest.id))
        .filter(QuoteRequest.status == "New")
        .scalar()
        or 0
    )
    in_review = (
        db.query(func.count(QuoteRequest.id))
        .filter(QuoteRequest.status == "In Review")
        .scalar()
        or 0
    )
    quoted = (
        db.query(func.count(QuoteRequest.id))
        .filter(QuoteRequest.status == "Quoted")
        .scalar()
        or 0
    )
    approved = (
        db.query(func.count(QuoteRequest.id))
        .filter(QuoteRequest.status == "Approved")
        .scalar()
        or 0
    )
    declined = (
        db.query(func.count(QuoteRequest.id))
        .filter(QuoteRequest.status == "Declined")
        .scalar()
        or 0
    )

    return QuoteStatsResponse(
        total_quotes=total,
        new_quotes=new_q,
        in_review_quotes=in_review,
        quoted_quotes=quoted,
        approved_quotes=approved,
        declined_quotes=declined,
    )


@router.get("", response_model=List[QuoteRequestResponse])
def list_quote_requests(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by status: New, In Review, Quoted, Approved, Declined",
    ),
    urgency_filter: Optional[str] = Query(
        None,
        alias="urgency",
        description="Filter by urgency: Standard, Urgent, Procurement Tender",
    ),
    search: Optional[str] = Query(
        None, description="Search by facility, contact, email, phone, or quote number"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("quotes", "read")),
):
    """
    Retrieve quote requests with filtering, search, and pagination. Requires Admin privileges.
    """
    query = db.query(QuoteRequest).options(
        joinedload(QuoteRequest.items)
        .joinedload(QuoteRequestItem.product)
        .joinedload(Product.images)
    )

    if status_filter and status_filter.strip() and status_filter.lower() != "all":
        query = query.filter(QuoteRequest.status.ilike(status_filter.strip()))

    if urgency_filter and urgency_filter.strip() and urgency_filter.lower() != "all":
        query = query.filter(QuoteRequest.urgency.ilike(urgency_filter.strip()))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                QuoteRequest.quote_number.ilike(term),
                QuoteRequest.facility_name.ilike(term),
                QuoteRequest.contact_name.ilike(term),
                QuoteRequest.email.ilike(term),
                QuoteRequest.phone.ilike(term),
                QuoteRequest.sector.ilike(term),
            )
        )

    return query.order_by(desc(QuoteRequest.created_at)).offset(skip).limit(limit).all()


@router.get("/{identifier}", response_model=QuoteRequestResponse)
def get_quote_details(
    identifier: str,
    verify_email: Optional[str] = Query(
        None, description="Required for non-admin public lookup"
    ),
    db: Session = Depends(get_db),
    optional_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get full details of a quote request by ID or quote number (e.g. QR-2026-0001).
    - Admins can view any quote.
    - Authenticated users can view their own quotes.
    - Visitors can view if matching verify_email is provided.
    """
    query = db.query(QuoteRequest).options(
        joinedload(QuoteRequest.items)
        .joinedload(QuoteRequestItem.product)
        .joinedload(Product.images)
    )

    if identifier.isdigit():
        quote = query.filter(QuoteRequest.id == int(identifier)).first()
    else:
        quote = query.filter(
            QuoteRequest.quote_number.ilike(identifier.strip())
        ).first()

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote request '{identifier}' not found",
        )

    # Authorization check
    is_admin = optional_user and optional_user.role.value == "admin"
    is_owner = optional_user and (
        quote.user_id == optional_user.id
        or quote.email.lower() == optional_user.email.lower()
    )
    email_matched = verify_email and verify_email.strip().lower() == quote.email.lower()

    if not (is_admin or is_owner or email_matched):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this quotation request",
        )

    return quote


@router.patch("/{quote_id}", response_model=QuoteRequestResponse)
def update_quote_request(
    quote_id: int,
    payload: QuoteRequestUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("quotes", "write")),
):
    """
    Update status, internal sales notes, or quoted amount. Requires Admin privileges.
    """
    quote = (
        db.query(QuoteRequest)
        .options(
            joinedload(QuoteRequest.items)
            .joinedload(QuoteRequestItem.product)
            .joinedload(Product.images)
        )
        .filter(QuoteRequest.id == quote_id)
        .first()
    )
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote request with ID {quote_id} not found",
        )

    if payload.status is not None:
        quote.status = payload.status
    if payload.internal_notes is not None:
        quote.internal_notes = payload.internal_notes
    if payload.quoted_amount is not None:
        quote.quoted_amount = payload.quoted_amount

    db.commit()
    db.refresh(quote)
    return quote


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quote_request(
    quote_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_permission("quotes", "write")),
):
    """
    Delete a quote request. Requires Admin privileges.
    """
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_id).first()
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote request with ID {quote_id} not found",
        )

    db.delete(quote)
    db.commit()
    return None
