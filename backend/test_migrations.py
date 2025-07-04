#!/usr/bin/env python3
"""
Test script to verify all Alembic migrations work correctly
Run this after fixing the direct DDL issues
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text, inspect
from alembic.config import Config
from alembic import command

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_migrations():
    """Test that all migrations work correctly"""
    
    # Use a test database
    test_db_url = "sqlite:///test_migrations.db"
    
    try:
        # Remove test database if it exists
        if os.path.exists("test_migrations.db"):
            os.remove("test_migrations.db")
            
        logger.info("🧪 Testing Alembic migrations...")
        
        # Create engine
        engine = create_engine(test_db_url)
        
        # Configure Alembic
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", test_db_url)
        
        # Run all migrations
        logger.info("📈 Running migrations to head...")
        command.upgrade(alembic_cfg, "head")
        
        # Check current revision
        current_rev = command.current(alembic_cfg, verbose=False)
        logger.info(f"✅ Current migration: {current_rev}")
        
        # Verify all expected tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        expected_tables = [
            'currency_rates',
            'crm_records',
            'crm_record_history',
            'data_quality_alerts',
            'data_quality_config',
            'bulk_export_jobs',
            'bulk_export_records',
            'system_settings',
            'user_states',
            'state_change_logs',
            'zoho_oauth_tokens',
            'zoho_token_records',
            'token_refresh_logs',
            'token_alerts',
            'users',
            'user_sessions',
            'crm_sync_sessions',
            'sync_status_logs',
            'record_sync_status',
            'sync_configurations',
            'sync_health_metrics',
            'alembic_version'
        ]
        
        logger.info(f"📋 Found {len(tables)} tables:")
        for table in sorted(tables):
            logger.info(f"  ✓ {table}")
        
        # Check for missing tables
        missing_tables = set(expected_tables) - set(tables)
        if missing_tables:
            logger.error(f"❌ Missing tables: {missing_tables}")
            return False
        
        # Check if we can rollback
        logger.info("⏮️  Testing rollback...")
        command.downgrade(alembic_cfg, "-1")
        
        logger.info("⏭️  Testing upgrade again...")
        command.upgrade(alembic_cfg, "head")
        
        logger.info("✅ All migrations tested successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Clean up test database
        if os.path.exists("test_migrations.db"):
            os.remove("test_migrations.db")
            logger.info("🧹 Test database cleaned up")

if __name__ == "__main__":
    success = test_migrations()
    sys.exit(0 if success else 1)