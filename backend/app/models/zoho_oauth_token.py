# backend/app/models/zoho_oauth_token.py
from sqlalchemy import Column, String, BigInteger
from ..core.database import Base


class ZohoOAuthToken(Base):
    """
    Database model for storing Zoho OAuth tokens for multi-user authentication.
    Based on the official Zoho SDK documentation for token persistence.
    """
    __tablename__ = 'zoho_oauth_tokens'

    # Using user_email as the unique ID for the token, as recommended for multi-user
    user_email = Column(String, primary_key=True, index=True)
    client_id = Column(String, nullable=False)
    client_secret = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    access_token = Column(String, nullable=True)
    grant_token = Column(String, nullable=True)
    expiry_time = Column(BigInteger, nullable=True)  # Store as Unix timestamp (milliseconds)
    redirect_url = Column(String, nullable=True)
    api_domain = Column(String, nullable=True)

    def __repr__(self):
        return f"<ZohoOAuthToken(user_email={self.user_email}, client_id={self.client_id})>"