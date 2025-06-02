"""
Create user and session tables for Zoho role-based authentication
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.user import User, UserSession
from app.core.database import Base

def create_user_tables():
    """Create user and session tables"""
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        # Create tables
        print("Creating user and session tables...")
        Base.metadata.create_all(bind=engine, tables=[User.__table__, UserSession.__table__])
        
        # Create indexes
        with engine.connect() as conn:
            # User table indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_zoho_user_id ON users(zoho_user_id);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            """))
            
            # Skip GIN index for SQLite (not supported)
            # conn.execute(text("""
            #     CREATE INDEX IF NOT EXISTS idx_users_territory_assignments
            #     ON users USING GIN(territory_assignments);
            # """))
            
            # Session table indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(token_expires_at);
            """))
            
            conn.commit()
        
        print("✅ User and session tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_user_tables()
    if not success:
        sys.exit(1)
