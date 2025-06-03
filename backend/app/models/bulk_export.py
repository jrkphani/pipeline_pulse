"""
Bulk Export models for tracking Zoho bulk export jobs
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, Float
from sqlalchemy.sql import func
from app.core.database import Base
from enum import Enum


class BulkExportJobStatus(str, Enum):
    """Status of bulk export job"""
    PENDING = "pending"
    ADDED = "added"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BulkExportJob(Base):
    """Model for tracking Zoho bulk export jobs"""

    __tablename__ = "bulk_export_jobs"

    # Primary identifiers
    id = Column(String, primary_key=True, index=True)  # Our internal job ID
    zoho_job_id = Column(String, nullable=True, index=True)  # Zoho's job ID
    
    # Job configuration
    module_name = Column(String, nullable=False, default="Deals")
    criteria_json = Column(Text, nullable=True)  # JSON string of export criteria
    fields_json = Column(Text, nullable=True)  # JSON string of fields to export
    
    # Job status and progress
    status = Column(String, nullable=False, default=BulkExportJobStatus.PENDING)
    progress_percentage = Column(Integer, default=0)
    
    # Record counts
    estimated_records = Column(Integer, default=0)
    total_records = Column(Integer, default=0)
    new_records = Column(Integer, default=0)
    updated_records = Column(Integer, default=0)
    deleted_records = Column(Integer, default=0)
    
    # Job results
    download_url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)  # Local file path after download
    file_size = Column(Integer, default=0)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_polled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Callback information
    callback_received = Column(Boolean, default=False)
    callback_received_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<BulkExportJob(id='{self.id}', status='{self.status}', records={self.total_records})>"


class BulkExportRecord(Base):
    """Model for tracking individual records in bulk export"""

    __tablename__ = "bulk_export_records"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, nullable=False, index=True)  # Foreign key to BulkExportJob
    
    # Record identifiers
    zoho_record_id = Column(String, nullable=False, index=True)
    record_type = Column(String, nullable=False, default="Deal")
    
    # Record status
    action_taken = Column(String, nullable=False)  # "created", "updated", "deleted", "skipped"
    
    # Record data
    record_data_json = Column(Text, nullable=True)  # JSON string of record data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<BulkExportRecord(job_id='{self.job_id}', zoho_id='{self.zoho_record_id}', action='{self.action_taken}')>"
