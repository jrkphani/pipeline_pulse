"""Add S3 fields to analyses table

Revision ID: 006
Revises: 005
Create Date: 2025-06-03 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    # Add S3-related columns to analyses table
    op.add_column('analyses', sa.Column('s3_key', sa.String(), nullable=True))
    op.add_column('analyses', sa.Column('s3_bucket', sa.String(), nullable=True))
    
    # Update the file_path column comment
    op.alter_column('analyses', 'file_path', comment='S3 URL or local path to stored file')


def downgrade():
    # Remove S3-related columns
    op.drop_column('analyses', 's3_bucket')
    op.drop_column('analyses', 's3_key')
    
    # Revert file_path column comment
    op.alter_column('analyses', 'file_path', comment='Path to stored file')
