"""add_category_and_brand_fields
 
Revision ID: 82dda5fe3301
Revises: 71cca4edb201
Create Date: 2026-10-12 17:05:00.000000
 
"""
from typing import Sequence, Union
 
from alembic import op
import sqlalchemy as sa
 
 
# revision identifiers, used by Alembic.
revision: str = '82dda5fe3301'
down_revision: Union[str, None] = '71cca4edb201'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
 
 
def upgrade() -> None:
    # Categories additions
    op.add_column('categories', sa.Column('code', sa.String(), nullable=True))
    op.add_column('categories', sa.Column('icon', sa.String(), nullable=True))
    op.create_index(op.f('ix_categories_code'), 'categories', ['code'], unique=False)

    # Brands additions
    op.add_column('brands', sa.Column('slug', sa.String(), nullable=True))
    op.add_column('brands', sa.Column('country', sa.String(), nullable=True))
    op.add_column('brands', sa.Column('description', sa.String(), nullable=True))
    op.add_column('brands', sa.Column('website_url', sa.String(), nullable=True))
    op.add_column('brands', sa.Column('featured_in_slider', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.create_index(op.f('ix_brands_slug'), 'brands', ['slug'], unique=True)

    # Products category_id addition
    op.add_column('products', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_products_categories', 'products', 'categories', ['category_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_products_categories', 'products', type_='foreignkey')
    op.drop_column('products', 'category_id')

    op.drop_index(op.f('ix_brands_slug'), table_name='brands')
    op.drop_column('brands', 'featured_in_slider')
    op.drop_column('brands', 'website_url')
    op.drop_column('brands', 'description')
    op.drop_column('brands', 'country')
    op.drop_column('brands', 'slug')

    op.drop_index(op.f('ix_categories_code'), table_name='categories')
    op.drop_column('categories', 'icon')
    op.drop_column('categories', 'code')
