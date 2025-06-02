"""
Database models for bulk update functionality
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from enum import Enum


class UpdateStatus(str, Enum):
    """Status of bulk update operations"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class SyncStatus(str, Enum):
    """Status of CRM sync operations"""
    NOT_SYNCED = "not_synced"
    SYNCING = "syncing"
    SYNCED = "synced"
    SYNC_FAILED = "sync_failed"


class BulkUpdateBatch(Base):
    """Model for tracking bulk update batches"""

    __tablename__ = "bulk_update_batches"

    # Primary key
    batch_id = Column(String, primary_key=True, index=True)

    # Update details
    field_name = Column(String, nullable=False)
    field_value = Column(Text, nullable=False)  # Store as JSON string for complex values
    total_records = Column(Integer, default=0)
    successful_updates = Column(Integer, default=0)
    failed_updates = Column(Integer, default=0)

    # Status tracking
    status = Column(String, default=UpdateStatus.PENDING)
    sync_status = Column(String, default=SyncStatus.NOT_SYNCED)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String, nullable=False)

    # Error tracking
    error_details = Column(Text)  # JSON string for error details

    # Relationships
    record_updates = relationship("BulkUpdateRecord", back_populates="batch", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<BulkUpdateBatch(batch_id='{self.batch_id}', field='{self.field_name}', status='{self.status}')>"


class BulkUpdateRecord(Base):
    """Model for tracking individual record updates within a batch"""

    __tablename__ = "bulk_update_records"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to batch
    batch_id = Column(String, ForeignKey("bulk_update_batches.batch_id"), nullable=False)

    # Record details
    record_id = Column(String, nullable=False, index=True)  # Local database record ID
    zoho_id = Column(String, index=True)  # Zoho CRM record ID

    # Update tracking
    old_value = Column(Text)  # Previous value
    new_value = Column(Text)  # New value
    status = Column(String, default=UpdateStatus.PENDING)
    sync_status = Column(String, default=SyncStatus.NOT_SYNCED)

    # Error tracking
    error_message = Column(Text)

    # Timestamps
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    synced_at = Column(DateTime(timezone=True))

    # Relationships
    batch = relationship("BulkUpdateBatch", back_populates="record_updates")

    def __repr__(self):
        return f"<BulkUpdateRecord(id={self.id}, record_id='{self.record_id}', status='{self.status}')>"


# Pydantic models for API requests/responses

class BulkUpdateRequest(BaseModel):
    """Request model for bulk update operations"""
    field_name: str = Field(..., description="Name of the field to update")
    field_value: Any = Field(..., description="New value for the field")
    record_ids: List[str] = Field(..., description="List of record IDs to update")
    updated_by: str = Field(..., description="User performing the update")


class SyncToCRMRequest(BaseModel):
    """Request model for syncing updates to CRM"""
    update_batch_id: str = Field(..., description="ID of the update batch to sync")


class ZohoField(BaseModel):
    """Model for Zoho CRM field metadata"""
    api_name: str
    display_label: str
    data_type: str
    is_custom: bool = False
    is_read_only: bool = False
    is_required: bool = False
    is_system_field: bool = False
    has_picklist: bool = False
    picklist_values: Optional[List[Dict[str, str]]] = None
    max_length: Optional[int] = None
    validation_rules: Optional[Dict[str, Any]] = None


class BulkUpdateResponse(BaseModel):
    """Response model for bulk update operations"""
    success: bool
    batch_id: str
    total_records: int
    successful_updates: int
    failed_updates: int
    status: str
    message: str


class BatchStatusResponse(BaseModel):
    """Response model for batch status queries"""
    batch_id: str
    batch_details: Dict[str, Any]
    record_statuses: List[Dict[str, Any]]
    summary: Dict[str, Any]


class RecordForUpdate(BaseModel):
    """Model for records available for bulk update"""
    id: str
    opportunity_name: str
    account_name: str
    stage: str
    owner: str
    amount: float
    currency: str
    closing_date: str
    zoho_id: Optional[str] = None

    class Config:
        from_attributes = True