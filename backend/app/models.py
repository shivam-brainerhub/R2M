from app.database import Base
from sqlalchemy import JSON, Column, ForeignKey, Integer, String, Table, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

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
    description = Column(String)

    subcategories = relationship("Subcategory", back_populates="category")


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
    logo_url = Column(String)

    products = relationship("Product", back_populates="brand")


class Product(TimestampMixin, Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"))
    brand_id = Column(Integer, ForeignKey("brands.id"))
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    specifications = Column(JSON)
    status = Column(String, default="Draft")

    subcategory = relationship("Subcategory", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    documents = relationship("Document", back_populates="product")
    sectors = relationship(
        "Sector", secondary=product_sector_association, back_populates="products"
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
