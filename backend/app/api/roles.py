import re
from typing import List

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import ALL_PERMISSIONS_SECTIONS, Role, User
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/admin/roles",
    tags=["Admin - Role & Permission Management"],
    dependencies=[Depends(require_admin)],
)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "_", text)
    return text.strip("_")


@router.get("", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    """
    List all platform roles with their section permissions and assigned user count.
    Accessible only by Admin.
    """
    roles = db.query(Role).order_by(Role.is_system.desc(), Role.id.asc()).all()
    results = []
    for r in roles:
        user_count = db.query(User).filter(User.role_id == r.id).count()
        results.append(
            RoleResponse(
                id=r.id,
                name=r.name,
                slug=r.slug,
                description=r.description,
                is_system=r.is_system,
                permissions=r.permissions or {},
                user_count=user_count,
                created_at=r.created_at,
            )
        )
    return results


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(role_in: RoleCreate, db: Session = Depends(get_db)):
    """
    Create a new custom user level/role with custom section permissions.
    Accessible only by Admin.
    """
    name = role_in.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name cannot be empty",
        )

    slug = slugify(name)
    if not slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role name",
        )

    if db.query(Role).filter((Role.name.ilike(name)) | (Role.slug == slug)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A role with name '{name}' or identifier '{slug}' already exists",
        )

    # Ensure permissions dict is populated
    permissions = dict(role_in.permissions)
    for section in ALL_PERMISSIONS_SECTIONS:
        if section not in permissions:
            permissions[section] = "none"

    role = Role(
        name=name,
        slug=slug,
        description=role_in.description,
        is_system=False,
        permissions=permissions,
    )
    db.add(role)
    db.commit()
    db.refresh(role)

    return RoleResponse(
        id=role.id,
        name=role.name,
        slug=role.slug,
        description=role.description,
        is_system=role.is_system,
        permissions=role.permissions,
        user_count=0,
        created_at=role.created_at,
    )


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """
    Get details of a specific role by ID.
    Accessible only by Admin.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    user_count = db.query(User).filter(User.role_id == role.id).count()
    return RoleResponse(
        id=role.id,
        name=role.name,
        slug=role.slug,
        description=role.description,
        is_system=role.is_system,
        permissions=role.permissions or {},
        user_count=user_count,
        created_at=role.created_at,
    )


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a role's name, description, or section permissions.
    Accessible only by Admin.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    if role_update.name is not None:
        new_name = role_update.name.strip()
        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name cannot be empty",
            )
        # Check uniqueness if name changed
        if new_name.lower() != role.name.lower():
            if (
                db.query(Role)
                .filter(Role.name.ilike(new_name), Role.id != role.id)
                .first()
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A role with name '{new_name}' already exists",
                )
            if not role.is_system:
                role.name = new_name
                role.slug = slugify(new_name)
            else:
                role.name = new_name

    if role_update.description is not None:
        role.description = role_update.description

    if role_update.permissions is not None:
        # If it's the admin role, permissions cannot be demoted
        if role.slug == "admin":
            role.permissions = {sec: "read_write" for sec in ALL_PERMISSIONS_SECTIONS}
        elif role.slug in ["user", "customer"]:
            role.permissions = {sec: "none" for sec in ALL_PERMISSIONS_SECTIONS}
        else:
            updated_perms = dict(role.permissions or {})
            updated_perms.update(role_update.permissions)
            for sec in ALL_PERMISSIONS_SECTIONS:
                if sec not in updated_perms:
                    updated_perms[sec] = "none"
            role.permissions = updated_perms

    db.commit()
    db.refresh(role)

    user_count = db.query(User).filter(User.role_id == role.id).count()
    return RoleResponse(
        id=role.id,
        name=role.name,
        slug=role.slug,
        description=role.description,
        is_system=role.is_system,
        permissions=role.permissions or {},
        user_count=user_count,
        created_at=role.created_at,
    )


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """
    Delete a custom role. Built-in system roles or roles with assigned users cannot be deleted.
    Accessible only by Admin.
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System roles cannot be deleted",
        )

    assigned_users_count = db.query(User).filter(User.role_id == role.id).count()
    if assigned_users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role '{role.name}' because {assigned_users_count} user(s) are currently assigned to it. Please reassign them first.",
        )

    role_name = role.name
    db.delete(role)
    db.commit()
    return {"message": f"Role '{role_name}' deleted successfully"}
