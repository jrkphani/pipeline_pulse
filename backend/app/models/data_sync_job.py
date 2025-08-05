"""
Data Sync Job Model
Represents individual synchronization jobs/tasks
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, Text, JSON, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum


class SyncJobType(str, enum.Enum):
    """Types of sync jobs"""
    FULL_SYNC = "full_sync"
    INCREMENTAL_SYNC = "incremental_sync"
    DELTA_SYNC = "delta_sync"
    WEBHOOK_SYNC = "webhook_sync"
    MANUAL_SYNC = "manual_sync"


class SyncJobStatus(str, enum.Enum):
    """Status of sync jobs"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DataSyncJob(Base):
    """Individual data synchronization job"""
    __tablename__ = 'data_sync_jobs'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_type = Column(Enum(SyncJobType), nullable=False)
    status = Column(Enum(SyncJobStatus), default=SyncJobStatus.PENDING)
    module_name = Column(String(50), nullable=False)
    priority = Column(Integer, default=5)  # 1-10, higher is more urgent
    
    # Job details
    criteria = Column(JSON)  # Filter criteria for the sync
    options = Column(JSON)  # Additional job options
    
    # Progress tracking
    total_records = Column(Integer)
    processed_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    skipped_records = Column(Integer, default=0)
    
    # Timing
    scheduled_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    estimated_completion = Column(DateTime)
    
    # Error handling
    error_message = Column(Text)
    error_details = Column(JSON)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Metadata
    triggered_by = Column(String(100))  # User or system that triggered the job
    parent_job_id = Column(String(36))  # For chained jobs
    result_summary = Column(JSON)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())