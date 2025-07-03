"""Add incremental tracking to analyses (robust version)

Revision ID: 008
Revises: 006
Create Date: 2025-06-05 11:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    """Smart migration - check if columns exist and handle accordingly"""

    # Get database connection
    conn = op.get_bind()

    print("🔄 Migration 008: Checking if incremental tracking columns exist...")

    # Check if export_date column exists
    result = conn.execute(text("""
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_name = 'analyses'
        AND column_name = 'export_date'
    """))

    columns_exist = result.scalar() > 0

    if columns_exist:
        print("✅ Columns already exist - marking migration as applied")
        # Update Alembic version table to mark this migration as applied
        conn.execute(text("UPDATE alembic_version SET version_num = '008'"))
        print("✅ Migration 008 completed successfully (columns already existed)")
    else:
        print("➕ Columns don't exist - adding them now")
        # Add the columns
        columns_to_add = [
            ('export_date', 'DATE'),
            ('import_type', 'VARCHAR(20) DEFAULT \'new_dataset\''),
            ('records_added', 'INTEGER DEFAULT 0'),
            ('records_updated', 'INTEGER DEFAULT 0'),
            ('records_removed', 'INTEGER DEFAULT 0'),
            ('parent_analysis_id', 'VARCHAR(36)')
        ]

        for column_name, column_def in columns_to_add:
            try:
                sql = f"ALTER TABLE analyses ADD COLUMN {column_name} {column_def}"
                conn.execute(text(sql))
                print(f"✅ Added column: {column_name}")
            except Exception as e:
                print(f"❌ Error adding column {column_name}: {e}")

        # Add foreign key constraint
        try:
            conn.execute(text("""
                ALTER TABLE analyses
                ADD CONSTRAINT fk_analyses_parent_analysis_id
                FOREIGN KEY (parent_analysis_id) REFERENCES analyses(id)
            """))
            print("✅ Added foreign key constraint")
        except Exception as e:
            print(f"⚠️  Could not add foreign key constraint: {e}")

        print("✅ Migration 008 completed successfully (columns added)")


def downgrade():
    """Remove incremental tracking columns"""
    
    # Get database connection
    conn = op.get_bind()
    
    # Remove foreign key constraint first
    try:
        conn.execute(text("ALTER TABLE analyses DROP CONSTRAINT IF EXISTS fk_analyses_parent_analysis_id"))
    except Exception as e:
        print(f"Could not remove foreign key constraint: {e}")
    
    # Remove columns
    columns_to_remove = [
        'parent_analysis_id',
        'records_removed', 
        'records_updated',
        'records_added',
        'import_type',
        'export_date'
    ]
    
    for column_name in columns_to_remove:
        try:
            conn.execute(text(f"ALTER TABLE analyses DROP COLUMN IF EXISTS {column_name}"))
        except Exception as e:
            print(f"Could not remove column {column_name}: {e}")
