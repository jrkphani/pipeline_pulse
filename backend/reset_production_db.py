#!/usr/bin/env python3
"""
Production database reset script
DANGER: This will completely wipe the production database!
Only use when confirmed there's no important data.
"""

import os
import sys
import boto3
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def get_production_db_url():
    """Get production database URL using password authentication"""

    # Create AWS clients
    secrets_client = boto3.client('secretsmanager', region_name='ap-southeast-1')

    try:
        # Get database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(
            SecretId='pipeline-pulse/app-secrets'
        )
        app_secrets = json.loads(secret_response['SecretString'])

        # Production database configuration (same as in iam_database.py)
        db_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
        db_name = os.getenv('DB_NAME', 'pipeline_pulse')
        db_user = os.getenv('DB_USER', 'postgres')
        port = int(os.getenv('DB_PORT', '5432'))

        # Get password from secrets
        password = app_secrets.get('database_password', '')

        # Construct database URL
        db_url = f"postgresql://{db_user}:{password}@{db_endpoint}:{port}/{db_name}?sslmode=require"
        return db_url

    except Exception as e:
        print(f"❌ Error getting database credentials: {e}")
        return None

def reset_production_database():
    """Completely reset the production database"""
    
    print("🚨 WARNING: This will completely wipe the production database!")
    print("🚨 All data will be lost permanently!")
    
    # Get database URL
    db_url = get_production_db_url()
    if not db_url:
        print("❌ Could not get database URL")
        return False
    
    print("📍 Connecting to production database...")
    
    engine = None
    try:
        # Create engine
        engine = create_engine(db_url)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
        
        # Get list of all tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """))
            tables = [row[0] for row in result.fetchall()]
            
        print(f"📋 Found {len(tables)} tables to drop:")
        for table in tables:
            print(f"  - {table}")
        
        # Drop all tables
        print("🗑️  Dropping all tables...")
        with engine.connect() as conn:
            # Disable foreign key checks temporarily
            conn.execute(text("SET session_replication_role = replica;"))
            
            # Drop all tables
            for table in tables:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                    print(f"  ✅ Dropped table: {table}")
                except Exception as e:
                    print(f"  ⚠️  Could not drop table {table}: {e}")
            
            # Re-enable foreign key checks
            conn.execute(text("SET session_replication_role = DEFAULT;"))
            conn.commit()
        
        print("✅ All tables dropped successfully")
        
        # Verify database is empty
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """))
            remaining_tables = result.scalar()
            
        if remaining_tables == 0:
            print("✅ Database is now completely empty")
            print("🎉 Production database reset completed successfully!")
            return True
        else:
            print(f"⚠️  Warning: {remaining_tables} tables still remain")
            return False
            
    except Exception as e:
        print(f"❌ Error during database reset: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if engine:
            engine.dispose()

if __name__ == "__main__":
    print("🔄 Starting production database reset...")
    success = reset_production_database()
    
    if success:
        print("\n✅ Database reset completed!")
        print("🚀 You can now restart the application to create fresh schema")
    else:
        print("\n❌ Database reset failed!")
        sys.exit(1)
