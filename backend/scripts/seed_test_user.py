#!/usr/bin/env python3
"""
Seed the database with a test user for development and testing.

Usage:
    python scripts/seed_test_user.py

This creates a test user with:
- Email: test@example.com
- Password: testpass
- Role: admin
- Active: True
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import init_db, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User

async def create_test_user():
    """Create a test user in the database."""
    
    # Initialize database
    init_db(
        database_url=settings.database_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        echo=settings.debug,
    )
    
    print("🔄 Connecting to database...")
    
    async for db in get_db():
        try:
            # Check if test user already exists
            query = select(User).where(User.email == "test@example.com")
            result = await db.execute(query)
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print("✅ Test user already exists:")
                print(f"   Email: {existing_user.email}")
                print(f"   Role: {existing_user.role}")
                print(f"   Active: {existing_user.is_active}")
                print(f"   ID: {existing_user.id}")
                return existing_user
            
            # Create test user
            print("🔄 Creating test user...")
            
            hashed_password = get_password_hash("testpass")
            test_user = User(
                email="test@example.com",
                hashed_password=hashed_password,
                first_name="Test",
                last_name="User",
                role="admin",
                is_active=True,
                is_superuser=True,
            )
            
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
            
            print("✅ Test user created successfully:")
            print(f"   Email: {test_user.email}")
            print(f"   Password: testpass")
            print(f"   Role: {test_user.role}")
            print(f"   Active: {test_user.is_active}")
            print(f"   ID: {test_user.id}")
            
            return test_user
            
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            await db.rollback()
            raise
        finally:
            break

async def verify_test_user():
    """Verify the test user can be authenticated."""
    from app.core.security import verify_password
    
    async for db in get_db():
        try:
            query = select(User).where(User.email == "test@example.com")
            result = await db.execute(query)
            user = result.scalar_one_or_none()
            
            if not user:
                print("❌ Test user not found for verification")
                return False
                
            # Test password verification
            is_valid = verify_password("testpass", user.hashed_password)
            if is_valid:
                print("✅ Password verification successful")
            else:
                print("❌ Password verification failed")
                
            return is_valid
            
        except Exception as e:
            print(f"❌ Error verifying test user: {e}")
            return False
        finally:
            break

async def main():
    """Main function to seed test user."""
    print("🚀 Pipeline Pulse - Database Seeding")
    print("=" * 50)
    
    try:
        # Create test user
        user = await create_test_user()
        
        # Verify authentication
        print("\n🔄 Verifying authentication...")
        verification_success = await verify_test_user()
        
        print("\n" + "=" * 50)
        if verification_success:
            print("✅ DATABASE SEEDING COMPLETE!")
            print("\nYou can now test the login endpoint with:")
            print("  Email: test@example.com")
            print("  Password: testpass")
            print("\nTest command:")
            print('  curl -X POST http://localhost:8000/api/v1/auth/login \\')
            print('    -H "Content-Type: application/json" \\')
            print('    -d \'{"email":"test@example.com","password":"testpass"}\'')
        else:
            print("❌ DATABASE SEEDING FAILED!")
            print("Check the error messages above.")
            
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())