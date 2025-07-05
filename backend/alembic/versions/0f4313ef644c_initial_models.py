"""Initial models

Revision ID: 0f4313ef644c
Revises: 
Create Date: 2025-07-04 15:56:50.323309

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0f4313ef644c'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Simplified approach: Use VARCHAR for now instead of enums to avoid creation conflicts
    # We can add proper enums later once the core authentication is working
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, default='user'),
        sa.Column('is_active', sa.Boolean, default=True, nullable=False),
        sa.Column('is_superuser', sa.Boolean, default=False, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime, nullable=True),
        sa.Column('zoho_user_id', sa.String(50), unique=True, nullable=True),
    )
    
    # Create indexes for users table
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_zoho_user_id', 'users', ['zoho_user_id'])
    
    # Create territories table
    op.create_table(
        'territories',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('region', sa.String(100), nullable=False),
        sa.Column('manager_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('zoho_territory_id', sa.String(50), unique=True, nullable=True),
    )
    
    # Create indexes for territories table
    op.create_index('ix_territories_id', 'territories', ['id'])
    op.create_index('ix_territories_name', 'territories', ['name'])
    op.create_index('ix_territories_region', 'territories', ['region'])
    op.create_index('ix_territories_zoho_territory_id', 'territories', ['zoho_territory_id'])
    
    # Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('account_type', sa.String(50), nullable=False, default='prospect'),
        sa.Column('territory_id', sa.Integer, sa.ForeignKey('territories.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('zoho_account_id', sa.String(50), unique=True, nullable=True),
    )
    
    # Create indexes for accounts table
    op.create_index('ix_accounts_id', 'accounts', ['id'])
    op.create_index('ix_accounts_name', 'accounts', ['name'])
    op.create_index('ix_accounts_industry', 'accounts', ['industry'])
    op.create_index('ix_accounts_zoho_account_id', 'accounts', ['zoho_account_id'])
    
    # Create opportunities table
    op.create_table(
        'opportunities',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('amount_local', sa.Numeric(15, 2), nullable=False),
        sa.Column('amount_sgd', sa.Numeric(15, 2), nullable=False),
        sa.Column('local_currency', sa.String(3), nullable=False),
        sa.Column('probability', sa.Integer, nullable=False),
        sa.Column('o2r_phase', sa.String(20), nullable=False, default='OPPORTUNITY'),
        sa.Column('health_status', sa.String(20), nullable=False, default='NEUTRAL'),
        sa.Column('territory_id', sa.Integer, sa.ForeignKey('territories.id'), nullable=False),
        sa.Column('account_id', sa.Integer, sa.ForeignKey('accounts.id'), nullable=False),
        sa.Column('proposal_date', sa.DateTime, nullable=True),
        sa.Column('kickoff_date', sa.DateTime, nullable=True),
        sa.Column('completion_date', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('updated_by', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('zoho_deal_id', sa.String(50), unique=True, nullable=True),
        sa.Column('last_synced_at', sa.DateTime, nullable=True),
    )
    
    # Create indexes for opportunities table
    op.create_index('ix_opportunities_id', 'opportunities', ['id'])
    op.create_index('ix_opportunities_name', 'opportunities', ['name'])
    op.create_index('ix_opportunities_zoho_deal_id', 'opportunities', ['zoho_deal_id'])
    
    # Create check constraints for opportunities
    op.create_check_constraint('chk_opportunity_amount_local_positive', 'opportunities', 'amount_local > 0')
    op.create_check_constraint('chk_opportunity_amount_sgd_positive', 'opportunities', 'amount_sgd > 0')
    op.create_check_constraint('chk_opportunity_probability_range', 'opportunities', 'probability >= 0 AND probability <= 100')
    op.create_check_constraint('chk_opportunity_currency_format', 'opportunities', 'local_currency ~ \'^[A-Z]{3}$\'')
    op.create_check_constraint('chk_opportunity_name_not_empty', 'opportunities', 'name ~ \'^.+$\'')
    op.create_check_constraint('chk_opportunity_timestamps', 'opportunities', 'updated_at >= created_at')
    
    # Create sync_sessions table
    op.create_table(
        'sync_sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('status', sa.String(20), nullable=False, default='PENDING'),
        sa.Column('sync_type', sa.String(20), nullable=False),
        sa.Column('started_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('records_processed', sa.Integer, default=0),
        sa.Column('records_successful', sa.Integer, default=0),
        sa.Column('records_failed', sa.Integer, default=0),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('error_details', sa.Text, nullable=True),
        sa.Column('triggered_by_user_id', sa.Integer, nullable=True),
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('sync_sessions')
    op.drop_table('opportunities')
    op.drop_table('accounts')
    op.drop_table('territories')
    op.drop_table('users')
    
    # Enum types not used in this simplified version
