"""
CRM Sync Session models for tracking live synchronization with Zoho CRM
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, JSON, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum


class SyncSessionStatus(enum.Enum):
    """Status of a CRM sync session"""
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SyncOperationType(enum.Enum):
    """Type of sync operation"""
    FULL_SYNC = "full_sync"
    INCREMENTAL_SYNC = "incremental_sync"
    MANUAL_REFRESH = "manual_refresh"
    WEBHOOK_UPDATE = "webhook_update"


class RecordSyncAction(enum.Enum):
    """Action taken on a record during sync"""
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    SKIPPED = "skipped"
    FAILED = "failed"


class ConflictResolutionStrategy(enum.Enum):
    """Strategy for resolving sync conflicts"""
    CRM_WINS = "crm_wins"
    LOCAL_WINS = "local_wins"
    MANUAL_REVIEW = "manual_review"
    MERGE_FIELDS = "merge_fields"


class CRMSyncSession(Base):
    """Main sync session tracking for CRM synchronization"""
    
    __tablename__ = "crm_sync_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_type = Column(Enum(SyncOperationType), nullable=False, index=True)
    status = Column(Enum(SyncSessionStatus), nullable=False, default=SyncSessionStatus.INITIATED, index=True)
    
    # Sync parameters
    module_name = Column(String(50), nullable=False, default="Deals")  # Zoho module (Deals, Contacts, etc.)
    sync_direction = Column(String(20), nullable=False, default="bidirectional")  # bidirectional, from_crm, to_crm
    
    # Timing information
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Progress tracking
    total_records = Column(Integer, nullable=True)
    processed_records = Column(Integer, default=0, nullable=False)
    successful_records = Column(Integer, default=0, nullable=False)
    failed_records = Column(Integer, default=0, nullable=False)
    skipped_records = Column(Integer, default=0, nullable=False)
    
    # Data ranges for incremental sync
    from_timestamp = Column(DateTime(timezone=True), nullable=True)
    to_timestamp = Column(DateTime(timezone=True), nullable=True)
    last_modified_time = Column(DateTime(timezone=True), nullable=True)  # Last record modification time
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    
    # Performance metrics
    api_calls_made = Column(Integer, default=0, nullable=False)
    rate_limit_hits = Column(Integer, default=0, nullable=False)
    total_data_transferred_mb = Column(Float, default=0.0, nullable=False)
    
    # Configuration
    batch_size = Column(Integer, default=100, nullable=False)
    conflict_resolution = Column(Enum(ConflictResolutionStrategy), default=ConflictResolutionStrategy.CRM_WINS)
    sync_config = Column(JSON, nullable=True)  # Additional sync configuration
    
    # User context
    initiated_by = Column(String(100), nullable=True)  # User or system that initiated sync
    
    # Relationships
    status_logs = relationship("SyncStatusLog", back_populates="session", cascade="all, delete-orphan")
    record_statuses = relationship("RecordSyncStatus", back_populates="session", cascade="all, delete-orphan")
    
    @property
    def progress_percentage(self) -> float:
        """Calculate sync progress percentage"""
        if not self.total_records or self.total_records == 0:
            return 0.0
        processed = self.processed_records or 0
        return (processed / self.total_records) * 100
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate of processed records"""
        processed = self.processed_records or 0
        successful = self.successful_records or 0
        if processed == 0:
            return 0.0
        return (successful / processed) * 100
    
    @property
    def duration_seconds(self) -> float:
        """Calculate session duration in seconds"""
        if not self.completed_at:
            return (func.now() - self.started_at).total_seconds()
        return (self.completed_at - self.started_at).total_seconds()
    
    def __repr__(self):
        return f"<CRMSyncSession(id={self.id[:8]}, type={self.session_type.value}, status={self.status.value})>"


class SyncStatusLog(Base):
    """Detailed status logs for sync session events"""
    
    __tablename__ = "sync_status_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(36), ForeignKey("crm_sync_sessions.id", ondelete="CASCADE"), nullable=False)
    
    # Log details
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    log_level = Column(String(10), nullable=False, default="INFO")  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    component = Column(String(50), nullable=False)  # API, TRANSFORMER, DATABASE, etc.
    message = Column(Text, nullable=False)
    
    # Additional context
    record_id = Column(String(50), nullable=True)  # Specific record if applicable
    api_endpoint = Column(String(200), nullable=True)  # Zoho API endpoint used
    execution_time_ms = Column(Integer, nullable=True)  # Execution time for operation
    data_payload = Column(JSON, nullable=True)  # Request/response data for debugging
    
    # Error details
    error_code = Column(String(20), nullable=True)  # Zoho error code
    error_details = Column(JSON, nullable=True)  # Detailed error information
    
    # Relationships
    session = relationship("CRMSyncSession", back_populates="status_logs")
    
    def __repr__(self):
        return f"<SyncStatusLog(session={self.session_id[:8]}, level={self.log_level}, component={self.component})>"


