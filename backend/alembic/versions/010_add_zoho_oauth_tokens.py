"""Add Zoho OAuth tokens table for SDK database persistence

Revision ID: 010_add_zoho_oauth_tokens
Revises: 009_add_user_state_management
Create Date: 2025-07-03 13:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '010_add_zoho_oauth_tokens'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade():
    """Create zoho_oauth_tokens table for Zoho SDK database persistence"""
    op.create_table(
        'zoho_oauth_tokens',
        sa.Column('id', sa.String(255), primary_key=True, nullable=False),
        sa.Column('user_name', sa.String(255), nullable=True),
        sa.Column('client_id', sa.String(255), nullable=True),
        sa.Column('client_secret', sa.String(255), nullable=True),
        sa.Column('refresh_token', sa.Text, nullable=True),
        sa.Column('access_token', sa.Text, nullable=True),
        sa.Column('grant_token', sa.Text, nullable=True),
        sa.Column('expiry_time', sa.String(50), nullable=True),
        sa.Column('redirect_url', sa.String(500), nullable=True),
        sa.Column('api_domain', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    # Create indexes for performance
    op.create_index('idx_zoho_tokens_user', 'zoho_oauth_tokens', ['user_name'])
    op.create_index('idx_zoho_tokens_client', 'zoho_oauth_tokens', ['client_id'])


def downgrade():
    """Drop zoho_oauth_tokens table"""
    op.drop_index('idx_zoho_tokens_client', table_name='zoho_oauth_tokens')
    op.drop_index('idx_zoho_tokens_user', table_name='zoho_oauth_tokens')
    op.drop_table('zoho_oauth_tokens')