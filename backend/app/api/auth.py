from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models import User, UserRole
from app.schemas.token import Token, TokenRefreshRequest
from app.schemas.user import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    UserPasswordChange,
    UserProfileUpdate,
    UserRegister,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register_public_user(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Public registration endpoint. Registers a standard public user.
    Sets is_email_verified=False and sends confirmation email.
    """
    existing_user_email = (
        db.query(User).filter(User.email == user_in.email).first()
    )
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    existing_username = (
        db.query(User).filter(User.username == user_in.username).first()
    )
    if existing_username:
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
        role=UserRole.USER,
        is_active=True,
        is_email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate verification token & dispatch confirmation email
    verification_token = create_email_verification_token(user.email)
    send_verification_email(user.email, user.username, verification_token)

    return user


@router.post("/verify-email")
def verify_email(
    request: VerifyEmailRequest, db: Session = Depends(get_db)
):
    """
    Verify user email address using the token sent via confirmation email.
    """
    payload = decode_token(request.token)
    if payload is None or payload.get("type") != "email_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email confirmation link.",
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    if user.is_email_verified:
        return {"message": "Email is already verified. You can now log in."}

    user.is_email_verified = True
    db.commit()
    return {"message": "Email successfully verified! You can now log in."}


@router.post("/resend-verification")
def resend_verification(
    request: ResendVerificationRequest, db: Session = Depends(get_db)
):
    """
    Resend confirmation email if the account exists and email is not yet verified.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if user and not user.is_email_verified and user.is_active:
        token = create_email_verification_token(user.email)
        send_verification_email(user.email, user.username, token)

    return {
        "message": "If an unverified account with this email exists, a new confirmation link has been sent."
    }


@router.post("/login", response_model=Token)
def login_json(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    JSON login endpoint for web apps (Next.js frontend and admin dashboard).
    Accepts email or username + password. Requires verified email.
    """
    user = (
        db.query(User)
        .filter(
            (User.email == credentials.username_or_email)
            | (User.username == credentials.username_or_email)
        )
        .first()
    )

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please confirm your email address before logging in. Check your inbox for the verification link.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login/oauth", response_model=Token)
def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Standard OAuth2 password flow endpoint (for Swagger UI / OpenAPI docs).
    """
    user = (
        db.query(User)
        .filter(
            (User.email == form_data.username)
            | (User.username == form_data.username)
        )
        .first()
    )

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please confirm your email address before logging in. Check your inbox for the verification link.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh_token(token_in: TokenRefreshRequest, db: Session = Depends(get_db)):
    """
    Rotate and issue new access & refresh tokens using a valid refresh token.
    """
    payload = decode_token(token_in.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type, refresh token required",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists or is inactive",
        )

    new_access_token = create_access_token(subject=user.id, role=user.role.value)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get profile details of currently authenticated user (Admin or Public User).
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update profile details (email, full name, phone) for currently authenticated user.
    """
    if profile_in.email is not None and profile_in.email != current_user.email:
        existing_user = (
            db.query(User)
            .filter(User.email == profile_in.email, User.id != current_user.id)
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists",
            )
        current_user.email = profile_in.email

    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name

    if profile_in.phone is not None:
        current_user.phone = profile_in.phone

    if profile_in.organization is not None:
        current_user.organization = profile_in.organization

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    password_data: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change password for currently authenticated user.
    """
    if not verify_password(
        password_data.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match",
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    request: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """
    Initiate password reset. If the email exists and is active, sends a password reset email.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if user and user.is_active:
        reset_token = create_password_reset_token(user.email)
        send_password_reset_email(user.email, user.username, reset_token)

    return {
        "message": "If an account with that email exists, password reset instructions have been sent.",
        "reset_token": None,
    }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest, db: Session = Depends(get_db)
):
    """
    Reset user password using a valid password reset token.
    """
    payload = decode_token(request.token)
    if payload is None or payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or is inactive",
        )

    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password has been successfully reset"}
