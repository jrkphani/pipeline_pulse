"""Add currency rates table

Revision ID: 002
Revises: 001
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    """Create currency_rates table for caching exchange rates"""
    op.create_table(
        'currency_rates',
        sa.Column('currency_code', sa.String(3), primary_key=True, index=True),
        sa.Column('sgd_rate', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    
    # Create index for efficient queries by update time
    op.create_index('idx_currency_updated', 'currency_rates', ['updated_at'])

def downgrade():
    """Drop currency_rates table"""
    op.drop_index('idx_currency_updated', 'currency_rates')
    op.drop_table('currency_rates')
