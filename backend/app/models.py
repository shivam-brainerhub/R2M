import enum
from app.database import Base
from typing import Optional
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

product_sector_association = Table(
    "product_sector",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id")),
    Column("sector_id", Integer, ForeignKey("sectors.id")),
)


class Category(TimestampMixin, Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, index=True, nullable=True)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)

    subcategories = relationship("Subcategory", back_populates="category", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="category")


class Subcategory(TimestampMixin, Base):
    __tablename__ = "subcategories"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)

    category = relationship("Category", back_populates="subcategories")
    products = relationship("Product", back_populates="subcategory")


class Brand(TimestampMixin, Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=True)
    logo_url = Column(String, nullable=True)
    country = Column(String, nullable=True)
    description = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    featured_in_slider = Column(Boolean, default=True, nullable=False)

    products = relationship("Product", back_populates="brand")


class Product(TimestampMixin, Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)
    short_description = Column(String, nullable=True)
    brochure_url = Column(String, nullable=True)
    meta_title = Column(String, nullable=True)
    meta_description = Column(String, nullable=True)
    specifications = Column(JSON, nullable=True)  # Denormalized key-value dictionary
    status = Column(String, default="Active", nullable=False)  # "Active" or "Draft"

    category = relationship("Category", back_populates="products")
    subcategory = relationship("Subcategory", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    documents = relationship("Document", back_populates="product", cascade="all, delete-orphan")
    sectors = relationship(
        "Sector", secondary=product_sector_association, back_populates="products"
    )
    images = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.display_order",
    )
    property_values = relationship(
        "ProductPropertyValue",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    @property
    def primary_image_url(self) -> Optional[str]:
        if self.images:
            for img in self.images:
                if img.is_primary:
                    return img.image_url
            return self.images[0].image_url
        return None


class ProductImage(TimestampMixin, Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    alt_text = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="images")


class Property(TimestampMixin, Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    group = Column(String, nullable=True)  # e.g. "General", "Display", "Technical", "Features"
    description = Column(String, nullable=True)

    category = relationship("Category")
    values = relationship("ProductPropertyValue", back_populates="property", cascade="all, delete-orphan")


class ProductPropertyValue(TimestampMixin, Base):
    __tablename__ = "product_property_values"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    value = Column(String, nullable=False)

    product = relationship("Product", back_populates="property_values")
    property = relationship("Property", back_populates="values")

    __table_args__ = (
        UniqueConstraint("product_id", "property_id", name="uq_product_property"),
    )


class Document(TimestampMixin, Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    type = Column(String, nullable=False)  # e.g. Brochure, Manual, Certificate

    product = relationship("Product", back_populates="documents")


class Sector(TimestampMixin, Base):
    __tablename__ = "sectors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    products = relationship(
        "Product", secondary=product_sector_association, back_populates="sectors"
    )


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(
        Enum(UserRole, name="user_role_enum", native_enum=False),
        default=UserRole.USER,
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class SiteContent(TimestampMixin, Base):
    __tablename__ = "site_contents"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)
    content = Column(JSON, nullable=False, default=dict)

