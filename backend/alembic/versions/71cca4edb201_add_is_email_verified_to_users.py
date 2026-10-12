"""add_is_email_verified_to_users

Revision ID: 71cca4edb201
Revises: 60bba3fdb100
Create Date: 2026-10-12 15:26:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71cca4edb201'
down_revision: Union[str, None] = '60bba3fdb100'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('users', 'is_email_verified')
