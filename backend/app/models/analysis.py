"""
Analysis model for storing uploaded data and results
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Analysis(Base):
    """Analysis model for storing CSV upload results"""

    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)  # Original filename from user
    file_path = Column(String, nullable=False)  # Path to stored file
    file_size = Column(Integer, default=0)  # File size in bytes
    file_hash = Column(String, nullable=False)  # SHA256 hash for duplicate detection
    total_deals = Column(Integer, default=0)
    processed_deals = Column(Integer, default=0)
    total_value = Column(Float, default=0.0)
    data = Column(Text)  # JSON string of processed data
    is_latest = Column(Boolean, default=True)  # Flag to mark the latest analysis

    # Incremental update tracking
    export_date = Column(Date, nullable=True)  # Date when data was exported from CRM
    import_type = Column(String(20), nullable=True, default='new_dataset')  # 'new_dataset', 'incremental_update'
    records_added = Column(Integer, default=0)  # New records in this import
    records_updated = Column(Integer, default=0)  # Updated records in this import
    records_removed = Column(Integer, default=0)  # Records removed/deactivated
    parent_analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=True)  # Previous analysis if incremental

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    crm_records = relationship("CrmRecord", back_populates="analysis", cascade="all, delete-orphan")
    parent_analysis = relationship("Analysis", remote_side=[id], backref="child_analyses")

    def __repr__(self):
        return f"<Analysis(id={self.id}, filename={self.filename}, type={self.import_type})>"
