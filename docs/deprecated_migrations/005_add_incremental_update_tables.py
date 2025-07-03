"""Add incremental update tables for CRM record tracking

Revision ID: 005
Revises: 004
Create Date: 2025-06-03 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to analyses table for import tracking
    op.add_column('analyses', sa.Column('export_date', sa.Date(), nullable=True))
    op.add_column('analyses', sa.Column('import_type', sa.String(20), nullable=True, default='new_dataset'))
    op.add_column('analyses', sa.Column('records_added', sa.Integer(), nullable=True, default=0))
    op.add_column('analyses', sa.Column('records_updated', sa.Integer(), nullable=True, default=0))
    op.add_column('analyses', sa.Column('records_removed', sa.Integer(), nullable=True, default=0))
    op.add_column('analyses', sa.Column('parent_analysis_id', sa.String(36), nullable=True))
    
    # Create CRM records table for record-level tracking
    op.create_table('crm_records',
        sa.Column('record_id', sa.String(50), nullable=False),
        sa.Column('analysis_id', sa.String(36), nullable=False),
        sa.Column('current_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('first_seen_date', sa.Date(), nullable=True),
        sa.Column('last_seen_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('record_id'),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id'], ondelete='CASCADE'),
        sa.Index('idx_crm_records_analysis_id', 'analysis_id'),
        sa.Index('idx_crm_records_active', 'is_active'),
        sa.Index('idx_crm_records_last_seen', 'last_seen_date')
    )
    
    # Create business-critical field history table
    op.create_table('crm_record_history',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('record_id', sa.String(50), nullable=False),
        sa.Column('analysis_id', sa.String(36), nullable=False),
        sa.Column('field_name', sa.String(50), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('change_date', sa.Date(), nullable=False),
        sa.Column('import_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['record_id'], ['crm_records.record_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id'], ondelete='CASCADE'),
        sa.Index('idx_crm_history_record_id', 'record_id'),
        sa.Index('idx_crm_history_field_name', 'field_name'),
        sa.Index('idx_crm_history_change_date', 'change_date')
    )
    
    # Create data quality alerts table
    op.create_table('data_quality_alerts',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('record_id', sa.String(50), nullable=False),
        sa.Column('analysis_id', sa.String(36), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(20), nullable=False, default='medium'),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, default=False),
        sa.Column('resolved_by', sa.String(100), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['record_id'], ['crm_records.record_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id'], ondelete='CASCADE'),
        sa.Index('idx_alerts_record_id', 'record_id'),
        sa.Index('idx_alerts_type', 'alert_type'),
        sa.Index('idx_alerts_severity', 'severity'),
        sa.Index('idx_alerts_resolved', 'is_resolved')
    )


def downgrade():
    # Drop tables in reverse order
    op.drop_table('data_quality_alerts')
    op.drop_table('crm_record_history')
    op.drop_table('crm_records')
    
    # Remove columns from analyses table
    op.drop_column('analyses', 'parent_analysis_id')
    op.drop_column('analyses', 'records_removed')
    op.drop_column('analyses', 'records_updated')
    op.drop_column('analyses', 'records_added')
    op.drop_column('analyses', 'import_type')
    op.drop_column('analyses', 'export_date')
