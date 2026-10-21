from typing import List, Optional

from app.core.security import decode_token
from app.database import get_db
from app.models import User, UserRole
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    token_type = payload.get("type")
    if token_type != "access":
        raise credentials_exception

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return None
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.is_active:
        return user
    return None


def get_current_user_from_header_or_query(
    token_header: Optional[str] = Depends(oauth2_scheme),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
) -> User:
    effective_token = token_header or token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required to download official manufacturer documentation. Please sign in.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not effective_token:
        raise credentials_exception

    payload = decode_token(effective_token)
    if payload is None:
        raise credentials_exception

    token_type = payload.get("type")
    if token_type != "access":
        raise credentials_exception

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to access this resource",
        )
    return current_user


def require_permission(section: str, level: str = "read"):
    """
    Enforces section-based permission on endpoints.
    - level="read": Satisfied if effective permission is 'read' or 'read_write'
    - level="write": Satisfied only if effective permission is 'read_write'
    Administrators (is_admin=True) always bypass checks.
    """

    def permission_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.is_admin:
            return current_user

        perms = current_user.effective_permissions
        user_level = perms.get(section, "none")

        if level == "read" and user_level in ["read", "read_write"]:
            return current_user
        if level in ["write", "read_write"] and user_level == "read_write":
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to access {section} ({level} required)",
        )

    return permission_checker


def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return role_checker
