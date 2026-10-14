from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class ProductImageBase(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    display_order: int = 0


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageResponse(ProductImageBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ProductPropertyInput(BaseModel):
    property_id: Optional[int] = None
    name: str = Field(..., description="Property name e.g. 'Display Size'")
    value: str = Field(..., description="Value for this product e.g. '12.1\" Touchscreen'")
    group: Optional[str] = None


class ProductPropertyValueResponse(BaseModel):
    property_id: int
    name: str
    value: str
    group: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str
    slug: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    brand_id: Optional[int] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    brochure_url: Optional[str] = None
    status: str = "Active"  # "Active" | "Draft"
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class ProductCreate(ProductBase):
    images: Optional[List[Union[str, ProductImageCreate]]] = []
    properties: Optional[List[ProductPropertyInput]] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    brand_id: Optional[int] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    brochure_url: Optional[str] = None
    status: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    images: Optional[List[Union[str, ProductImageCreate]]] = None
    properties: Optional[List[ProductPropertyInput]] = None


class ProductResponse(ProductBase):
    id: int
    slug: str
    category_name: Optional[str] = None
    subcategory_name: Optional[str] = None
    brand_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    primary_image_url: Optional[str] = None
    images: List[ProductImageResponse] = []
    properties: List[ProductPropertyValueResponse] = []
    specifications: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductComparePropertyRow(BaseModel):
    name: str
    group: Optional[str] = None
    values: Dict[str, Optional[str]] = Field(
        ...,
        description="Key is product slug (or id), value is property string value",
    )


class ProductCompareResponse(BaseModel):
    products: List[ProductResponse]
    properties: List[ProductComparePropertyRow]


class ProductStatsResponse(BaseModel):
    total_products: int
    active_products: int
    draft_products: int
    with_brochure_count: int
    total_brands: int
    total_categories: int
    total_properties: int
    category_distribution: Dict[str, int]
    brand_distribution: Dict[str, int]


class SubcategoryFilterOption(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    product_count: int


class CategoryFilterOption(BaseModel):
    id: int
    name: str
    slug: str
    code: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    product_count: int
    subcategories: List[SubcategoryFilterOption] = []


class BrandFilterOption(BaseModel):
    id: Optional[int] = None
    name: str
    slug: Optional[str] = None
    count: int


class PropertyValueOption(BaseModel):
    value: str
    count: int


class PropertyGroupFilterOption(BaseModel):
    name: str
    group: Optional[str] = None
    options: List[PropertyValueOption] = []


class AvailabilityFilterOption(BaseModel):
    active_count: int
    brochure_count: int


class ProductFilterOptionsResponse(BaseModel):
    total_products: int
    categories: List[CategoryFilterOption] = []
    brands: List[BrandFilterOption] = []
    properties: List[PropertyGroupFilterOption] = []
    availability: AvailabilityFilterOption

