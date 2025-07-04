"""Add sync operations tables

Revision ID: 015_add_sync_operations_tables
Revises: 014_add_user_state_management
Create Date: 2025-07-04 09:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '015_add_sync_operations_tables'
down_revision = '014_add_user_state_management'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create zoho_sync_operations table
    op.create_table('zoho_sync_operations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('operation_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('total_records', sa.Integer(), nullable=True, default=0),
        sa.Column('successful_records', sa.Integer(), nullable=True, default=0),
        sa.Column('failed_records', sa.Integer(), nullable=True, default=0),
        sa.Column('conflicts_resolved', sa.Integer(), nullable=True, default=0),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create zoho_sync_conflicts table
    op.create_table('zoho_sync_conflicts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('operation_id', sa.String(length=36), nullable=False),
        sa.Column('record_id', sa.String(length=50), nullable=False),
        sa.Column('record_type', sa.String(length=50), nullable=False),
        sa.Column('conflict_type', sa.String(length=50), nullable=False),
        sa.Column('local_data', sa.JSON(), nullable=True),
        sa.Column('remote_data', sa.JSON(), nullable=True),
        sa.Column('resolution_strategy', sa.String(length=50), nullable=True),
        sa.Column('resolved_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_by', sa.String(length=100), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('zoho_sync_conflicts')
    op.drop_table('zoho_sync_operations')