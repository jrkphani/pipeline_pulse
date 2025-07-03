"""Add user state management tables

Revision ID: 009
Revises: 008
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_states table
    op.create_table('user_states',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(100), nullable=False, index=True),
        sa.Column('auth_state', sa.JSON(), nullable=True),
        sa.Column('ui_state', sa.JSON(), nullable=True),
        sa.Column('app_state', sa.JSON(), nullable=True),
        sa.Column('filter_state', sa.JSON(), nullable=True),
        sa.Column('state_version', sa.Integer(), default=1),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('sync_status', sa.String(50), default='synced'),
        sa.Column('sync_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create state_change_logs table
    op.create_table('state_change_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_state_id', sa.String(36), nullable=False, index=True),
        sa.Column('user_id', sa.String(100), nullable=False, index=True),
        sa.Column('change_type', sa.String(50), nullable=False),
        sa.Column('previous_value', sa.JSON(), nullable=True),
        sa.Column('new_value', sa.JSON(), nullable=True),
        sa.Column('change_source', sa.String(50), default='client'),
        sa.Column('client_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('server_timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('sync_id', sa.String(36), nullable=True),
        sa.Column('is_synced', sa.Boolean(), default=False),
    )

    # Create indexes for better performance
    op.create_index('ix_user_states_user_id_active', 'user_states', ['user_id', 'is_active'])
    op.create_index('ix_state_change_logs_user_id_type', 'state_change_logs', ['user_id', 'change_type'])
    op.create_index('ix_state_change_logs_sync_id', 'state_change_logs', ['sync_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_state_change_logs_sync_id', table_name='state_change_logs')
    op.drop_index('ix_state_change_logs_user_id_type', table_name='state_change_logs')
    op.drop_index('ix_user_states_user_id_active', table_name='user_states')
    
    # Drop tables
    op.drop_table('state_change_logs')
    op.drop_table('user_states')