class RecordSyncStatus(Base):
    """Individual record sync status and conflict tracking"""
    
    __tablename__ = "record_sync_statuses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(36), ForeignKey("crm_sync_sessions.id", ondelete="CASCADE"), nullable=False)
    
    # Record identification
    crm_record_id = Column(String(50), nullable=False, index=True)  # Zoho record ID
    local_record_id = Column(String(36), nullable=True, index=True)  # Local DB record ID
    module_name = Column(String(50), nullable=False, default="Deals")
    
    # Sync status
    action_taken = Column(Enum(RecordSyncAction), nullable=False, index=True)
    sync_direction = Column(String(20), nullable=False)  # from_crm, to_crm
    
    # Timing
    processed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Data tracking
    fields_updated = Column(JSON, nullable=True)  # List of field names that were updated
    before_data = Column(JSON, nullable=True)  # Data before sync
    after_data = Column(JSON, nullable=True)  # Data after sync
    
    # Conflict handling
    has_conflicts = Column(Boolean, default=False, nullable=False)
    conflict_details = Column(JSON, nullable=True)  # Details of field conflicts
    resolution_strategy = Column(Enum(ConflictResolutionStrategy), nullable=True)
    resolved_by = Column(String(100), nullable=True)  # User who resolved conflicts
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_code = Column(String(20), nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Data quality
    validation_errors = Column(JSON, nullable=True)  # Field validation errors
    data_quality_score = Column(Float, nullable=True)  # 0.0 to 1.0 quality score
    
    # Performance
    processing_time_ms = Column(Integer, nullable=True)
    api_calls_used = Column(Integer, default=0, nullable=False)
    
    # Relationships
    session = relationship("CRMSyncSession", back_populates="record_statuses")
    
    @property
    def is_successful(self) -> bool:
        """Check if record sync was successful"""
        return self.action_taken in [RecordSyncAction.CREATED, RecordSyncAction.UPDATED] and not self.error_message
    
    @property
    def needs_attention(self) -> bool:
        """Check if record needs manual attention"""
        return self.has_conflicts or self.action_taken == RecordSyncAction.FAILED or self.validation_errors
    
    def __repr__(self):
        return f"<RecordSyncStatus(crm_id={self.crm_record_id}, action={self.action_taken.value})>"


class SyncConfiguration(Base):
    """Configuration settings for CRM synchronization"""
    
    __tablename__ = "sync_configurations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    config_name = Column(String(100), nullable=False, unique=True, index=True)
    module_name = Column(String(50), nullable=False, default="Deals")
    
    # Sync settings
    is_active = Column(Boolean, default=True, nullable=False)
    sync_frequency_minutes = Column(Integer, default=15, nullable=False)  # How often to sync
    batch_size = Column(Integer, default=100, nullable=False)
    
    # Field mapping
    field_mappings = Column(JSON, nullable=True)  # CRM field -> Local field mappings
    required_fields = Column(JSON, nullable=True)  # List of required fields for sync
    readonly_fields = Column(JSON, nullable=True)  # Fields that should not be updated
    
    # Conflict resolution
    default_conflict_resolution = Column(Enum(ConflictResolutionStrategy), 
                                       default=ConflictResolutionStrategy.CRM_WINS)
    field_specific_resolutions = Column(JSON, nullable=True)  # Per-field conflict resolution
    
    # Data quality
    validation_rules = Column(JSON, nullable=True)  # Custom validation rules
    quality_thresholds = Column(JSON, nullable=True)  # Data quality thresholds
    
    # Performance settings
    rate_limit_buffer = Column(Integer, default=10, nullable=False)  # % buffer for rate limits
    max_concurrent_operations = Column(Integer, default=5, nullable=False)
    timeout_seconds = Column(Integer, default=300, nullable=False)
    
    # Monitoring
    alert_on_failures = Column(Boolean, default=True, nullable=False)
    failure_threshold_percentage = Column(Float, default=5.0, nullable=False)  # Alert if > 5% failures
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100), nullable=True)
    
    def __repr__(self):
        return f"<SyncConfiguration(name={self.config_name}, module={self.module_name})>"


class SyncHealthMetrics(Base):
    """Aggregated health metrics for sync performance monitoring"""
    
    __tablename__ = "sync_health_metrics"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    metric_date = Column(DateTime(timezone=True), nullable=False, index=True)
    module_name = Column(String(50), nullable=False, default="Deals")
    
    # Session metrics
    total_sessions = Column(Integer, default=0, nullable=False)
    successful_sessions = Column(Integer, default=0, nullable=False)
    failed_sessions = Column(Integer, default=0, nullable=False)
    avg_session_duration_seconds = Column(Float, default=0.0, nullable=False)
    
    # Record metrics
    total_records_processed = Column(Integer, default=0, nullable=False)
    total_records_successful = Column(Integer, default=0, nullable=False)
    total_records_failed = Column(Integer, default=0, nullable=False)
    total_conflicts_detected = Column(Integer, default=0, nullable=False)
    avg_processing_time_ms = Column(Float, default=0.0, nullable=False)
    
    # API performance
    total_api_calls = Column(Integer, default=0, nullable=False)
    total_rate_limit_hits = Column(Integer, default=0, nullable=False)
    avg_response_time_ms = Column(Float, default=0.0, nullable=False)
    total_data_transferred_mb = Column(Float, default=0.0, nullable=False)
    
    # Quality metrics
    avg_data_quality_score = Column(Float, default=0.0, nullable=False)
    total_validation_errors = Column(Integer, default=0, nullable=False)
    data_freshness_minutes = Column(Integer, default=0, nullable=False)  # How old is the data
    
    # System health
    system_health_score = Column(Float, default=1.0, nullable=False)  # 0.0 to 1.0
    uptime_percentage = Column(Float, default=100.0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<SyncHealthMetrics(date={self.metric_date}, module={self.module_name}, health={self.system_health_score})>"