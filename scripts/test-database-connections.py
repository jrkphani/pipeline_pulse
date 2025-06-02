#!/usr/bin/env python3
"""
Database Connection Tester for Pipeline Pulse
Tests connectivity to both local and production databases
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import time

def test_database_connection(database_url, name="Database"):
    """Test database connection and return status"""
    
    print(f"🔌 Testing {name} connection...")
    print(f"   URL: {database_url[:50]}...")
    
    try:
        # Create engine with timeout
        engine = create_engine(
            database_url,
            pool_timeout=10,
            pool_recycle=300,
            echo=False
        )
        
        start_time = time.time()
        
        # Test basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            row = result.fetchone()
            
        connect_time = time.time() - start_time
        
        if row and row[0] == 1:
            print(f"   ✅ Connection successful ({connect_time:.2f}s)")
            
            # Get database info
            try:
                with engine.connect() as conn:
                    if 'postgresql' in database_url:
                        # PostgreSQL specific queries
                        result = conn.execute(text("SELECT version()"))
                        version = result.fetchone()[0]
                        print(f"   📋 Version: {version.split(',')[0]}")
                        
                        # Get table list
                        result = conn.execute(text("""
                            SELECT table_name 
                            FROM information_schema.tables 
                            WHERE table_schema = 'public'
                        """))
                        tables = [row[0] for row in result]
                        
                    elif 'sqlite' in database_url:
                        # SQLite specific queries
                        result = conn.execute(text("SELECT sqlite_version()"))
                        version = result.fetchone()[0]
                        print(f"   📋 SQLite Version: {version}")
                        
                        # Get table list
                        result = conn.execute(text("""
                            SELECT name FROM sqlite_master WHERE type='table'
                        """))
                        tables = [row[0] for row in result]
                    
                    print(f"   📊 Tables found: {len(tables)}")
                    for table in tables:
                        try:
                            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                            count = result.fetchone()[0]
                            print(f"      - {table}: {count} records")
                        except Exception as e:
                            print(f"      - {table}: Error counting ({str(e)[:50]})")
                            
            except Exception as e:
                print(f"   ⚠️ Could not get database details: {e}")
            
            return True
            
    except SQLAlchemyError as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False

def main():
    """Test all database configurations"""
    
    print("🔧 Pipeline Pulse Database Connection Tester")
    print("=" * 50)
    
    # Test local development database
    local_db_url = "sqlite:////Users/jrkphani/Projects/pipeline-pulse/backend/pipeline_pulse.db"
    local_success = test_database_connection(local_db_url, "Local SQLite")
    
    print()
    
    # Test production database
    prod_db_url = "postgresql://postgres:PipelinePulse2025!@pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com:5432/pipeline_pulse"
    prod_success = test_database_connection(prod_db_url, "Production PostgreSQL")
    
    print()
    print("📋 Summary:")
    print(f"   Local SQLite: {'✅ Connected' if local_success else '❌ Failed'}")
    print(f"   Production PostgreSQL: {'✅ Connected' if prod_success else '❌ Failed'}")
    
    if not local_success and not prod_success:
        print("\n🚨 CRITICAL: No database connections working!")
        print("   Check database configuration and network connectivity")
    elif not prod_success:
        print("\n⚠️ WARNING: Production database not accessible")
        print("   This explains the timeout issues in your deployment")
        print("   Check:")
        print("   - RDS security groups")
        print("   - VPC configuration") 
        print("   - Database credentials")
        print("   - Network connectivity from ECS")
    elif not local_success:
        print("\n⚠️ WARNING: Local database not accessible")
        print("   Check if SQLite file exists and permissions are correct")
    else:
        print("\n✅ All database connections working!")
    
    # Provide recommendations
    print("\n🎯 Recommendations:")
    if not prod_success:
        print("1. Fix production database connectivity first")
        print("2. Check ECS security groups allow outbound to RDS")
        print("3. Verify RDS security groups allow inbound from ECS")
        print("4. Test database connection from within ECS container")
    
    if local_success and prod_success:
        print("1. Consider migrating to consistent database type")
        print("2. Set up data synchronization between environments")
        print("3. Implement proper database migrations")

if __name__ == "__main__":
    main()
