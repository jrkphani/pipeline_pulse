"""Add token management tables

Revision ID: 011_add_token_management_tables
Revises: 010_add_zoho_oauth_tokens
Create Date: 2025-07-04 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011_add_token_management_tables'
down_revision = '010_add_zoho_oauth_tokens'
branch_labels = None
depends_on = None


def upgrade():
    """Create token management tables for comprehensive token lifecycle tracking"""
    
    # Create zoho_token_records table
    op.create_table(
        'zoho_token_records',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('access_token_hash', sa.String(64), nullable=True),
        sa.Column('refresh_token_hash', sa.String(64), nullable=True),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_used', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_refreshed', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_expired', sa.Boolean, default=False),
        sa.Column('refresh_count', sa.Integer, default=0),
        sa.Column('last_error', sa.Text, nullable=True),
        sa.Column('error_count', sa.Integer, default=0),
        sa.Column('last_error_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('token_source', sa.String(50), default="manual"),
        sa.Column('client_id', sa.String(100), nullable=False),
        sa.Column('scopes', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create token_refresh_logs table
    op.create_table(
        'token_refresh_logs',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('token_record_id', sa.String(36), nullable=False),
        sa.Column('attempted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('success', sa.Boolean, nullable=False),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('response_code', sa.Integer, nullable=True),
        sa.Column('response_time_ms', sa.Integer, nullable=True),
        sa.Column('retry_count', sa.Integer, default=0),
        sa.Column('trigger_reason', sa.String(100), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Create token_alerts table
    op.create_table(
        'token_alerts',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('token_record_id', sa.String(36), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), default="medium"),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('is_acknowledged', sa.Boolean, default=False),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('acknowledged_by', sa.String(100), nullable=True),
        sa.Column('is_resolved', sa.Boolean, default=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolution_reason', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create indexes
    op.create_index('idx_token_records_id', 'zoho_token_records', ['id'])
    op.create_index('idx_token_refresh_logs_token_id', 'token_refresh_logs', ['token_record_id'])
    op.create_index('idx_token_alerts_token_id', 'token_alerts', ['token_record_id'])


def downgrade():
    """Drop token management tables"""
    # Drop indexes
    op.drop_index('idx_token_alerts_token_id', table_name='token_alerts')
    op.drop_index('idx_token_refresh_logs_token_id', table_name='token_refresh_logs')
    op.drop_index('idx_token_records_id', table_name='zoho_token_records')
    
    # Drop tables
    op.drop_table('token_alerts')
    op.drop_table('token_refresh_logs')
    op.drop_table('zoho_token_records')