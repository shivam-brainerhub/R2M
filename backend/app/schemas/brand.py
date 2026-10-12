from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BrandBase(BaseModel):
    name: str
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    featured_in_slider: bool = True


class BrandCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    featured_in_slider: bool = True


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    featured_in_slider: Optional[bool] = None


class BrandToggleSliderResponse(BaseModel):
    id: int
    name: str
    featured_in_slider: bool
    message: str


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    featured_in_slider: bool = True
    product_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
