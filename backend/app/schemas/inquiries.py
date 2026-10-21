from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ==============================================================================
# Contact Message Schemas
# ==============================================================================


class ContactMessageCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    organization: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=5, max_length=5000)


class ContactMessageUpdate(BaseModel):
    status: Optional[str] = Field(
        None, description="New, In Progress, Responded, Archived"
    )
    notes: Optional[str] = None


class ContactMessageResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    organization: Optional[str] = None
    message: str
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Supplier Application Schemas
# ==============================================================================


class SupplierApplicationCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    website: Optional[str] = Field(None, max_length=300)
    contact_person: str = Field(..., min_length=1, max_length=150)
    job_title: Optional[str] = Field(None, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=50)
    category: str = Field(..., min_length=1, max_length=100)
    overview: str = Field(..., min_length=10, max_length=5000)


class SupplierApplicationUpdate(BaseModel):
    status: Optional[str] = Field(
        None, description="New, Under Review, Approved, Declined"
    )
    notes: Optional[str] = None


class SupplierApplicationResponse(BaseModel):
    id: int
    company_name: str
    website: Optional[str] = None
    contact_person: str
    job_title: Optional[str] = None
    email: str
    phone: str
    category: str
    overview: str
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
