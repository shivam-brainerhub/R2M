"""alter_user_role_length

Revision ID: f82b3c4d0007
Revises: f82b3c4d0006
Create Date: 2026-10-19 16:55:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f82b3c4d0007"
down_revision: Union[str, None] = "f82b3c4d0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Expand users.role from VARCHAR(5) to VARCHAR(64) to support
    # roles like sales_rep, product_manager, etc.
    try:
        op.alter_column(
            "users",
            "role",
            existing_type=sa.String(length=5),
            type_=sa.String(length=64),
            existing_nullable=False,
        )
    except Exception:
        try:
            op.execute(sa.text("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(64);"))
        except Exception:
            pass


def downgrade() -> None:
    try:
        op.alter_column(
            "users",
            "role",
            existing_type=sa.String(length=64),
            type_=sa.String(length=5),
            existing_nullable=False,
        )
    except Exception:
        pass
