#!/usr/bin/env python3
"""
Fix database migration conflict using IAM database authentication
"""

import boto3
import psycopg2
import ssl

def fix_migration_with_iam():
    """Fix the migration conflict using IAM authentication"""
    
    # Database connection parameters
    db_host = 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com'
    db_name = 'pipeline_pulse'
    db_user = 'postgres'
    port = 5432
    region = 'ap-southeast-1'
    
    try:
        # Generate IAM database token
        rds_client = boto3.client('rds', region_name=region)
        token = rds_client.generate_db_auth_token(
            DBHostname=db_host,
            Port=port,
            DBUsername=db_user,
            Region=region
        )
        
        print("Generated IAM database token")
        
        # Connect to database using IAM token
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=token,
            port=port,
            sslmode='require'
        )
        cursor = conn.cursor()
        
        print("Connected to database successfully using IAM authentication")
        
        # Check current Alembic version
        cursor.execute("SELECT version_num FROM alembic_version")
        current_version = cursor.fetchone()
        
        if current_version:
            print(f"Current Alembic version: {current_version[0]}")
        else:
            print("No Alembic version found")
            return False
        
        # Check if migration 007 is already applied
        if current_version[0] == '007':
            print("Migration 007 is already applied")
            return True
        
        # Check if the export_date column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'analyses' AND column_name = 'export_date'
        """)
        export_date_exists = cursor.fetchone() is not None
        
        print(f"export_date column exists: {export_date_exists}")
        
        # Check what columns exist in analyses table
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'analyses'
            ORDER BY ordinal_position
        """)
        columns = [row[0] for row in cursor.fetchall()]
        print(f"Existing columns in analyses table: {columns}")
        
        if export_date_exists:
            # Column exists, so mark migration as applied without running it
            print("Marking migration 007 as applied...")
            cursor.execute("UPDATE alembic_version SET version_num = '007'")
            conn.commit()
            print("✅ Migration 007 marked as applied successfully")
            return True
        else:
            print("export_date column doesn't exist, migration needs to run normally")
            return False
            
    except Exception as e:
        print(f"Error fixing migration conflict: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    result = fix_migration_with_iam()
    print(f"Migration fix result: {result}")
