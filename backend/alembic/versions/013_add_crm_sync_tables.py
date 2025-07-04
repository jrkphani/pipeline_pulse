"""Add CRM sync session tables

Revision ID: 013_add_crm_sync_tables
Revises: 012_add_users_table
Create Date: 2025-07-04 11:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '013_add_crm_sync_tables'
down_revision = '012_add_users_table'
branch_labels = None
depends_on = None


def upgrade():
    """Create CRM sync session tables"""
    
    # Create crm_sync_sessions table
    op.create_table(
        'crm_sync_sessions',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('session_name', sa.String(255), nullable=True),
        sa.Column('operation_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('initiated_by', sa.String(100), nullable=True),
        sa.Column('sync_trigger', sa.String(100), nullable=True),
        sa.Column('sync_scope', sa.JSON, nullable=True),
        sa.Column('filters_applied', sa.JSON, nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_records_processed', sa.Integer, default=0),
        sa.Column('successful_records', sa.Integer, default=0),
        sa.Column('failed_records', sa.Integer, default=0),
        sa.Column('skipped_records', sa.Integer, default=0),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('error_details', sa.JSON, nullable=True),
        sa.Column('performance_metrics', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create sync_status_logs table
    op.create_table(
        'sync_status_logs',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('message', sa.Text, nullable=True),
        sa.Column('details', sa.JSON, nullable=True),
        sa.Column('progress_percentage', sa.Float, nullable=True),
        sa.Column('records_processed', sa.Integer, nullable=True),
        sa.Column('current_operation', sa.String(255), nullable=True),
        sa.Column('estimated_completion', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create record_sync_status table
    op.create_table(
        'record_sync_status',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('session_id', sa.String(36), nullable=False),
        sa.Column('record_id', sa.String(50), nullable=False),
        sa.Column('record_type', sa.String(50), nullable=False),
        sa.Column('sync_action', sa.String(50), nullable=False),
        sa.Column('sync_status', sa.String(50), nullable=False),
        sa.Column('crm_last_modified', sa.DateTime(timezone=True), nullable=True),
        sa.Column('local_last_modified', sa.DateTime(timezone=True), nullable=True),
        sa.Column('conflict_detected', sa.Boolean, default=False),
        sa.Column('conflict_resolution', sa.String(50), nullable=True),
        sa.Column('field_changes', sa.JSON, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('sync_attempts', sa.Integer, default=1),
        sa.Column('last_sync_attempt', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create sync_configurations table
    op.create_table(
        'sync_configurations',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('config_name', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('sync_frequency_minutes', sa.Integer, default=15),
        sa.Column('modules_to_sync', sa.JSON, nullable=True),
        sa.Column('field_mappings', sa.JSON, nullable=True),
        sa.Column('filters', sa.JSON, nullable=True),
        sa.Column('conflict_resolution_strategy', sa.String(50), default="crm_wins"),
        sa.Column('max_retry_attempts', sa.Integer, default=3),
        sa.Column('batch_size', sa.Integer, default=100),
        sa.Column('enable_webhooks', sa.Boolean, default=False),
        sa.Column('webhook_events', sa.JSON, nullable=True),
        sa.Column('notification_settings', sa.JSON, nullable=True),
        sa.Column('created_by', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create sync_health_metrics table
    op.create_table(
        'sync_health_metrics',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('metric_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_syncs', sa.Integer, default=0),
        sa.Column('successful_syncs', sa.Integer, default=0),
        sa.Column('failed_syncs', sa.Integer, default=0),
        sa.Column('average_sync_duration', sa.Float, nullable=True),
        sa.Column('total_records_synced', sa.Integer, default=0),
        sa.Column('error_rate_percentage', sa.Float, nullable=True),
        sa.Column('api_calls_made', sa.Integer, default=0),
        sa.Column('api_quota_remaining', sa.Integer, nullable=True),
        sa.Column('conflict_count', sa.Integer, default=0),
        sa.Column('webhook_events_received', sa.Integer, default=0),
        sa.Column('performance_score', sa.Float, nullable=True),
        sa.Column('health_status', sa.String(50), default="healthy"),
        sa.Column('alerts_triggered', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('idx_crm_sync_sessions_status', 'crm_sync_sessions', ['status'])
    op.create_index('idx_crm_sync_sessions_started_at', 'crm_sync_sessions', ['started_at'])
    op.create_index('idx_sync_status_logs_session_id', 'sync_status_logs', ['session_id'])
    op.create_index('idx_record_sync_status_session_id', 'record_sync_status', ['session_id'])
    op.create_index('idx_record_sync_status_record_id', 'record_sync_status', ['record_id'])
    op.create_index('idx_sync_configurations_active', 'sync_configurations', ['is_active'])
    op.create_index('idx_sync_health_metrics_date', 'sync_health_metrics', ['metric_date'])


def downgrade():
    """Drop CRM sync session tables"""
    # Drop indexes
    op.drop_index('idx_sync_health_metrics_date', table_name='sync_health_metrics')
    op.drop_index('idx_sync_configurations_active', table_name='sync_configurations')
    op.drop_index('idx_record_sync_status_record_id', table_name='record_sync_status')
    op.drop_index('idx_record_sync_status_session_id', table_name='record_sync_status')
    op.drop_index('idx_sync_status_logs_session_id', table_name='sync_status_logs')
    op.drop_index('idx_crm_sync_sessions_started_at', table_name='crm_sync_sessions')
    op.drop_index('idx_crm_sync_sessions_status', table_name='crm_sync_sessions')
    
    # Drop tables
    op.drop_table('sync_health_metrics')
    op.drop_table('sync_configurations')
    op.drop_table('record_sync_status')
    op.drop_table('sync_status_logs')
    op.drop_table('crm_sync_sessions')