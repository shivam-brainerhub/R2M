import logging
import threading
from typing import Any, Dict, List, Optional
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import SessionLocal
from app.models import Brand, Category, Product, ProductPropertyValue, Property, Subcategory

logger = logging.getLogger(__name__)


class FilterCacheService:
    def __init__(self):
        self._cache: Optional[Dict[str, Any]] = None
        self._lock = threading.Lock()
        self._is_refreshing = False

    def get_filter_options(self, db: Session) -> Dict[str, Any]:
        """
        Return cached filter options from memory if available;
        otherwise compute, store in memory, and return.
        """
        if self._cache is not None:
            return self._cache

        with self._lock:
            # Double-check inside lock
            if self._cache is not None:
                return self._cache
            self._cache = self.compute_filter_options(db)
            return self._cache

    def compute_filter_options(self, db: Session) -> Dict[str, Any]:
        """
        Compute all sidebar filter options and counts across active products in the catalogue.
        """
        # 1. Total Active Products
        total_products = (
            db.query(func.count(Product.id))
            .filter(Product.status == "Active")
            .scalar()
            or 0
        )

        # 2. Categories with active product counts & subcategories with active product counts
        categories = (
            db.query(Category)
            .options(joinedload(Category.subcategories))
            .order_by(asc(Category.code).nulls_last(), asc(Category.name))
            .all()
        )

        categories_data = []
        for cat in categories:
            # Count active products in this category (either directly category_id or via subcategory)
            cat_count = (
                db.query(func.count(func.distinct(Product.id)))
                .outerjoin(Subcategory, Product.subcategory_id == Subcategory.id)
                .filter(
                    Product.status == "Active",
                    or_(
                        Product.category_id == cat.id,
                        Subcategory.category_id == cat.id,
                    ),
                )
                .scalar()
                or 0
            )

            subs_data = []
            if cat.subcategories:
                for sub in sorted(cat.subcategories, key=lambda s: s.name):
                    sub_count = (
                        db.query(func.count(func.distinct(Product.id)))
                        .filter(
                            Product.status == "Active",
                            Product.subcategory_id == sub.id,
                        )
                        .scalar()
                        or 0
                    )
                    subs_data.append({
                        "id": sub.id,
                        "category_id": sub.category_id,
                        "name": sub.name,
                        "slug": sub.slug,
                        "product_count": sub_count,
                    })

            categories_data.append({
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "code": cat.code,
                "description": cat.description,
                "icon": cat.icon,
                "product_count": cat_count,
                "subcategories": subs_data,
            })

        # 3. Brands with active product counts
        brands = db.query(Brand).order_by(asc(Brand.name)).all()
        brand_counts = dict(
            db.query(Product.brand_id, func.count(Product.id))
            .filter(Product.status == "Active", Product.brand_id.isnot(None))
            .group_by(Product.brand_id)
            .all()
        )

        brands_data = []
        for b in brands:
            count = brand_counts.get(b.id, 0)
            brands_data.append({
                "id": b.id,
                "name": b.name,
                "slug": b.slug,
                "count": count,
            })
        # Sort descending by count, then alphabetical
        brands_data.sort(key=lambda x: (-x["count"], x["name"].lower()))

        # 4. Dynamic Property Groups across active products
        prop_query = (
            db.query(
                Property.name,
                Property.group,
                ProductPropertyValue.value,
                func.count(func.distinct(Product.id)),
            )
            .join(ProductPropertyValue, Property.id == ProductPropertyValue.property_id)
            .join(Product, ProductPropertyValue.product_id == Product.id)
            .filter(Product.status == "Active")
            .group_by(Property.name, Property.group, ProductPropertyValue.value)
            .all()
        )

        props_map: Dict[str, Dict[str, Any]] = {}
        for prop_name, prop_group, val_str, val_count in prop_query:
            if not prop_name or not val_str:
                continue
            clean_name = prop_name.strip()
            clean_val = val_str.strip()
            if not clean_name or not clean_val:
                continue

            if clean_name not in props_map:
                props_map[clean_name] = {
                    "name": clean_name,
                    "group": prop_group,
                    "options_dict": {},
                }
            options_dict = props_map[clean_name]["options_dict"]
            options_dict[clean_val] = options_dict.get(clean_val, 0) + val_count

        properties_data = []
        for prop_name, p_info in sorted(props_map.items()):
            opts = [
                {"value": val, "count": cnt}
                for val, cnt in p_info["options_dict"].items()
            ]
            opts.sort(key=lambda x: (-x["count"], x["value"]))
            properties_data.append({
                "name": p_info["name"],
                "group": p_info["group"],
                "options": opts,
            })

        # 5. Availability Counts
        brochure_count = (
            db.query(func.count(Product.id))
            .filter(
                Product.status == "Active",
                Product.brochure_url.isnot(None),
                Product.brochure_url != "",
            )
            .scalar()
            or 0
        )

        availability_data = {
            "active_count": total_products,
            "brochure_count": brochure_count,
        }

        return {
            "total_products": total_products,
            "categories": categories_data,
            "brands": brands_data,
            "properties": properties_data,
            "availability": availability_data,
        }

    def refresh_in_background(self):
        """
        Background worker function that recomputes the filter cache in a separate DB session.
        Safe against unhandled exceptions so background task never disrupts the application.
        """
        with self._lock:
            if self._is_refreshing:
                return
            self._is_refreshing = True

        try:
            db = SessionLocal()
            try:
                new_data = self.compute_filter_options(db)
                with self._lock:
                    self._cache = new_data
                logger.info("Product filter options cache updated in background.")
            finally:
                db.close()
        except Exception as e:
            logger.error("Failed to update product filter options cache in background: %s", e)
        finally:
            with self._lock:
                self._is_refreshing = False

    def invalidate(self):
        """
        Explicitly clear cache so next read will recompute immediately.
        """
        with self._lock:
            self._cache = None


filter_cache_service = FilterCacheService()
