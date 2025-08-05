#!/usr/bin/env python3
"""
Test script to check current user status.
"""

import asyncio
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, get_db
from app.models.user import User
from app.models.zoho_oauth_token import ZohoOAuthToken
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def check_users():
    """Check current users and their Zoho token status."""
    async with AsyncSession(engine) as db:
        # Get all users
        users_query = select(User).order_by(User.id.desc())
        users_result = await db.execute(users_query)
        users = users_result.scalars().all()
        
        print("Users in database:")
        print("-" * 80)
        for user in users:
            print(f"ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Name: {user.first_name} {user.last_name}")
            print(f"Active: {user.is_active}")
            print(f"Created: {user.created_at}")
            
            # Check for Zoho token
            token_query = select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == user.email)
            token_result = await db.execute(token_query)
            token = token_result.scalar_one_or_none()
            
            if token:
                print(f"Zoho Token: YES")
                print(f"  - Has refresh token: {bool(token.refresh_token)}")
                print(f"  - Has access token: {bool(token.access_token)}")
            else:
                print(f"Zoho Token: NO")
            
            print("-" * 80)

if __name__ == "__main__":
    asyncio.run(check_users())