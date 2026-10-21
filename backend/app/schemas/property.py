from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PropertyBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    group: Optional[str] = None
    description: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    group: Optional[str] = None
    description: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: int
    category_name: Optional[str] = None
    product_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
