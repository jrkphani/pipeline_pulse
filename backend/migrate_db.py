#!/usr/bin/env python3
"""
Database migration script to add new columns to the analyses table
"""

import sqlite3
import os
from app.core.config import settings

def migrate_database():
    """Add new columns to the analyses table"""
    
    db_path = settings.DATABASE_URL.replace('sqlite:///', '')
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} does not exist. Creating new database...")
        # If database doesn't exist, create it with the new schema
        from app.core.database import create_tables
        create_tables()
        print("New database created with updated schema.")
        return
    
    print(f"Migrating database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if new columns already exist
        cursor.execute("PRAGMA table_info(analyses)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = [
            ('original_filename', 'TEXT NOT NULL DEFAULT ""'),
            ('file_path', 'TEXT NOT NULL DEFAULT ""'),
            ('file_size', 'INTEGER DEFAULT 0'),
            ('file_hash', 'TEXT NOT NULL DEFAULT ""'),
            ('is_latest', 'BOOLEAN DEFAULT 1')
        ]
        
        for column_name, column_def in new_columns:
            if column_name not in columns:
                print(f"Adding column: {column_name}")
                cursor.execute(f"ALTER TABLE analyses ADD COLUMN {column_name} {column_def}")
            else:
                print(f"Column {column_name} already exists, skipping...")
        
        # Update existing records to have proper values
        print("Updating existing records...")
        
        # Set original_filename to filename for existing records
        cursor.execute("""
            UPDATE analyses 
            SET original_filename = filename 
            WHERE original_filename = '' OR original_filename IS NULL
        """)
        
        # Set file_path for existing records (they won't have actual files, but we need a path)
        cursor.execute("""
            UPDATE analyses 
            SET file_path = 'uploads/' || filename 
            WHERE file_path = '' OR file_path IS NULL
        """)
        
        # Set a dummy hash for existing records
        cursor.execute("""
            UPDATE analyses 
            SET file_hash = 'legacy_' || id 
            WHERE file_hash = '' OR file_hash IS NULL
        """)
        
        # Mark the most recent record as latest
        cursor.execute("""
            UPDATE analyses SET is_latest = 0
        """)
        
        cursor.execute("""
            UPDATE analyses 
            SET is_latest = 1 
            WHERE id = (
                SELECT id FROM analyses 
                ORDER BY created_at DESC 
                LIMIT 1
            )
        """)
        
        conn.commit()
        print("Database migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
