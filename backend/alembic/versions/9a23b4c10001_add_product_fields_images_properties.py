"""add_product_fields_images_properties

Revision ID: 9a23b4c10001
Revises: 82dda5fe3301
Create Date: 2026-10-13 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a23b4c10001'
down_revision: Union[str, None] = 'e98323fd754f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Product additions
    op.add_column('products', sa.Column('sku', sa.String(), nullable=True))
    op.add_column('products', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('products', sa.Column('short_description', sa.String(), nullable=True))
    op.add_column('products', sa.Column('brochure_url', sa.String(), nullable=True))
    op.add_column('products', sa.Column('meta_title', sa.String(), nullable=True))
    op.add_column('products', sa.Column('meta_description', sa.String(), nullable=True))
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)

    # 2. Product images table
    op.create_table(
        'product_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('alt_text', sa.String(), nullable=True),
        sa.Column('is_primary', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_product_images_id'), 'product_images', ['id'], unique=False)
    op.create_index(op.f('ix_product_images_product_id'), 'product_images', ['product_id'], unique=False)

    # 3. Properties table
    op.create_table(
        'properties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('group', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_properties_id'), 'properties', ['id'], unique=False)
    op.create_index(op.f('ix_properties_name'), 'properties', ['name'], unique=True)

    # 4. Product property values table
    op.create_table(
        'product_property_values',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', 'property_id', name='uq_product_property'),
    )
    op.create_index(op.f('ix_product_property_values_id'), 'product_property_values', ['id'], unique=False)
    op.create_index(op.f('ix_product_property_values_product_id'), 'product_property_values', ['product_id'], unique=False)
    op.create_index(op.f('ix_product_property_values_property_id'), 'product_property_values', ['property_id'], unique=False)


def downgrade() -> None:
    op.drop_table('product_property_values')
    op.drop_table('properties')
    op.drop_table('product_images')

    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.drop_column('products', 'meta_description')
    op.drop_column('products', 'meta_title')
    op.drop_column('products', 'brochure_url')
    op.drop_column('products', 'short_description')
    op.drop_column('products', 'description')
    op.drop_column('products', 'sku')
