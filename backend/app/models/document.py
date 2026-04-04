import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class DocumentType(str, enum.Enum):
    sow = "sow"              # Statement of Work
    po = "po"                # Purchase Order
    handover = "handover"    # Project handover doc
    call_notes = "call_notes"
    proposal = "proposal"
    other = "other"


class ExtractionStatus(str, enum.Enum):
    pending = "pending"
    ocr_running = "ocr_running"       # Stage 1: Textract
    extracting = "extracting"          # Stage 2: Bedrock
    review = "review"                  # Stage 3: Human review
    accepted = "accepted"              # Stage 4: Saved to deal
    rejected = "rejected"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(Enum(DocumentType), nullable=False, default=DocumentType.other)
    original_filename = Column(String(255), nullable=False)
    s3_key = Column(String(512), nullable=False, unique=True)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    # AI pipeline state
    extraction_status = Column(Enum(ExtractionStatus), nullable=False, default=ExtractionStatus.pending, index=True)
    textract_job_id = Column(String(255), nullable=True)
    extracted_fields = Column(JSON, nullable=True)    # field_name → {value, confidence}
    confidence_score = Column(Float, nullable=True)   # overall confidence 0.0–1.0

    # Audit
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    extraction_completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document id={self.id} type={self.document_type} status={self.extraction_status}>"
