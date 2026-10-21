"""add_roles_and_permissions

Revision ID: f82b3c4d0006
Revises: e71a2b3c0005
Create Date: 2026-10-19 15:15:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f82b3c4d0006"
down_revision: Union[str, None] = "e71a2b3c0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create roles table
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column(
            "is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("permissions", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_roles_id"), "roles", ["id"], unique=False)
    op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=True)
    op.create_index(op.f("ix_roles_slug"), "roles", ["slug"], unique=True)

    # 2. Add columns to users table
    op.add_column("users", sa.Column("role_id", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("custom_permissions", sa.JSON(), nullable=True))
    op.create_index(op.f("ix_users_role_id"), "users", ["role_id"], unique=False)

    # Expand users.role column
    try:
        op.alter_column(
            "users",
            "role",
            type_=sa.String(length=64),
            existing_type=sa.String(length=5),
            existing_nullable=False,
        )
    except Exception:
        pass

    # Try creating foreign key constraint
    try:
        op.create_foreign_key(
            "fk_users_role_id_roles",
            "users",
            "roles",
            ["role_id"],
            ["id"],
            ondelete="SET NULL",
        )
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_constraint("fk_users_role_id_roles", "users", type_="foreignkey")
    except Exception:
        pass
    op.drop_index(op.f("ix_users_role_id"), table_name="users")
    op.drop_column("users", "custom_permissions")
    op.drop_column("users", "role_id")
    op.drop_index(op.f("ix_roles_slug"), table_name="roles")
    op.drop_index(op.f("ix_roles_name"), table_name="roles")
    op.drop_index(op.f("ix_roles_id"), table_name="roles")
    op.drop_table("roles")
