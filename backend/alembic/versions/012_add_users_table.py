"""Add users table

Revision ID: 012_add_users_table
Revises: 011_add_token_management_tables
Create Date: 2025-07-04 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '012_add_users_table'
down_revision = '011_add_token_management_tables'
branch_labels = None
depends_on = None


def upgrade():
    """Create users table"""
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('zoho_user_id', sa.String(255), nullable=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('auth_provider', sa.String(50), default="zoho"),
        sa.Column('first_name', sa.String(255), nullable=True),
        sa.Column('last_name', sa.String(255), nullable=True),
        sa.Column('display_name', sa.String(255), nullable=True),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('profile_picture_url', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('job_title', sa.String(255), nullable=True),
        sa.Column('department', sa.String(255), nullable=True),
        sa.Column('timezone', sa.String(100), default="UTC"),
        sa.Column('locale', sa.String(10), default="en"),
        sa.Column('zoho_role', sa.JSON, nullable=True),
        sa.Column('zoho_permissions', sa.JSON, nullable=True),
        sa.Column('role_cache_expires', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_admin', sa.Boolean, default=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_activity', sa.DateTime(timezone=True), nullable=True),
        sa.Column('login_count', sa.Integer, default=0),
        sa.Column('preferences', sa.JSON, nullable=True),
        sa.Column('api_quota_used', sa.Integer, default=0),
        sa.Column('api_quota_reset', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('session_token', sa.String(255), nullable=False),
        sa.Column('refresh_token', sa.String(255), nullable=True),
        sa.Column('zoho_access_token', sa.Text, nullable=True),
        sa.Column('zoho_refresh_token', sa.Text, nullable=True),
        sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('device_type', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('idx_users_zoho_user_id', 'users', ['zoho_user_id'], unique=True)
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_users_id', 'users', ['id'])
    op.create_index('idx_user_sessions_user_id', 'user_sessions', ['user_id'])
    op.create_index('idx_user_sessions_session_token', 'user_sessions', ['session_token'], unique=True)
    op.create_index('idx_user_sessions_active', 'user_sessions', ['is_active'])


def downgrade():
    """Drop users tables"""
    # Drop indexes
    op.drop_index('idx_user_sessions_active', table_name='user_sessions')
    op.drop_index('idx_user_sessions_session_token', table_name='user_sessions')
    op.drop_index('idx_user_sessions_user_id', table_name='user_sessions')
    op.drop_index('idx_users_id', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_users_zoho_user_id', table_name='users')
    
    # Drop tables
    op.drop_table('user_sessions')
    op.drop_table('users')