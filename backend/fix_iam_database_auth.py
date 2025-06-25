#!/usr/bin/env python3
"""
Fix IAM Database Authentication for Pipeline Pulse
This script connects to the PostgreSQL database and grants the rds_iam role to the postgres user.
"""

import os
import sys
import psycopg2
import logging
from getpass import getpass

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def connect_with_password():
    """Connect to PostgreSQL using master password"""
    
    # Database connection parameters
    db_endpoint = input("Enter DB endpoint (default: pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com): ").strip()
    if not db_endpoint:
        db_endpoint = "pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com"
    
    db_name = input("Enter DB name (default: pipeline_pulse): ").strip()
    if not db_name:
        db_name = "pipeline_pulse"
    
    db_user = input("Enter master username (default: postgres): ").strip()
    if not db_user:
        db_user = "postgres"
    
    port = input("Enter port (default: 5432): ").strip()
    if not port:
        port = "5432"
    
    # Get password securely
    password = getpass("Enter master password: ")
    
    try:
        logger.info(f"Connecting to {db_endpoint}:{port}/{db_name} as {db_user}")
        
        connection_string = f"host={db_endpoint} port={port} dbname={db_name} user={db_user} password={password} sslmode=require connect_timeout=30"
        conn = psycopg2.connect(connection_string)
        
        logger.info("✅ Successfully connected to PostgreSQL")
        return conn
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to PostgreSQL: {e}")
        return None

def grant_iam_role(conn):
    """Grant rds_iam role to postgres user"""
    
    try:
        cursor = conn.cursor()
        
        # Check if rds_iam role exists
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = 'rds_iam'")
        if not cursor.fetchone():
            logger.error("❌ rds_iam role does not exist. This might not be an RDS instance.")
            return False
        
        # Check current roles for postgres user
        cursor.execute("""
            SELECT r.rolname 
            FROM pg_auth_members m 
            JOIN pg_roles r ON m.roleid = r.oid 
            JOIN pg_roles u ON m.member = u.oid 
            WHERE u.rolname = 'postgres'
        """)
        
        current_roles = [row[0] for row in cursor.fetchall()]
        logger.info(f"Current roles for postgres user: {current_roles}")
        
        if 'rds_iam' in current_roles:
            logger.info("✅ postgres user already has rds_iam role")
            return True
        
        # Grant rds_iam role to postgres user
        logger.info("Granting rds_iam role to postgres user...")
        cursor.execute("GRANT rds_iam TO postgres")
        conn.commit()
        
        # Verify the grant
        cursor.execute("""
            SELECT r.rolname 
            FROM pg_auth_members m 
            JOIN pg_roles r ON m.roleid = r.oid 
            JOIN pg_roles u ON m.member = u.oid 
            WHERE u.rolname = 'postgres' AND r.rolname = 'rds_iam'
        """)
        
        if cursor.fetchone():
            logger.info("✅ Successfully granted rds_iam role to postgres user")
            return True
        else:
            logger.error("❌ Failed to verify rds_iam role grant")
            return False
            
    except Exception as e:
        logger.error(f"❌ Failed to grant rds_iam role: {e}")
        return False
    finally:
        cursor.close()

def test_iam_connection():
    """Test IAM authentication after granting the role"""
    
    try:
        # Import IAM auth module
        sys.path.append('.')
        from app.core.iam_database import iam_db_auth
        
        logger.info("Testing IAM authentication...")
        
        # Database connection parameters
        db_endpoint = "pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com"
        db_name = "pipeline_pulse"
        db_user = "postgres"
        port = 5432
        
        # Generate IAM token
        auth_token = iam_db_auth.generate_auth_token(db_endpoint, port, db_user)
        
        if not auth_token:
            logger.error("❌ Failed to generate IAM token")
            return False
        
        logger.info("✅ IAM token generated successfully")
        
        # Test connection with IAM token
        connection_string = f"host={db_endpoint} port={port} dbname={db_name} user={db_user} password={auth_token} sslmode=require connect_timeout=10"
        
        test_conn = psycopg2.connect(connection_string)
        test_cursor = test_conn.cursor()
        test_cursor.execute("SELECT 1")
        test_cursor.close()
        test_conn.close()
        
        logger.info("✅ IAM authentication test successful!")
        return True
        
    except Exception as e:
        logger.error(f"❌ IAM authentication test failed: {e}")
        return False

def main():
    """Main function to fix IAM database authentication"""
    
    print("🔧 Pipeline Pulse - IAM Database Authentication Fix")
    print("=" * 60)
    print()
    print("This script will:")
    print("1. Connect to your PostgreSQL database using master password")
    print("2. Grant the rds_iam role to the postgres user")
    print("3. Test IAM authentication")
    print()
    
    # Step 1: Connect with password
    conn = connect_with_password()
    if not conn:
        logger.error("Cannot proceed without database connection")
        sys.exit(1)
    
    try:
        # Step 2: Grant IAM role
        if grant_iam_role(conn):
            logger.info("✅ IAM role granted successfully")
        else:
            logger.error("❌ Failed to grant IAM role")
            sys.exit(1)
        
    finally:
        conn.close()
    
    # Step 3: Test IAM authentication
    print()
    print("Testing IAM authentication...")
    if test_iam_connection():
        print()
        print("🎉 SUCCESS! IAM database authentication is now working.")
        print()
        print("Your backend should now be able to start successfully.")
        print("Try restarting your application to verify the fix.")
    else:
        print()
        print("❌ IAM authentication test failed.")
        print("Please check the logs above for details.")

if __name__ == "__main__":
    main()
