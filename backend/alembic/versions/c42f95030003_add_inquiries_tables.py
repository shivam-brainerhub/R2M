"""add_inquiries_tables

Revision ID: c42f95030003
Revises: b31e84920002
Create Date: 2026-10-14 12:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c42f95030003'
down_revision: Union[str, None] = 'b31e84920002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. contact_messages table
    op.create_table(
        'contact_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('organization', sa.String(), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(), server_default='New', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_contact_messages_id'), 'contact_messages', ['id'], unique=False)
    op.create_index(op.f('ix_contact_messages_email'), 'contact_messages', ['email'], unique=False)
    op.create_index(op.f('ix_contact_messages_status'), 'contact_messages', ['status'], unique=False)

    # 2. supplier_applications table
    op.create_table(
        'supplier_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(), nullable=False),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('contact_person', sa.String(), nullable=False),
        sa.Column('job_title', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('overview', sa.Text(), nullable=False),
        sa.Column('status', sa.String(), server_default='New', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_supplier_applications_id'), 'supplier_applications', ['id'], unique=False)
    op.create_index(op.f('ix_supplier_applications_company_name'), 'supplier_applications', ['company_name'], unique=False)
    op.create_index(op.f('ix_supplier_applications_email'), 'supplier_applications', ['email'], unique=False)
    op.create_index(op.f('ix_supplier_applications_category'), 'supplier_applications', ['category'], unique=False)
    op.create_index(op.f('ix_supplier_applications_status'), 'supplier_applications', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_supplier_applications_status'), table_name='supplier_applications')
    op.drop_index(op.f('ix_supplier_applications_category'), table_name='supplier_applications')
    op.drop_index(op.f('ix_supplier_applications_email'), table_name='supplier_applications')
    op.drop_index(op.f('ix_supplier_applications_company_name'), table_name='supplier_applications')
    op.drop_index(op.f('ix_supplier_applications_id'), table_name='supplier_applications')
    op.drop_table('supplier_applications')

    op.drop_index(op.f('ix_contact_messages_status'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_email'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_id'), table_name='contact_messages')
    op.drop_table('contact_messages')
