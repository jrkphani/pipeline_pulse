from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class AiQResponse(Base):
    __tablename__ = "ai_q_responses"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    solution_area = Column(String(50), nullable=False, index=True)  # SAP / VMware / GenAI / Data / AMS
    question_id = Column(String(100), nullable=False)
    question_text = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    is_positive_signal = Column(Boolean, nullable=True)  # True = pain confirmed, None = unanswered
    answered_at = Column(DateTime(timezone=True), nullable=True)
    answered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="ai_q_responses")

    def __repr__(self) -> str:
        return f"<AiQResponse id={self.id} area={self.solution_area} q={self.question_id}>"
