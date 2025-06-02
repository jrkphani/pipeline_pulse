"""
User model with Zoho role integration and caching
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid

from app.core.database import Base


class User(Base):
    """User model with Zoho role caching"""
    
    __tablename__ = "users"
    
    # Primary identifiers
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    zoho_user_id = Column(String(255), unique=True, nullable=True, index=True)  # Nullable for SAML users
    email = Column(String(255), unique=True, nullable=False, index=True)

    # Authentication provider
    auth_provider = Column(String(50), default="zoho")  # "zoho" or "saml"
    
    # Basic profile information
    first_name = Column(String(255))
    last_name = Column(String(255))
    display_name = Column(String(255))
    department = Column(String(255))  # For SAML users
    
    # Zoho role information (cached)
    zoho_role_id = Column(String(255))
    zoho_role_name = Column(String(255))
    zoho_profile_id = Column(String(255))
    zoho_profile_name = Column(String(255))
    
    # Parsed permissions (JSON for flexibility)
    module_permissions = Column(JSON)  # What modules user can access
    field_permissions = Column(JSON)   # Field-level permissions
    territory_assignments = Column(JSON)  # JSON array of territory names
    
    # Cache metadata
    last_role_sync = Column(DateTime(timezone=True))
    role_cache_valid_until = Column(DateTime(timezone=True))
    
    # Session info
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(email='{self.email}', zoho_role='{self.zoho_role_name}')>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.display_name or self.email
    
    @property
    def is_role_cache_valid(self) -> bool:
        """Check if role cache is still valid"""
        if not self.role_cache_valid_until:
            return False
        return datetime.now() < self.role_cache_valid_until
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        if not self.zoho_profile_name:
            return False
        profile_name = self.zoho_profile_name.lower()
        return 'administrator' in profile_name or 'admin' in profile_name
    
    def get_territories(self) -> List[str]:
        """Get user's assigned territories"""
        return self.territory_assignments or []
    
    def has_module_permission(self, module: str, permission: str) -> bool:
        """Check if user has specific module permission"""
        if not self.module_permissions:
            return False
        
        module_perms = self.module_permissions.get(module, {})
        return module_perms.get(permission, False)
    
    def has_territory_access(self, territory: str) -> bool:
        """Check if user has access to specific territory"""
        territories = self.get_territories()
        return territory in territories or self.is_admin
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary for API responses"""
        return {
            "id": str(self.id),
            "zoho_user_id": self.zoho_user_id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "display_name": self.display_name,
            "full_name": self.full_name,
            "zoho_role_name": self.zoho_role_name,
            "zoho_profile_name": self.zoho_profile_name,
            "territories": self.get_territories(),
            "is_admin": self.is_admin,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "role_cache_valid": self.is_role_cache_valid
        }


class UserSession(Base):
    """User session with Zoho token management"""
    
    __tablename__ = "user_sessions"
    
    # Primary identifiers
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # Zoho OAuth tokens
    zoho_access_token = Column(Text, nullable=False)
    zoho_refresh_token = Column(Text, nullable=False)
    token_expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Session permissions (real-time cache)
    session_permissions = Column(JSON)
    
    # Session metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<UserSession(user_id='{self.user_id}', expires_at='{self.token_expires_at}')>"
    
    @property
    def is_token_valid(self) -> bool:
        """Check if Zoho access token is still valid"""
        return datetime.now() < self.token_expires_at
    
    def needs_refresh(self) -> bool:
        """Check if token needs refresh (expires within 5 minutes)"""
        return datetime.now() + timedelta(minutes=5) >= self.token_expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "token_expires_at": self.token_expires_at.isoformat(),
            "is_token_valid": self.is_token_valid,
            "needs_refresh": self.needs_refresh(),
            "last_used": self.last_used.isoformat(),
            "is_active": self.is_active
        }
