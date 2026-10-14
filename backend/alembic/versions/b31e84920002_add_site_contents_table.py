"""add_site_contents_table

Revision ID: b31e84920002
Revises: 9a23b4c10001
Create Date: 2026-10-13 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b31e84920002'
down_revision: Union[str, None] = '9a23b4c10001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'site_contents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_site_contents_id'), 'site_contents', ['id'], unique=False)
    op.create_index(op.f('ix_site_contents_key'), 'site_contents', ['key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_site_contents_key'), table_name='site_contents')
    op.drop_index(op.f('ix_site_contents_id'), table_name='site_contents')
    op.drop_table('site_contents')
