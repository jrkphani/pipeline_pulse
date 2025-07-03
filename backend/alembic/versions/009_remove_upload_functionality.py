"""Remove upload functionality and create live CRM sync foundation

Revision ID: 009
Revises: 004
Create Date: 2025-07-02 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '004'
branch_labels = None
depends_on = None

def upgrade():
    """Remove upload-related tables and create live CRM sync foundation"""
    
    # Drop old upload-related tables if they exist
    try:
        op.drop_table('analyses')
    except Exception:
        pass  # Table may not exist
    
    # Create data_sync_jobs table for tracking CRM synchronization
    op.create_table(
        'data_sync_jobs',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('sync_type', sa.String(), nullable=False),  # 'full', 'delta', 'manual'
        sa.Column('source_system', sa.String(), nullable=False, default='zoho_crm'),
        sa.Column('target_system', sa.String(), nullable=False, default='pipeline_pulse'),
        sa.Column('status', sa.String(), nullable=False, default='pending'),  # 'pending', 'running', 'completed', 'failed'
        sa.Column('records_total', sa.Integer(), default=0),
        sa.Column('records_processed', sa.Integer(), default=0),
        sa.Column('records_created', sa.Integer(), default=0),
        sa.Column('records_updated', sa.Integer(), default=0),
        sa.Column('records_skipped', sa.Integer(), default=0),
        sa.Column('records_failed', sa.Integer(), default=0),
        sa.Column('last_sync_timestamp', sa.DateTime(timezone=True)),
        sa.Column('sync_duration_seconds', sa.Integer(), default=0),
        sa.Column('error_message', sa.Text()),
        sa.Column('sync_details_json', sa.Text()),  # JSON metadata about the sync
        sa.Column('webhook_data_json', sa.Text()),  # Webhook event data if applicable
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
    )
    
    # Create crm_sync_status table for tracking last sync times per module
    op.create_table(
        'crm_sync_status',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('module_name', sa.String(), nullable=False, unique=True),  # 'deals', 'accounts', etc.
        sa.Column('last_full_sync', sa.DateTime(timezone=True)),
        sa.Column('last_delta_sync', sa.DateTime(timezone=True)),
        sa.Column('last_modified_time', sa.DateTime(timezone=True)),  # From CRM API
        sa.Column('sync_enabled', sa.Boolean(), default=True),
        sa.Column('auto_sync_interval_minutes', sa.Integer(), default=15),
        sa.Column('webhook_configured', sa.Boolean(), default=False),
        sa.Column('total_records_synced', sa.Integer(), default=0),
        sa.Column('last_sync_job_id', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now()),
    )
    
    # Create webhook_events table for tracking real-time CRM events
    op.create_table(
        'webhook_events',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('webhook_source', sa.String(), nullable=False, default='zoho_crm'),
        sa.Column('event_type', sa.String(), nullable=False),  # 'create', 'update', 'delete'
        sa.Column('module_name', sa.String(), nullable=False),  # 'deals', 'accounts', etc.
        sa.Column('record_id', sa.String(), nullable=False, index=True),
        sa.Column('event_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed', sa.Boolean(), default=False),
        sa.Column('processed_at', sa.DateTime(timezone=True)),
        sa.Column('processing_error', sa.Text()),
        sa.Column('event_data_json', sa.Text()),  # Full webhook payload
        sa.Column('related_sync_job_id', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
    )
    
    # Create live_pipeline_cache table for real-time dashboard data
    op.create_table(
        'live_pipeline_cache',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('cache_key', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('cache_type', sa.String(), nullable=False),  # 'dashboard', 'filter', 'export'
        sa.Column('data_json', sa.Text()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('accessed_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('access_count', sa.Integer(), default=1),
    )
    
    # Create indexes for performance
    op.create_index('idx_data_sync_jobs_status', 'data_sync_jobs', ['status'])
    op.create_index('idx_data_sync_jobs_sync_type', 'data_sync_jobs', ['sync_type'])
    op.create_index('idx_data_sync_jobs_created_at', 'data_sync_jobs', ['created_at'])
    op.create_index('idx_data_sync_jobs_source_target', 'data_sync_jobs', ['source_system', 'target_system'])
    
    op.create_index('idx_crm_sync_status_module', 'crm_sync_status', ['module_name'])
    op.create_index('idx_crm_sync_status_enabled', 'crm_sync_status', ['sync_enabled'])
    op.create_index('idx_crm_sync_status_last_sync', 'crm_sync_status', ['last_full_sync'])
    
    op.create_index('idx_webhook_events_processed', 'webhook_events', ['processed'])
    op.create_index('idx_webhook_events_event_type', 'webhook_events', ['event_type'])
    op.create_index('idx_webhook_events_module', 'webhook_events', ['module_name'])
    op.create_index('idx_webhook_events_record_id', 'webhook_events', ['record_id'])
    op.create_index('idx_webhook_events_timestamp', 'webhook_events', ['event_timestamp'])
    
    op.create_index('idx_live_pipeline_cache_key', 'live_pipeline_cache', ['cache_key'])
    op.create_index('idx_live_pipeline_cache_type', 'live_pipeline_cache', ['cache_type'])
    op.create_index('idx_live_pipeline_cache_expires', 'live_pipeline_cache', ['expires_at'])
    
    # Insert initial CRM sync status records
    op.execute("""
        INSERT INTO crm_sync_status (module_name, sync_enabled, auto_sync_interval_minutes, webhook_configured)
        VALUES 
            ('deals', true, 15, false),
            ('accounts', true, 60, false),
            ('contacts', true, 120, false)
    """)


def downgrade():
    """Restore upload functionality (for rollback purposes)"""
    
    # Drop live CRM sync tables
    op.drop_index('idx_live_pipeline_cache_expires', 'live_pipeline_cache')
    op.drop_index('idx_live_pipeline_cache_type', 'live_pipeline_cache')
    op.drop_index('idx_live_pipeline_cache_key', 'live_pipeline_cache')
    
    op.drop_index('idx_webhook_events_timestamp', 'webhook_events')
    op.drop_index('idx_webhook_events_record_id', 'webhook_events')
    op.drop_index('idx_webhook_events_module', 'webhook_events')
    op.drop_index('idx_webhook_events_event_type', 'webhook_events')
    op.drop_index('idx_webhook_events_processed', 'webhook_events')
    
    op.drop_index('idx_crm_sync_status_last_sync', 'crm_sync_status')
    op.drop_index('idx_crm_sync_status_enabled', 'crm_sync_status')
    op.drop_index('idx_crm_sync_status_module', 'crm_sync_status')
    
    op.drop_index('idx_data_sync_jobs_source_target', 'data_sync_jobs')
    op.drop_index('idx_data_sync_jobs_created_at', 'data_sync_jobs')
    op.drop_index('idx_data_sync_jobs_sync_type', 'data_sync_jobs')
    op.drop_index('idx_data_sync_jobs_status', 'data_sync_jobs')
    
    op.drop_table('live_pipeline_cache')
    op.drop_table('webhook_events')
    op.drop_table('crm_sync_status')
    op.drop_table('data_sync_jobs')
    
    # Recreate analyses table for rollback compatibility
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