from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin
from app.core.security import create_email_verification_token, get_password_hash
from app.database import get_db
from app.models import User, UserRole
from app.schemas.user import AdminSetPasswordRequest, UserCreate, UserResponse, UserUpdate
from app.services.email import send_verification_email

router = APIRouter(
    prefix="/admin/users",
    tags=["Admin - User Management"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by username, email, or full name"),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    is_email_verified: Optional[bool] = None,
    sort_by: Optional[str] = Query("id", pattern="^(id|username|email|created_at|last_login_at)$"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """
    List all platform users with search, filtering, and sorting. Accessible only by Admin.
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
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Create a user with explicit role (admin or user). Accessible only by Admin.
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

    user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        phone=user_in.phone,
        organization=user_in.organization,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or UserRole.USER,
        is_active=user_in.is_active if user_in.is_active is not None else True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """
    Get user details by ID. Accessible only by Admin.
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
    current_admin: User = Depends(require_admin),
):
    """
    Update user profile, status, or role. Accessible only by Admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent admin from deactivating themselves
    if (
        user.id == current_admin.id
        and user_update.is_active is False
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own admin account",
        )

    # Check email uniqueness if changing
    if user_update.email and user_update.email != user.email:
        if db.query(User).filter(User.email == user_update.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken",
            )
        user.email = user_update.email

    # Check username uniqueness if changing
    if user_update.username and user_update.username != user.username:
        if db.query(User).filter(User.username == user_update.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken",
            )
        user.username = user_update.username

    if user_update.full_name is not None:
        user.full_name = user_update.full_name

    if user_update.phone is not None:
        user.phone = user_update.phone

    if user_update.organization is not None:
        user.organization = user_update.organization

    if user_update.role is not None:
        user.role = user_update.role

    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Permanently delete a user account. Accessible only by Admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account",
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
    current_admin: User = Depends(require_admin),
):
    """
    Suspend or unsuspend a user account. Accessible only by Admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_admin.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot suspend your own admin account",
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
    current_admin: User = Depends(require_admin),
):
    """
    Directly set/reset a user's password. Accessible only by Admin.
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

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": f"Password for {user.username} has been updated successfully"}


@router.post("/{user_id}/resend-confirmation")
def admin_resend_confirmation_email(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Resend confirmation verification email to a user who hasn't confirmed yet. Accessible only by Admin.
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
