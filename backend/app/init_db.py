import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    # Check if an admin already exists
    admin = (
        db.query(User)
        .filter(
            (User.email == settings.INITIAL_ADMIN_EMAIL)
            | (User.role == UserRole.ADMIN)
        )
        .first()
    )

    if not admin:
        logger.info("Creating initial admin user...")
        admin_user = User(
            email=settings.INITIAL_ADMIN_EMAIL,
            username=settings.INITIAL_ADMIN_USERNAME,
            full_name="Platform Administrator",
            hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        logger.info(
            f"Initial admin created successfully: {settings.INITIAL_ADMIN_EMAIL}"
        )
    else:
        logger.info("Admin user already exists. Skipping seed.")
