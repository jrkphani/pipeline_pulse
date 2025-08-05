from sqlalchemy import Column, Integer, String, DateTime, Text, Enum
from sqlalchemy.sql import func
import enum
import uuid
from ..core.database import Base


class SyncStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class SyncType(enum.Enum):
    FULL = "full"
    INCREMENTAL = "incremental"


class SyncSession(Base):
    """Sync session model for tracking Zoho CRM synchronization."""
    
    __tablename__ = "sync_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(Enum(SyncStatus), nullable=False, default=SyncStatus.PENDING)
    sync_type = Column(Enum(SyncType), nullable=False)
    
    # Timing
    started_at = Column(DateTime, nullable=False, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    # Statistics
    records_processed = Column(Integer, default=0)
    records_successful = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)
    
    # Triggered by
    triggered_by_user_id = Column(Integer, nullable=True)
    
    @property
    def duration_seconds(self) -> int:
        """Get sync duration in seconds."""
        if self.completed_at and self.started_at:
            return int((self.completed_at - self.started_at).total_seconds())
        return 0
    
    @property
    def success_rate(self) -> float:
        """Get sync success rate as percentage."""
        if self.records_processed == 0:
            return 0.0
        return (self.records_successful / self.records_processed) * 100
    
    def __repr__(self) -> str:
        return f"<SyncSession(id={self.id}, status={self.status.value}, type={self.sync_type.value})>"