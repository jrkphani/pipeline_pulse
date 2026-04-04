import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from .opportunity import DealStage


class EventType(str, enum.Enum):
    stage_change = "stage_change"
    meeting_summary = "meeting_summary"
    note = "note"
    document_uploaded = "document_uploaded"
    ai_insight = "ai_insight"


class StageEvent(Base):
    __tablename__ = "stage_events"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(Enum(EventType), nullable=False, index=True)

    # Stage change fields
    from_stage = Column(Enum(DealStage), nullable=True)
    to_stage = Column(Enum(DealStage), nullable=True)

    # Meeting summary fields
    meeting_date = Column(DateTime(timezone=True), nullable=True)
    attendees = Column(JSON, nullable=True)   # list of names/emails
    summary = Column(Text, nullable=True)
    action_items = Column(JSON, nullable=True) # list of action item strings

    # General
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="stage_events")

    def __repr__(self) -> str:
        return f"<StageEvent id={self.id} type={self.event_type} opp_id={self.opportunity_id}>"
