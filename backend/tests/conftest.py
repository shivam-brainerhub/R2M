import os
import pytest

# Ensure tests use an isolated in-memory SQLite database so that
# the PostgreSQL database is never affected by test runs.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from starlette.testclient import TestClient
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import User, UserRole
from app.core.security import get_password_hash, create_access_token


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.init_db import init_db
        init_db(db)

        from app.models import Category, Brand, Product, ProductImage, Property, ProductPropertyValue
        diag = db.query(Category).filter(Category.slug == "diagnostic-and-measure").first()
        mindray = db.query(Brand).filter(Brand.slug == "mindray").first()
        philips = db.query(Brand).filter(Brand.slug == "philips").first()
        draeger = db.query(Brand).filter(Brand.slug == "draeger").first()
        contec = db.query(Brand).filter(Brand.slug == "contec").first()

        props_to_seed = ["Display Size", "Touch Screen", "Battery Life", "Weight", "Parameters"]
        prop_objs = {}
        for pname in props_to_seed:
            prop_obj = db.query(Property).filter(Property.name == pname).first()
            if not prop_obj:
                prop_obj = Property(name=pname, group="General")
                db.add(prop_obj)
                db.flush()
            prop_objs[pname] = prop_obj

        sample_products = [
            ("BeneVision N12", "benevision-n12", "MN-N12-001", mindray.id if mindray else None, '12.1" Touchscreen'),
            ("IntelliVue MX450", "intellivue-mx450", "PH-MX450-002", philips.id if philips else None, '12.0" Touchscreen'),
            ("Infinity M300", "infinity-m300", "DR-M300-003", draeger.id if draeger else None, 'Color OLED'),
            ("CMS8000", "contec-cms8000", "CT-CMS8000-004", contec.id if contec else None, '12.1" TFT LCD'),
        ]

        for name, slug, sku, b_id, disp_val in sample_products:
            specs = {
                "Display Size": disp_val,
                "Touch Screen": "Yes",
                "Battery Life": "4 hours",
                "Weight": "4 kg",
                "Parameters": "ECG, SpO2",
            }
            p = Product(
                name=name,
                slug=slug,
                sku=sku,
                brand_id=b_id,
                category_id=diag.id if diag else None,
                status="Active",
                brochure_url=f"/media/brochures/{slug}.pdf",
                specifications=specs,
            )
            db.add(p)
            db.flush()
            db.add(ProductImage(product_id=p.id, image_url=f"/images/{slug}.jpg", is_primary=True, display_order=0))
            for k, v in specs.items():
                db.add(ProductPropertyValue(product_id=p.id, property_id=prop_objs[k].id, value=v))
        db.commit()

        # Invalidate filter cache so it reflects the test products
        from app.services.filter_cache import filter_cache_service
        filter_cache_service._cache = None
    finally:
        db.close()

    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def test_admin_user(db_session):
    admin = db_session.query(User).filter(User.username == "test_admin").first()
    if not admin:
        admin = User(
            email="test_admin@r2m.co.za",
            username="test_admin",
            full_name="Test Administrator",
            hashed_password=get_password_hash("AdminPass123!"),
            role=UserRole.ADMIN,
            is_active=True,
            is_email_verified=True,
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return admin


@pytest.fixture(scope="session")
def test_regular_user(db_session):
    user = db_session.query(User).filter(User.username == "test_regular").first()
    if not user:
        user = User(
            email="test_regular@hospital.co.za",
            username="test_regular",
            full_name="Test Regular User",
            hashed_password=get_password_hash("UserPass123!"),
            role=UserRole.USER,
            is_active=True,
            is_email_verified=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


@pytest.fixture(scope="session")
def admin_token_headers(test_admin_user):
    role_str = test_admin_user.role.value if hasattr(test_admin_user.role, "value") else str(test_admin_user.role)
    token = create_access_token(
        subject=test_admin_user.id, role=role_str
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def user_token_headers(test_regular_user):
    role_str = test_regular_user.role.value if hasattr(test_regular_user.role, "value") else str(test_regular_user.role)
    token = create_access_token(
        subject=test_regular_user.id, role=role_str
    )
    return {"Authorization": f"Bearer {token}"}
