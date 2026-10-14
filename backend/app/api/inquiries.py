from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import ContactMessage, SupplierApplication, User
from app.schemas.inquiries import (
    ContactMessageCreate,
    ContactMessageResponse,
    ContactMessageUpdate,
    SupplierApplicationCreate,
    SupplierApplicationResponse,
    SupplierApplicationUpdate,
)

router = APIRouter(
    prefix="/inquiries",
    tags=["Inquiries & Leads"],
)


# ==============================================================================
# Contact Messages Endpoints
# ==============================================================================

@router.post("/contact", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_message(
    payload: ContactMessageCreate,
    db: Session = Depends(get_db),
):
    """
    Public endpoint for website visitors to submit general contact inquiries.
    """
    message = ContactMessage(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=payload.email.strip().lower(),
        organization=payload.organization.strip() if payload.organization else None,
        message=payload.message.strip(),
        status="New",
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/contact", response_model=List[ContactMessageResponse])
def list_contact_messages(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status, e.g. New, In Progress, Responded, Archived"),
    search: Optional[str] = Query(None, description="Search by name, email, organization or message text"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Retrieve contact messages with filtering and search. Requires Admin privileges.
    """
    query = db.query(ContactMessage)

    if status_filter and status_filter.strip() and status_filter.lower() != "all":
        query = query.filter(ContactMessage.status.ilike(status_filter.strip()))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ContactMessage.first_name.ilike(term),
                ContactMessage.last_name.ilike(term),
                ContactMessage.email.ilike(term),
                ContactMessage.organization.ilike(term),
                ContactMessage.message.ilike(term),
            )
        )

    return query.order_by(desc(ContactMessage.created_at)).offset(skip).limit(limit).all()


@router.patch("/contact/{message_id}", response_model=ContactMessageResponse)
def update_contact_message(
    message_id: int,
    payload: ContactMessageUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Update status or internal notes on a contact message. Requires Admin privileges.
    """
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact message with ID {message_id} not found",
        )

    if payload.status is not None:
        message.status = payload.status
    if payload.notes is not None:
        message.notes = payload.notes

    db.commit()
    db.refresh(message)
    return message


@router.delete("/contact/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Delete a contact message. Requires Admin privileges.
    """
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact message with ID {message_id} not found",
        )

    db.delete(message)
    db.commit()
    return None


# ==============================================================================
# Supplier Applications Endpoints
# ==============================================================================

@router.post("/supplier", response_model=SupplierApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_supplier_application(
    payload: SupplierApplicationCreate,
    db: Session = Depends(get_db),
):
    """
    Public endpoint for medical manufacturers to apply to become suppliers.
    """
    app = SupplierApplication(
        company_name=payload.company_name.strip(),
        website=payload.website.strip() if payload.website else None,
        contact_person=payload.contact_person.strip(),
        job_title=payload.job_title.strip() if payload.job_title else None,
        email=payload.email.strip().lower(),
        phone=payload.phone.strip(),
        category=payload.category.strip(),
        overview=payload.overview.strip(),
        status="New",
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/supplier", response_model=List[SupplierApplicationResponse])
def list_supplier_applications(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status, e.g. New, Under Review, Approved, Declined"),
    search: Optional[str] = Query(None, description="Search by company, contact person, email, category or overview"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Retrieve supplier applications with filtering and search. Requires Admin privileges.
    """
    query = db.query(SupplierApplication)

    if status_filter and status_filter.strip() and status_filter.lower() != "all":
        query = query.filter(SupplierApplication.status.ilike(status_filter.strip()))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SupplierApplication.company_name.ilike(term),
                SupplierApplication.contact_person.ilike(term),
                SupplierApplication.email.ilike(term),
                SupplierApplication.category.ilike(term),
                SupplierApplication.overview.ilike(term),
            )
        )

    return query.order_by(desc(SupplierApplication.created_at)).offset(skip).limit(limit).all()


@router.patch("/supplier/{app_id}", response_model=SupplierApplicationResponse)
def update_supplier_application(
    app_id: int,
    payload: SupplierApplicationUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Update status or internal notes on a supplier application. Requires Admin privileges.
    """
    app = db.query(SupplierApplication).filter(SupplierApplication.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier application with ID {app_id} not found",
        )

    if payload.status is not None:
        app.status = payload.status
    if payload.notes is not None:
        app.notes = payload.notes

    db.commit()
    db.refresh(app)
    return app


@router.delete("/supplier/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Delete a supplier application. Requires Admin privileges.
    """
    app = db.query(SupplierApplication).filter(SupplierApplication.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier application with ID {app_id} not found",
        )

    db.delete(app)
    db.commit()
    return None


@router.get("/stats", response_model=Dict[str, int])
def get_inquiries_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Retrieve quick inquiry counts for admin badge notifications and dashboard widgets.
    """
    new_contact = db.query(ContactMessage).filter(ContactMessage.status == "New").count()
    total_contact = db.query(ContactMessage).count()
    new_supplier = db.query(SupplierApplication).filter(SupplierApplication.status == "New").count()
    total_supplier = db.query(SupplierApplication).count()

    return {
        "new_contact": new_contact,
        "total_contact": total_contact,
        "new_supplier": new_supplier,
        "total_supplier": total_supplier,
        "total_new": new_contact + new_supplier,
    }
