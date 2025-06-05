#!/usr/bin/env python3
"""
Fix database migration conflict by marking migration 007 as applied
without actually running the migration commands.
"""

import os
import sys
import psycopg2

def fix_migration_conflict():
    """Fix the migration conflict by marking migration 007 as applied"""

    # Database connection parameters from environment
    db_host = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
    db_name = os.getenv('DB_NAME', 'pipeline_pulse')
    db_user = os.getenv('DB_USER', 'postgres')

    # Get password from AWS Secrets Manager or environment
    try:
        import boto3
        secrets_client = boto3.client('secretsmanager', region_name='ap-southeast-1')
        secret_response = secrets_client.get_secret_value(
            SecretId='pipeline-pulse/app-secrets'
        )
        import json
        secrets = json.loads(secret_response['SecretString'])
        db_password = secrets['db_password']
    except Exception as e:
        print(f"Could not get password from Secrets Manager: {e}")
        db_password = os.getenv('DB_PASSWORD', '')

    if not db_password:
        print("Error: No database password available")
        return False

    try:
        # Connect to database using psycopg2
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=5432
        )
        cursor = conn.cursor()

        print("Connected to database successfully")

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
    result = fix_migration_conflict()
    sys.exit(0 if result else 1)
