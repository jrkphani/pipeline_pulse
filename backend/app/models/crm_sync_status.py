"""
CRM Sync Status Model
Tracks the synchronization status between local database and Zoho CRM
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class CrmSyncStatus(Base):
    """Tracks sync status for CRM modules"""
    __tablename__ = 'crm_sync_status'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_name = Column(String(50), nullable=False, unique=True)
    last_sync_time = Column(DateTime)
    last_modified_time = Column(DateTime)  # Last modified time from CRM
    sync_token = Column(String(255))  # For incremental sync
    is_syncing = Column(Boolean, default=False)
    sync_status = Column(String(20), default='idle')  # idle, syncing, completed, failed
    last_error = Column(Text)
    total_records = Column(Integer, default=0)
    synced_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    sync_frequency_minutes = Column(Integer, default=60)
    is_enabled = Column(Boolean, default=True)
    sync_metadata = Column(JSON)  # Additional sync configuration
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())