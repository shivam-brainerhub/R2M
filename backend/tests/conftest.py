import pytest
from starlette.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, UserRole
from app.core.security import get_password_hash, create_access_token


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
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


@pytest.fixture(scope="session")
def admin_token_headers(test_admin_user):
    token = create_access_token(
        subject=test_admin_user.id, role=test_admin_user.role.value
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def user_token_headers(test_regular_user):
    token = create_access_token(
        subject=test_regular_user.id, role=test_regular_user.role.value
    )
    return {"Authorization": f"Bearer {token}"}
