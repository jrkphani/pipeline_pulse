"""Add bulk update tables

Revision ID: 003
Revises: 002
Create Date: 2025-01-02 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

def upgrade():
    """Create bulk update tables for tracking batch operations"""
    
    # Create bulk_update_batches table
    op.create_table(
        'bulk_update_batches',
        sa.Column('batch_id', sa.String(), primary_key=True, index=True),
        sa.Column('field_name', sa.String(), nullable=False),
        sa.Column('field_value', sa.Text(), nullable=False),
        sa.Column('total_records', sa.Integer(), default=0),
        sa.Column('successful_updates', sa.Integer(), default=0),
        sa.Column('failed_updates', sa.Integer(), default=0),
        sa.Column('status', sa.String(), default='pending'),
        sa.Column('sync_status', sa.String(), default='not_synced'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('error_details', sa.Text()),
    )
    
    # Create bulk_update_records table
    op.create_table(
        'bulk_update_records',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('batch_id', sa.String(), sa.ForeignKey('bulk_update_batches.batch_id'), nullable=False),
        sa.Column('record_id', sa.String(), nullable=False, index=True),
        sa.Column('zoho_id', sa.String(), index=True),
        sa.Column('old_value', sa.Text()),
        sa.Column('new_value', sa.Text()),
        sa.Column('status', sa.String(), default='pending'),
        sa.Column('sync_status', sa.String(), default='not_synced'),
        sa.Column('error_message', sa.Text()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('synced_at', sa.DateTime(timezone=True)),
    )
    
    # Create indexes for better performance
    op.create_index('idx_bulk_update_batches_status', 'bulk_update_batches', ['status'])
    op.create_index('idx_bulk_update_batches_sync_status', 'bulk_update_batches', ['sync_status'])
    op.create_index('idx_bulk_update_batches_created_at', 'bulk_update_batches', ['created_at'])
    
    op.create_index('idx_bulk_update_records_batch_id', 'bulk_update_records', ['batch_id'])
    op.create_index('idx_bulk_update_records_status', 'bulk_update_records', ['status'])
    op.create_index('idx_bulk_update_records_sync_status', 'bulk_update_records', ['sync_status'])
    op.create_index('idx_bulk_update_records_record_id', 'bulk_update_records', ['record_id'])
    op.create_index('idx_bulk_update_records_zoho_id', 'bulk_update_records', ['zoho_id'])

def downgrade():
    """Drop bulk update tables"""
    
    # Drop indexes first
    op.drop_index('idx_bulk_update_records_zoho_id', 'bulk_update_records')
    op.drop_index('idx_bulk_update_records_record_id', 'bulk_update_records')
    op.drop_index('idx_bulk_update_records_sync_status', 'bulk_update_records')
    op.drop_index('idx_bulk_update_records_status', 'bulk_update_records')
    op.drop_index('idx_bulk_update_records_batch_id', 'bulk_update_records')
    
    op.drop_index('idx_bulk_update_batches_created_at', 'bulk_update_batches')
    op.drop_index('idx_bulk_update_batches_sync_status', 'bulk_update_batches')
    op.drop_index('idx_bulk_update_batches_status', 'bulk_update_batches')
    
    # Drop tables
    op.drop_table('bulk_update_records')
    op.drop_table('bulk_update_batches')
