"""Add bulk export and system settings tables

Revision ID: 004
Revises: 003
Create Date: 2024-12-19 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None

def upgrade():
    """Create bulk export and system settings tables"""
    
    # Create system_settings table
    op.create_table(
        'system_settings',
        sa.Column('key', sa.String(255), primary_key=True, index=True),
        sa.Column('value', sa.Text()),
        sa.Column('description', sa.Text()),
        sa.Column('is_encrypted', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now()),
    )
    
    # Create bulk_export_jobs table
    op.create_table(
        'bulk_export_jobs',
        sa.Column('id', sa.String(), primary_key=True, index=True),
        sa.Column('zoho_job_id', sa.String(), index=True),
        sa.Column('module_name', sa.String(), nullable=False, default='Deals'),
        sa.Column('criteria_json', sa.Text()),
        sa.Column('fields_json', sa.Text()),
        sa.Column('status', sa.String(), nullable=False, default='pending'),
        sa.Column('progress_percentage', sa.Integer(), default=0),
        sa.Column('estimated_records', sa.Integer(), default=0),
        sa.Column('total_records', sa.Integer(), default=0),
        sa.Column('new_records', sa.Integer(), default=0),
        sa.Column('updated_records', sa.Integer(), default=0),
        sa.Column('deleted_records', sa.Integer(), default=0),
        sa.Column('download_url', sa.String()),
        sa.Column('file_path', sa.String()),
        sa.Column('file_size', sa.Integer(), default=0),
        sa.Column('error_message', sa.Text()),
        sa.Column('retry_count', sa.Integer(), default=0),
        sa.Column('max_retries', sa.Integer(), default=3),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('last_polled_at', sa.DateTime(timezone=True)),
        sa.Column('callback_received', sa.Boolean(), default=False),
        sa.Column('callback_received_at', sa.DateTime(timezone=True)),
    )
    
    # Create bulk_export_records table
    op.create_table(
        'bulk_export_records',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('job_id', sa.String(), nullable=False, index=True),
        sa.Column('zoho_record_id', sa.String(), nullable=False, index=True),
        sa.Column('record_type', sa.String(), nullable=False, default='Deal'),
        sa.Column('action_taken', sa.String(), nullable=False),
        sa.Column('record_data_json', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('processed_at', sa.DateTime(timezone=True)),
    )
    
    # Create indexes for better performance
    op.create_index('idx_bulk_export_jobs_status', 'bulk_export_jobs', ['status'])
    op.create_index('idx_bulk_export_jobs_created_at', 'bulk_export_jobs', ['created_at'])
    op.create_index('idx_bulk_export_jobs_zoho_job_id', 'bulk_export_jobs', ['zoho_job_id'])
    
    op.create_index('idx_bulk_export_records_job_id', 'bulk_export_records', ['job_id'])
    op.create_index('idx_bulk_export_records_zoho_id', 'bulk_export_records', ['zoho_record_id'])
    op.create_index('idx_bulk_export_records_action', 'bulk_export_records', ['action_taken'])
    
    op.create_index('idx_system_settings_key', 'system_settings', ['key'])


def downgrade():
    """Drop bulk export and system settings tables"""
    
    # Drop indexes first
    op.drop_index('idx_system_settings_key', 'system_settings')
    
    op.drop_index('idx_bulk_export_records_action', 'bulk_export_records')
    op.drop_index('idx_bulk_export_records_zoho_id', 'bulk_export_records')
    op.drop_index('idx_bulk_export_records_job_id', 'bulk_export_records')
    
    op.drop_index('idx_bulk_export_jobs_zoho_job_id', 'bulk_export_jobs')
    op.drop_index('idx_bulk_export_jobs_created_at', 'bulk_export_jobs')
    op.drop_index('idx_bulk_export_jobs_status', 'bulk_export_jobs')
    
    # Drop tables
    op.drop_table('bulk_export_records')
    op.drop_table('bulk_export_jobs')
    op.drop_table('system_settings')
