"""add session tokens table

Revision ID: 010
Revises: 009
Create Date: 2024-01-17 08:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None

def upgrade():
    """
    Add session_tokens table for JWT session management
    Following Zoho SDK database token store pattern
    """
    op.create_table(
        'session_tokens',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_email', sa.String(255), nullable=False, index=True),
        sa.Column('user_id', sa.String(100), nullable=True),
        sa.Column('jwt_token', sa.Text, nullable=False),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('roles', sa.Text, nullable=True),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
    )
    
    # Create unique index on user_email for session management
    op.create_index('idx_session_tokens_user_email', 'session_tokens', ['user_email'], unique=True)
    
    # Create index on expires_at for cleanup operations
    op.create_index('idx_session_tokens_expires_at', 'session_tokens', ['expires_at'])
    
    # Add updated_at trigger for PostgreSQL
    if op.get_bind().dialect.name == 'postgresql':
        op.execute('''
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        ''')
        
        op.execute('''
            CREATE TRIGGER update_session_tokens_updated_at 
            BEFORE UPDATE ON session_tokens 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ''')

def downgrade():
    """
    Remove session_tokens table
    """
    # Drop triggers if PostgreSQL
    if op.get_bind().dialect.name == 'postgresql':
        op.execute('DROP TRIGGER IF EXISTS update_session_tokens_updated_at ON session_tokens;')
        op.execute('DROP FUNCTION IF EXISTS update_updated_at_column();')
    
    # Drop indexes
    op.drop_index('idx_session_tokens_expires_at', table_name='session_tokens')
    op.drop_index('idx_session_tokens_user_email', table_name='session_tokens')
    
    # Drop table
    op.drop_table('session_tokens')
