"""
Sync Operations Models
SQLAlchemy models for tracking sync operations and conflicts

REFACTORING: Replaces raw SQL in sync_tracker.py with proper SQLAlchemy models
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
import uuid


class ZohoSyncOperation(Base):
    """Model for tracking sync operations between local DB and Zoho CRM"""
    __tablename__ = "zoho_sync_operations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    operation_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    conflicts_resolved = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    operation_metadata = Column(JSON, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class ZohoSyncConflict(Base):
    """Model for tracking sync conflicts and their resolution"""
    __tablename__ = "zoho_sync_conflicts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    operation_id = Column(String(36), ForeignKey('zoho_sync_operations.id'), nullable=False)
    record_id = Column(String(50), nullable=False)
    record_type = Column(String(50), nullable=False)
    conflict_type = Column(String(50), nullable=False)
    local_data = Column(JSON, nullable=True)
    remote_data = Column(JSON, nullable=True)
    resolution_strategy = Column(String(50), nullable=True)
    resolved_data = Column(JSON, nullable=True)
    status = Column(String(20), nullable=False, default='pending')
    created_at = Column(DateTime, default=func.now())
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)