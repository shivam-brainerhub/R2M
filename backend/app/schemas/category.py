from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class SubcategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    category_id: Optional[int] = None


class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[int] = None


class SubcategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    name: str
    slug: str
    product_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    code: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    product_count: int = 0
    subcategories: list[SubcategoryResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
