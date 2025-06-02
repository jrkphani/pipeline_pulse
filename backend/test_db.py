#!/usr/bin/env python3
"""
Test database connection
"""

import os
from app.core.config import settings
from app.core.database import engine
from sqlalchemy import text

print(f"Current working directory: {os.getcwd()}")
print(f"Database URL: {settings.DATABASE_URL}")

# Check if database file exists
db_path = settings.DATABASE_URL.replace('sqlite:///', '')
print(f"Database file path: {db_path}")
print(f"Database file exists: {os.path.exists(db_path)}")

# Test connection
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = result.fetchall()
        print(f"Tables in database: {[table[0] for table in tables]}")
except Exception as e:
    print(f"Database connection error: {e}")
