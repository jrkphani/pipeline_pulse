"""Fix zoho_oauth_tokens nullable constraints

Revision ID: 0c6890db91e7
Revises: e7d8ec441ff3
Create Date: 2025-07-05 18:54:45.031075

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c6890db91e7'
down_revision: Union[str, None] = 'b81de42e3df8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make refresh_token nullable to allow for OAuth flow
    op.alter_column('zoho_oauth_tokens', 'refresh_token', nullable=True)


def downgrade() -> None:
    # Revert refresh_token to not nullable
    op.alter_column('zoho_oauth_tokens', 'refresh_token', nullable=False)
