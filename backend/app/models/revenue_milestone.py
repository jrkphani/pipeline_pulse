import enum
from sqlalchemy import Column, Integer, Float, String, DateTime, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MilestoneStatus(str, enum.Enum):
    scheduled = "scheduled"
    invoiced = "invoiced"
    paid = "paid"
    delayed = "delayed"


class RevenueMilestone(Base):
    __tablename__ = "revenue_milestones"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_name = Column(String(255), nullable=False)
    expected_date = Column(Date, nullable=False)
    expected_amount_sgd = Column(Float, nullable=False)
    actual_amount_sgd = Column(Float, nullable=True)
    actual_date = Column(Date, nullable=True)
    status = Column(Enum(MilestoneStatus), nullable=False, default=MilestoneStatus.scheduled)
    invoice_id = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="revenue_milestones")

    def __repr__(self) -> str:
        return f"<Milestone id={self.id} opp_id={self.opportunity_id} status={self.status}>"
