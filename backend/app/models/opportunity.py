from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, CheckConstraint, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base


class HealthStatus(enum.Enum):
    SUCCESS = "success"
    WARNING = "warning"
    DANGER = "danger"
    NEUTRAL = "neutral"


class O2RPhase(enum.Enum):
    OPPORTUNITY = 1
    QUALIFIED = 2
    PROPOSAL = 3
    REVENUE = 4


class Opportunity(Base):
    """Opportunity model for Pipeline Pulse."""
    
    __tablename__ = "opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    
    # Financial information
    amount_local = Column(Numeric(15, 2), nullable=False)
    amount_sgd = Column(Numeric(15, 2), nullable=False)
    local_currency = Column(String(3), nullable=False)
    probability = Column(Integer, nullable=False)
    
    # O2R Phase and Health
    o2r_phase = Column(Enum(O2RPhase), nullable=False, default=O2RPhase.OPPORTUNITY)
    health_status = Column(Enum(HealthStatus), nullable=False, default=HealthStatus.NEUTRAL)
    
    # Relationships
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    # Milestone dates
    proposal_date = Column(DateTime, nullable=True)
    kickoff_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Zoho CRM integration
    zoho_deal_id = Column(String(50), nullable=True, unique=True, index=True)
    last_synced_at = Column(DateTime, nullable=True)
    
    # Relationships
    territory = relationship("Territory", back_populates="opportunities")
    account = relationship("Account", back_populates="opportunities")
    created_by_user = relationship("User", foreign_keys=[created_by])
    updated_by_user = relationship("User", foreign_keys=[updated_by])
    
    # Constraints
    __table_args__ = (
        CheckConstraint('amount_local > 0', name='chk_opportunity_amount_local_positive'),
        CheckConstraint('amount_sgd > 0', name='chk_opportunity_amount_sgd_positive'),
        CheckConstraint('probability >= 0 AND probability <= 100', name='chk_opportunity_probability_range'),
        CheckConstraint('local_currency ~ \'^[A-Z]{3}$\'', name='chk_opportunity_currency_format'),
        CheckConstraint('name ~ \'^.+$\'', name='chk_opportunity_name_not_empty'),
        CheckConstraint('updated_at >= created_at', name='chk_opportunity_timestamps'),
    )
    
    def __repr__(self) -> str:
        return f"<Opportunity(id={self.id}, name='{self.name}', amount_sgd={self.amount_sgd})>"