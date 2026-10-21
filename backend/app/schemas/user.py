from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from app.models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None


class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"
    role_id: Optional[int] = None
    custom_permissions: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    role_id: Optional[int] = None
    custom_permissions: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


class AdminSetPasswordRequest(BaseModel):
    new_password: str


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class UserResponse(UserBase):
    id: int
    role: str
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    is_admin: bool = False
    has_custom_permissions: bool = False
    custom_permissions: Optional[Dict[str, str]] = None
    permissions: Dict[str, str] = {}
    is_active: bool
    is_email_verified: bool
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v):
        if hasattr(v, "value"):
            return str(v.value).lower()
        if isinstance(v, str):
            return v.lower()
        return "user"
