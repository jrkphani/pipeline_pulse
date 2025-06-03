"""
System Settings model for storing application-wide configuration
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class SystemSetting(Base):
    """System settings model for storing application configuration"""

    __tablename__ = "system_settings"

    key = Column(String(255), primary_key=True, index=True)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    is_encrypted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<SystemSetting(key='{self.key}', value='{self.value[:50]}...')>"
