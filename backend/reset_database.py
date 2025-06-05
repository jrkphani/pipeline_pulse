#!/usr/bin/env python3
"""
Database reset script for Pipeline Pulse
Drops all tables and recreates them from current models
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, get_database_url
from app.models import *  # Import all models

def reset_database():
    """Drop all tables and recreate from current models"""
    
    print("🔄 Starting database reset...")
    
    # Get database URL
    database_url = get_database_url()
    print(f"📍 Connecting to database...")
    
    # Create engine
    engine = create_engine(database_url)
    
    try:
        # Drop all tables
        print("🗑️  Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped successfully")
        
        # Create all tables from current models
        print("🏗️  Creating tables from current models...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully")
        
        # Initialize Alembic version table to latest migration
        print("🔧 Initializing Alembic version table...")
        with engine.connect() as conn:
            # Create alembic_version table if it doesn't exist
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                )
            """))
            
            # Set current version to 008 (latest migration)
            conn.execute(text("DELETE FROM alembic_version"))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('008')"))
            conn.commit()
            
        print("✅ Alembic version table initialized to migration 008")
        print("🎉 Database reset completed successfully!")
        
        # Print table summary
        print("\n📊 Created tables:")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")
            
    except Exception as e:
        print(f"❌ Error during database reset: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    reset_database()
