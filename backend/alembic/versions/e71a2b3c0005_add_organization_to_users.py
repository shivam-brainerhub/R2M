"""add_organization_to_users

Revision ID: e71a2b3c0005
Revises: d56f1a8e0004
Create Date: 2026-10-15 11:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e71a2b3c0005"
down_revision: Union[str, None] = "d56f1a8e0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("organization", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "organization")
