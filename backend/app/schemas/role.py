from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, ConfigDict, field_validator
from app.models import ALL_PERMISSIONS_SECTIONS, VALID_PERMISSION_LEVELS


def sanitize_permissions(perms: Optional[Dict[str, str]]) -> Dict[str, str]:
    cleaned = {}
    perms = perms or {}
    for section in ALL_PERMISSIONS_SECTIONS:
        val = perms.get(section, "none")
        if val not in VALID_PERMISSION_LEVELS:
            val = "none"
        cleaned[section] = val
    return cleaned


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Dict[str, str] = {}

    @field_validator("permissions", mode="before")
    @classmethod
    def validate_perms(cls, v):
        if isinstance(v, dict):
            return sanitize_permissions(v)
        return sanitize_permissions({})


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, str]] = None

    @field_validator("permissions", mode="before")
    @classmethod
    def validate_perms(cls, v):
        if v is not None and isinstance(v, dict):
            return sanitize_permissions(v)
        return v


class RoleResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    is_system: bool = False
    permissions: Dict[str, str] = {}
    user_count: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
