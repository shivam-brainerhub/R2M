"""add_phone_to_users

Revision ID: d56f1a8e0004
Revises: 388eb5315dbe
Create Date: 2026-10-14 11:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd56f1a8e0004'
down_revision: Union[str, None] = '388eb5315dbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'phone')
