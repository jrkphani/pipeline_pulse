from sqlalchemy import Column, Integer, Float, String, DateTime, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from .opportunity import DealStage


class OpportunitySnapshot(Base):
    """Weekly point-in-time snapshot for temporal intelligence and trend analysis."""
    __tablename__ = "opportunity_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    stage = Column(Enum(DealStage), nullable=False)
    deal_value_sgd = Column(Float, nullable=False)
    days_in_current_stage = Column(Integer, nullable=False, default=0)
    iat_score = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="snapshots")

    def __repr__(self) -> str:
        return f"<Snapshot opp_id={self.opportunity_id} date={self.snapshot_date} stage={self.stage}>"
