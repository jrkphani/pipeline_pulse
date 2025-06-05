"""
Token Management Models for Pipeline Pulse
Provides comprehensive token lifecycle management
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, JSON
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from app.core.database import Base
import uuid


class ZohoTokenRecord(Base):
    """
    Comprehensive Zoho token management with lifecycle tracking
    """
    
    __tablename__ = "zoho_token_records"
    
    # Primary identifiers
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    
    # Token data (encrypted in production)
    access_token_hash = Column(String(64), nullable=True)  # SHA-256 hash for tracking
    refresh_token_hash = Column(String(64), nullable=True)  # SHA-256 hash for tracking
    
    # Token lifecycle
    issued_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_used = Column(DateTime(timezone=True), server_default=func.now())
    last_refreshed = Column(DateTime(timezone=True), nullable=True)
    
    # Token status
    is_active = Column(Boolean, default=True)
    is_expired = Column(Boolean, default=False)
    refresh_count = Column(Integer, default=0)
    
    # Error tracking
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0)
    last_error_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    token_source = Column(String(50), default="manual")  # manual, auto_refresh, initial
    client_id = Column(String(100), nullable=False)
    scopes = Column(JSON, nullable=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    @property
    def is_near_expiry(self) -> bool:
        """Check if token expires within 10 minutes"""
        if not self.expires_at:
            return True
        return datetime.now() >= (self.expires_at - timedelta(minutes=10))
    
    @property
    def time_until_expiry(self) -> timedelta:
        """Get time remaining until token expires"""
        if not self.expires_at:
            return timedelta(0)
        return max(timedelta(0), self.expires_at - datetime.now())
    
    @property
    def health_status(self) -> str:
        """Get token health status"""
        if self.is_expired:
            return "expired"
        elif self.is_near_expiry:
            return "warning"
        elif self.error_count > 3:
            return "error"
        else:
            return "healthy"


class TokenRefreshLog(Base):
    """
    Log all token refresh attempts for monitoring and debugging
    """
    
    __tablename__ = "token_refresh_logs"
    
    # Primary identifiers
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    token_record_id = Column(String(36), nullable=False, index=True)
    
    # Refresh attempt details
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    success = Column(Boolean, nullable=False)
    error_message = Column(Text, nullable=True)
    response_code = Column(Integer, nullable=True)
    
    # Performance metrics
    response_time_ms = Column(Integer, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Context
    trigger_reason = Column(String(100), nullable=True)  # expired, near_expiry, manual, error_recovery
    user_agent = Column(String(255), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TokenAlert(Base):
    """
    Token-related alerts and notifications
    """
    
    __tablename__ = "token_alerts"
    
    # Primary identifiers
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    token_record_id = Column(String(36), nullable=False, index=True)
    
    # Alert details
    alert_type = Column(String(50), nullable=False)  # expiry_warning, refresh_failed, error_threshold
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    message = Column(Text, nullable=False)
    
    # Alert status
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    
    # Auto-resolution
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_reason = Column(String(255), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
