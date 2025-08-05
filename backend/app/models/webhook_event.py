"""
Webhook Event Model
Stores and tracks webhook events from Zoho CRM
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum


class WebhookStatus(str, enum.Enum):
    """Status of webhook processing"""
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
    IGNORED = "ignored"


class WebhookEventType(str, enum.Enum):
    """Types of webhook events"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    BULK_UPDATE = "bulk_update"
    WORKFLOW = "workflow"
    APPROVAL = "approval"


class WebhookEvent(Base):
    """Webhook events from Zoho CRM"""
    __tablename__ = 'webhook_events'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    webhook_id = Column(String(100))  # Zoho webhook ID
    event_type = Column(Enum(WebhookEventType), nullable=False)
    module_name = Column(String(50), nullable=False)
    record_id = Column(String(50))  # CRM record ID
    
    # Event details
    payload = Column(JSON, nullable=False)  # Raw webhook payload
    headers = Column(JSON)  # HTTP headers
    signature = Column(String(255))  # For webhook validation
    
    # Processing
    status = Column(Enum(WebhookStatus), default=WebhookStatus.PENDING)
    processed_at = Column(DateTime)
    processing_time_ms = Column(Integer)
    retry_count = Column(Integer, default=0)
    
    # Error tracking
    error_message = Column(Text)
    error_details = Column(JSON)
    
    # Metadata
    source_ip = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(255))
    related_job_id = Column(String(36))  # Link to sync job if created
    
    received_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())