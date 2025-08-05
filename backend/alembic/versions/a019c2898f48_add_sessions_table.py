"""Add sessions table

Revision ID: a019c2898f48
Revises: 0f4313ef644c
Create Date: 2025-07-04 19:12:40.620423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a019c2898f48'
down_revision: Union[str, None] = '0f4313ef644c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('data', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_sessions_id', 'id'),
        sa.Index('ix_sessions_user_id', 'user_id'),
    )


def downgrade() -> None:
    # Drop sessions table
    op.drop_table('sessions')
