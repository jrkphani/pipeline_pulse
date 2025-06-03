"""Initial tables

Revision ID: 001
Revises: 
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Create initial analyses table"""
    op.create_table(
        'analyses',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), default=0),
        sa.Column('file_hash', sa.String(), nullable=False),
        sa.Column('total_deals', sa.Integer(), default=0),
        sa.Column('processed_deals', sa.Integer(), default=0),
        sa.Column('total_value', sa.Float(), default=0.0),
        sa.Column('data', sa.Text()),
        sa.Column('is_latest', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now()),
    )
    
    # Create indexes
    op.create_index('idx_analyses_is_latest', 'analyses', ['is_latest'])
    op.create_index('idx_analyses_created_at', 'analyses', ['created_at'])


def downgrade():
    """Drop initial tables"""
    op.drop_index('idx_analyses_created_at', 'analyses')
    op.drop_index('idx_analyses_is_latest', 'analyses')
    op.drop_table('analyses')
