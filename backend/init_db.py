#!/usr/bin/env python3
"""
Database Initialization Script

This script ensures that all database tables are properly created
and the database is ready for use.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine, Base
from app.core.config import settings
from app.models.analysis import Analysis
from app.models.currency_rate import CurrencyRate
from app.models.bulk_update import BulkUpdateBatch, BulkUpdateRecord

def init_database():
    """Initialize the database with all required tables"""

    print("🔧 Initializing Pipeline Pulse Database...")
    print(f"📍 Database URL: {settings.DATABASE_URL}")

    # Get the database file path
    db_path = settings.DATABASE_URL.replace('sqlite:///', '')
    db_abs_path = os.path.abspath(db_path)
    print(f"📁 Database file: {db_abs_path}")

    # Check if database file exists
    if os.path.exists(db_path):
        print(f"✅ Database file exists ({os.path.getsize(db_path)} bytes)")
    else:
        print("📝 Creating new database file...")

    try:
        # Import all models to ensure they're registered
        print("📋 Registering models...")
        print(f"   - Analysis: {Analysis.__tablename__}")
        print(f"   - CurrencyRate: {CurrencyRate.__tablename__}")
        print(f"   - BulkUpdateBatch: {BulkUpdateBatch.__tablename__}")
        print(f"   - BulkUpdateRecord: {BulkUpdateRecord.__tablename__}")

        # Create all tables
        print("🏗️  Creating database tables...")
        Base.metadata.create_all(bind=engine)

        # Verify tables were created
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]

        print("✅ Database tables created successfully:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = cursor.fetchone()[0]
            print(f"   - {table}: {count} records")

        conn.close()

        print("🎉 Database initialization complete!")
        return True

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
