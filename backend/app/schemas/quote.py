from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ==============================================================================
# Quote Item Schemas
# ==============================================================================


class QuoteItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str = Field(..., min_length=1, max_length=200)
    product_sku: Optional[str] = Field(None, max_length=100)
    brand_name: Optional[str] = Field(None, max_length=150)
    quantity: int = Field(default=1, ge=1, description="Quantity must be at least 1")
    item_notes: Optional[str] = Field(None, max_length=1000)


class QuoteItemResponse(BaseModel):
    id: int
    quote_request_id: int
    product_id: Optional[int] = None
    product_name: str
    product_sku: Optional[str] = None
    brand_name: Optional[str] = None
    quantity: int
    item_notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Quote Request Schemas
# ==============================================================================


class QuoteRequestCreate(BaseModel):
    facility_name: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Hospital, clinic or practice name",
    )
    contact_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=50)
    sector: Optional[str] = Field(None, max_length=150)
    department: Optional[str] = Field(None, max_length=150)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=300)
    postal_code: Optional[str] = Field(None, max_length=30)
    urgency: str = Field(
        "Standard", description="Standard, Urgent, or Procurement Tender"
    )
    notes: Optional[str] = Field(
        None,
        max_length=5000,
        description="Procurement specifications or clinical requirements",
    )
    items: List[QuoteItemCreate] = Field(
        ..., min_length=1, description="At least one equipment item is required"
    )


class QuoteRequestUpdate(BaseModel):
    status: Optional[str] = Field(
        None, description="New, In Review, Quoted, Approved, Declined"
    )
    internal_notes: Optional[str] = Field(
        None, description="Internal admin or sales representative notes"
    )
    quoted_amount: Optional[str] = Field(
        None, description="Quotation value or summary currency string"
    )


class QuoteRequestResponse(BaseModel):
    id: int
    quote_number: str
    user_id: Optional[int] = None
    facility_name: str
    contact_name: str
    email: str
    phone: str
    sector: Optional[str] = None
    department: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    urgency: str
    status: str
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    quoted_amount: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[QuoteItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class QuoteStatsResponse(BaseModel):
    total_quotes: int
    new_quotes: int
    in_review_quotes: int
    quoted_quotes: int
    approved_quotes: int
    declined_quotes: int
