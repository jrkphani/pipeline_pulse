"""Add incremental tracking fields to analyses table

Revision ID: 007
Revises: 006
Create Date: 2025-01-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Add incremental update tracking columns to analyses table
    op.add_column('analyses', sa.Column('export_date', sa.Date(), nullable=True))
    op.add_column('analyses', sa.Column('import_type', sa.String(20), nullable=True, default='new_dataset'))
    op.add_column('analyses', sa.Column('records_added', sa.Integer(), default=0))
    op.add_column('analyses', sa.Column('records_updated', sa.Integer(), default=0))
    op.add_column('analyses', sa.Column('records_removed', sa.Integer(), default=0))
    op.add_column('analyses', sa.Column('parent_analysis_id', sa.String(36), nullable=True))
    
    # Add foreign key constraint for parent_analysis_id
    op.create_foreign_key(
        'fk_analyses_parent_analysis_id',
        'analyses', 'analyses',
        ['parent_analysis_id'], ['id']
    )


def downgrade():
    # Remove foreign key constraint first
    op.drop_constraint('fk_analyses_parent_analysis_id', 'analyses', type_='foreignkey')
    
    # Remove incremental update tracking columns
    op.drop_column('analyses', 'parent_analysis_id')
    op.drop_column('analyses', 'records_removed')
    op.drop_column('analyses', 'records_updated')
    op.drop_column('analyses', 'records_added')
    op.drop_column('analyses', 'import_type')
    op.drop_column('analyses', 'export_date')
