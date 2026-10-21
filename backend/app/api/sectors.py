from typing import List

from app.database import get_db
from app.models import Product, Sector, product_sector_association
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import asc, func
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/sectors",
    tags=["Healthcare Sectors"],
)


class SectorDetailResponse(BaseModel):
    id: int
    name: str
    product_count: int = 0

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[SectorDetailResponse])
def list_sectors(
    db: Session = Depends(get_db),
):
    """
    List all healthcare sectors along with active product counts.
    Public endpoint.
    """
    sectors = db.query(Sector).order_by(asc(Sector.id)).all()
    sector_counts = dict(
        db.query(
            product_sector_association.c.sector_id,
            func.count(func.distinct(Product.id)),
        )
        .join(Product, product_sector_association.c.product_id == Product.id)
        .filter(Product.status == "Active")
        .group_by(product_sector_association.c.sector_id)
        .all()
    )

    return [
        SectorDetailResponse(
            id=s.id,
            name=s.name,
            product_count=sector_counts.get(s.id, 0),
        )
        for s in sectors
    ]


@router.get("/{sector_id}", response_model=SectorDetailResponse)
def get_sector(
    sector_id: int,
    db: Session = Depends(get_db),
):
    """
    Get single healthcare sector by ID.
    """
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Healthcare sector not found",
        )
    count = (
        db.query(func.count(func.distinct(Product.id)))
        .join(
            product_sector_association,
            product_sector_association.c.product_id == Product.id,
        )
        .filter(
            product_sector_association.c.sector_id == sector.id,
            Product.status == "Active",
        )
        .scalar()
        or 0
    )
    return SectorDetailResponse(
        id=sector.id,
        name=sector.name,
        product_count=count,
    )
