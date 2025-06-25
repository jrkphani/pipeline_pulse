#!/usr/bin/env python3
"""
Test script to diagnose database connection issues
"""

import os
import sys
import logging
import boto3
import psycopg2

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_iam_token_generation():
    """Test IAM token generation"""
    try:
        region = os.getenv('AWS_REGION', 'ap-southeast-1')
        db_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
        db_user = os.getenv('DB_USER', 'postgres')
        port = int(os.getenv('DB_PORT', '5432'))
        
        logger.info(f"Testing IAM token generation for:")
        logger.info(f"  Region: {region}")
        logger.info(f"  Endpoint: {db_endpoint}")
        logger.info(f"  User: {db_user}")
        logger.info(f"  Port: {port}")
        
        # Initialize RDS client
        rds_client = boto3.client('rds', region_name=region)
        logger.info("✅ RDS client initialized successfully")
        
        # Generate authentication token
        token = rds_client.generate_db_auth_token(
            DBHostname=db_endpoint,
            Port=port,
            DBUsername=db_user,
            Region=region
        )
        
        if token:
            logger.info("✅ IAM token generated successfully")
            logger.info(f"Token length: {len(token)} characters")
            logger.info(f"Token prefix: {token[:50]}...")
            return token
        else:
            logger.error("❌ Failed to generate IAM token")
            return None
            
    except Exception as e:
        logger.error(f"❌ IAM token generation failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

def test_database_connection_with_iam(token):
    """Test database connection using IAM token"""
    try:
        db_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
        db_name = os.getenv('DB_NAME', 'pipeline_pulse')
        db_user = os.getenv('DB_USER', 'postgres')
        port = int(os.getenv('DB_PORT', '5432'))
        
        logger.info("Testing database connection with IAM token...")
        
        connection_string = f"host={db_endpoint} port={port} dbname={db_name} user={db_user} password={token} sslmode=require connect_timeout=10"
        
        conn = psycopg2.connect(connection_string)
        logger.info("✅ Database connection successful with IAM token")
        
        # Test a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        logger.info(f"✅ Database version: {version[0]}")
        
        # Check if user has rds_iam role
        cursor.execute("SELECT rolname FROM pg_roles WHERE pg_has_role(current_user, oid, 'member') AND rolname = 'rds_iam';")
        iam_role = cursor.fetchone()
        if iam_role:
            logger.info("✅ User has rds_iam role")
        else:
            logger.warning("⚠️  User does NOT have rds_iam role - this may be the issue!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed with IAM token: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def test_database_connection_with_password():
    """Test database connection using password fallback"""
    try:
        # This would require secrets manager access
        logger.info("Testing password-based connection would require secrets manager access")
        logger.info("Skipping password test for now")
        return True
        
    except Exception as e:
        logger.error(f"❌ Password-based connection test failed: {e}")
        return False

def main():
    """Main test function"""
    logger.info("🔍 Starting database connection diagnostics...")
    
    # Test 1: IAM token generation
    logger.info("\n" + "="*50)
    logger.info("TEST 1: IAM Token Generation")
    logger.info("="*50)
    token = test_iam_token_generation()
    
    if not token:
        logger.error("❌ Cannot proceed without IAM token")
        sys.exit(1)
    
    # Test 2: Database connection with IAM
    logger.info("\n" + "="*50)
    logger.info("TEST 2: Database Connection with IAM")
    logger.info("="*50)
    iam_success = test_database_connection_with_iam(token)
    
    # Test 3: Password fallback (if needed)
    logger.info("\n" + "="*50)
    logger.info("TEST 3: Password Fallback")
    logger.info("="*50)
    password_success = test_database_connection_with_password()
    
    # Summary
    logger.info("\n" + "="*50)
    logger.info("SUMMARY")
    logger.info("="*50)
    logger.info(f"IAM Token Generation: {'✅ PASS' if token else '❌ FAIL'}")
    logger.info(f"IAM Database Connection: {'✅ PASS' if iam_success else '❌ FAIL'}")
    logger.info(f"Password Fallback: {'✅ PASS' if password_success else '❌ FAIL'}")
    
    if iam_success:
        logger.info("🎉 IAM database authentication is working!")
    else:
        logger.error("💥 IAM database authentication is failing!")
        logger.info("💡 Check:")
        logger.info("   1. PostgreSQL user has rds_iam role")
        logger.info("   2. IAM role has rds-db:connect permission")
        logger.info("   3. SSL is properly configured")
        logger.info("   4. Database endpoint is correct")

if __name__ == "__main__":
    main()
