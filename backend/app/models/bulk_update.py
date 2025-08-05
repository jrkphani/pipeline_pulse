"""
Bulk Update Models
Handles batch updates for CRM records
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class BulkUpdateBatch(Base):
    """Represents a batch of bulk updates"""
    __tablename__ = 'bulk_update_batches'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_name = Column(String(50), nullable=False)
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    status = Column(String(20), default='pending')  # pending, processing, completed, failed
    error_message = Column(Text)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    created_by = Column(String(100))
    update_payload = Column(JSON)  # The update data to apply
    
    # Relationships
    records = relationship("BulkUpdateRecord", back_populates="batch", cascade="all, delete-orphan")


class BulkUpdateRecord(Base):
    """Individual record in a bulk update batch"""
    __tablename__ = 'bulk_update_records'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey('bulk_update_batches.id'), nullable=False)
    record_id = Column(String(50), nullable=False)  # CRM record ID
    status = Column(String(20), default='pending')  # pending, success, failed
    error_message = Column(Text)
    before_data = Column(JSON)
    after_data = Column(JSON)
    processed_at = Column(DateTime)
    
    # Relationships
    batch = relationship("BulkUpdateBatch", back_populates="records")