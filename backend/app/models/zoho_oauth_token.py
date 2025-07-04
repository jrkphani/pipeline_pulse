"""
Zoho OAuth Token Model for SDK Token Store
Stores OAuth tokens in database for Lambda compatibility
"""

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class ZohoOAuthToken(Base):
    """
    Zoho OAuth tokens table for SDK database persistence
    Compatible with Zoho SDK TokenStore interface
    """
    
    __tablename__ = "zoho_oauth_tokens"
    
    # Primary key - combination of user and client_id
    id = Column(String(255), primary_key=True, nullable=False)
    
    # Token identification
    user_name = Column(String(255), nullable=True, index=True)
    client_id = Column(String(255), nullable=True, index=True)
    client_secret = Column(String(255), nullable=True)
    
    # Token data
    refresh_token = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    grant_token = Column(Text, nullable=True)
    expiry_time = Column(String(50), nullable=True)
    
    # OAuth configuration
    redirect_url = Column(String(500), nullable=True)
    api_domain = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<ZohoOAuthToken(id={self.id}, user={self.user_name}, client_id={self.client_id[:10]}...)>"