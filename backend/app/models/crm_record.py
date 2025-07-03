"""
CRM Record models for incremental update tracking
"""

from sqlalchemy import Column, String, Boolean, Date, DateTime, Text, Integer, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class CrmRecord(Base):
    """Individual CRM record with change tracking"""
    
    __tablename__ = "crm_records"
    
    record_id = Column(String(50), primary_key=True, index=True)  # CRM Record ID
    # analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)  # Removed - Analysis table deprecated
    current_data = Column(JSON, nullable=True)  # Latest record data
    is_active = Column(Boolean, default=True, nullable=False)  # False if removed from CRM
    first_seen_date = Column(Date, nullable=True)  # First import date
    last_seen_date = Column(Date, nullable=True)  # Last seen in import
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # analysis = relationship("Analysis", back_populates="crm_records")  # Removed - Analysis table deprecated
    history = relationship("CrmRecordHistory", back_populates="record", cascade="all, delete-orphan")
    alerts = relationship("DataQualityAlert", back_populates="record", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CrmRecord(record_id={self.record_id}, active={self.is_active})>"


class CrmRecordHistory(Base):
    """Historical changes to business-critical fields"""
    
    __tablename__ = "crm_record_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    record_id = Column(String(50), ForeignKey("crm_records.record_id", ondelete="CASCADE"), nullable=False)
    # analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)  # Removed - Analysis table deprecated
    field_name = Column(String(50), nullable=False, index=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    change_date = Column(Date, nullable=False, index=True)
    import_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    record = relationship("CrmRecord", back_populates="history")
    # analysis = relationship("Analysis")  # Removed - Analysis table deprecated
    
    def __repr__(self):
        return f"<CrmRecordHistory(record_id={self.record_id}, field={self.field_name})>"


class DataQualityAlert(Base):
    """Data quality alerts and anomalies"""
    
    __tablename__ = "data_quality_alerts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    record_id = Column(String(50), ForeignKey("crm_records.record_id", ondelete="CASCADE"), nullable=False)
    # analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)  # Removed - Analysis table deprecated
    alert_type = Column(String(50), nullable=False, index=True)  # 'amount_spike', 'stage_regression', etc.
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default='medium', index=True)  # 'low', 'medium', 'high'
    is_resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    record = relationship("CrmRecord", back_populates="alerts")
    # analysis = relationship("Analysis")  # Removed - Analysis table deprecated
    
    def __repr__(self):
        return f"<DataQualityAlert(type={self.alert_type}, severity={self.severity})>"


class DataQualityConfig(Base):
    """Configuration for data quality thresholds"""
    
    __tablename__ = "data_quality_config"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    config_key = Column(String(100), nullable=False, unique=True, index=True)
    config_value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<DataQualityConfig(key={self.config_key})>"
