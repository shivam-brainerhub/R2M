from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, asc, func
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin, require_permission
from app.core.security import create_email_verification_token, get_password_hash
from app.database import get_db
from app.models import (
    VALID_PERMISSION_LEVELS,
    ALL_PERMISSIONS_SECTIONS,
    Role,
    User,
    UserRole,
)
from app.schemas.user import AdminSetPasswordRequest, UserCreate, UserResponse, UserUpdate
from app.services.email import send_verification_email

router = APIRouter(
    prefix="/admin/users",
    tags=["Admin - User Management"],
)


def validate_custom_permissions(perms: Optional[dict]) -> None:
    if not perms:
        return
    for sec, lvl in perms.items():
        if sec not in ALL_PERMISSIONS_SECTIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid permission section '{sec}'. Allowed sections: {', '.join(ALL_PERMISSIONS_SECTIONS)}",
            )
        if lvl not in VALID_PERMISSION_LEVELS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid permission level '{lvl}' for section '{sec}'. Allowed levels: {', '.join(VALID_PERMISSION_LEVELS)}",
            )


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by username, email, or full name"),
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_email_verified: Optional[bool] = None,
    sort_by: Optional[str] = Query("id", pattern="^(id|username|email|created_at|last_login_at)$"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "read")),
):
    """
    List all platform users with search, filtering, and sorting. Requires 'users' read permission.
    """
    query = db.query(User)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
                User.organization.ilike(search_pattern),
            )
        )

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if is_email_verified is not None:
        query = query.filter(User.is_email_verified == is_email_verified)

    # Sorting
    sort_column = getattr(User, sort_by, User.id)
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    return query.offset(skip).limit(limit).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
):
    """
    Create a user with explicit role. Requires 'users' write permission.
    """
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )

    validate_custom_permissions(user_in.custom_permissions)

    role_id = user_in.role_id
    role_slug = (user_in.role or "user").strip().lower()
    if role_id is not None:
        db_role = db.query(Role).filter(Role.id == role_id).first()
        if not db_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with ID {role_id} does not exist",
            )
        role_slug = db_role.slug
    else:
        db_role = db.query(Role).filter(
            (Role.slug == role_slug) | (func.lower(Role.name) == role_slug)
        ).first()
        if db_role:
            role_id = db_role.id
            role_slug = db_role.slug

    # Security check: Only genuine administrators can create admin accounts or grant roles management
    if not current_user.is_admin:
        if role_slug == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only platform administrators can create admin accounts",
            )
        if user_in.custom_permissions and "roles" in user_in.custom_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only platform administrators can grant roles management permissions",
            )

    user = User(
        email=user_in.email.strip().lower(),
        username=user_in.username.strip(),
        full_name=user_in.full_name.strip() if user_in.full_name else None,
        phone=user_in.phone.strip() if user_in.phone else None,
        organization=user_in.organization.strip() if user_in.organization else None,
        hashed_password=get_password_hash(user_in.password),
        role=role_slug,
        role_id=role_id,
        custom_permissions=user_in.custom_permissions,
        is_active=user_in.is_active if user_in.is_active is not None else True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "read")),
):
    """
    Get user details by ID. Requires 'users' read permission.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
):
    """
    Update user profile, status, or role. Requires 'users' write permission.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Protect admin accounts from being modified by non-admin staff
    if user.is_admin and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform administrators can modify administrator accounts",
        )

    # Prevent user from deactivating or demoting their own account
    if user.id == current_user.id:
        if user_update.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account",
            )
        if current_user.is_admin:
            if user_update.role_id is not None:
                db_role = db.query(Role).filter(Role.id == user_update.role_id).first()
                if db_role and db_role.slug.lower() != "admin":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="You cannot remove your own admin privileges",
                    )
            elif user_update.role is not None and user_update.role.strip().lower() != "admin":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot remove your own admin privileges",
                )

    # Check email uniqueness if changing
    if user_update.email and user_update.email.strip().lower() != user.email.lower():
        if db.query(User).filter(func.lower(User.email) == user_update.email.strip().lower()).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken",
            )
        user.email = user_update.email.strip().lower()

    # Check username uniqueness if changing
    if user_update.username and user_update.username.strip().lower() != user.username.lower():
        if db.query(User).filter(func.lower(User.username) == user_update.username.strip().lower()).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken",
            )
        user.username = user_update.username.strip()

    if user_update.full_name is not None:
        user.full_name = user_update.full_name.strip() if user_update.full_name else None

    if user_update.phone is not None:
        user.phone = user_update.phone.strip() if user_update.phone else None

    if user_update.organization is not None:
        user.organization = user_update.organization.strip() if user_update.organization else None

    if user_update.role_id is not None:
        db_role = db.query(Role).filter(Role.id == user_update.role_id).first()
        if not db_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with ID {user_update.role_id} does not exist",
            )
        if not current_user.is_admin and db_role.slug.lower() == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only platform administrators can promote users to administrator",
            )
        user.role_id = db_role.id
        user.role = db_role.slug
    elif user_update.role is not None:
        role_input = user_update.role.strip().lower()
        if not current_user.is_admin and role_input == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only platform administrators can promote users to administrator",
            )
        db_role = db.query(Role).filter(
            (Role.slug == role_input) | (func.lower(Role.name) == role_input)
        ).first()
        if db_role:
            user.role_id = db_role.id
            user.role = db_role.slug
        else:
            user.role = role_input

    fields_set = getattr(user_update, "model_fields_set", getattr(user_update, "__fields_set__", set()))
    if "custom_permissions" in fields_set or user_update.custom_permissions is not None:
        validate_custom_permissions(user_update.custom_permissions)
        if not current_user.is_admin and user_update.custom_permissions and "roles" in user_update.custom_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only platform administrators can grant roles management permissions",
            )
        user.custom_permissions = user_update.custom_permissions

    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
):
    """
    Permanently delete a user account. Requires 'users' write permission.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_admin and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform administrators can delete administrator accounts",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only suspended accounts can be deleted. Please suspend this account first.",
        )

    username = user.username
    db.delete(user)
    db.commit()
    return {"message": f"User {username} deleted successfully"}


@router.post("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    is_active: bool = Query(..., description="Set active (true) or suspended (false)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
):
    """
    Suspend or unsuspend a user account. Requires 'users' write permission.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_admin and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform administrators can suspend administrator accounts",
        )

    if user.id == current_user.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot suspend your own account",
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/set-password")
def set_user_password(
    user_id: int,
    payload: AdminSetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
):
    """
    Directly set/reset a user's password. Requires 'users' write permission.
    """
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_admin and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform administrators can reset password for administrator accounts",
        )

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": f"Password for {user.username} has been updated successfully"}


@router.post("/{user_id}/resend-confirmation")
def admin_resend_confirmation_email(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
):
    """
    Resend confirmation verification email to a user who hasn't confirmed yet. Requires 'users' write permission.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User's email is already verified",
        )

    token = create_email_verification_token(user.email)
    send_verification_email(user.email, user.username, token)

    return {
        "message": f"Confirmation email successfully sent to {user.email}",
        "email": user.email,
    }
