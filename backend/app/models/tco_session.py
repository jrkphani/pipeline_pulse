from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TcoSession(Base):
    __tablename__ = "tco_sessions"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Step 1: Infrastructure inputs
    server_count = Column(Integer, nullable=True)
    vm_count = Column(Integer, nullable=True)
    storage_tb = Column(Float, nullable=True)
    network_egress_tb_month = Column(Float, nullable=True)

    # Step 2: Licence inputs
    current_licence_spend_sgd = Column(Float, nullable=True)
    migration_type = Column(String(50), nullable=True)   # Lift-Shift / Replatform / Rearchitect

    # Step 3: Services inputs
    ps_estimate_sgd = Column(Float, nullable=True)
    support_tier = Column(String(50), nullable=True)     # Developer / Business / Enterprise

    # Step 4: Computed outputs (also written back to opportunity)
    arr_sgd = Column(Float, nullable=True)
    savings_3yr_sgd = Column(Float, nullable=True)
    migration_cost_sgd = Column(Float, nullable=True)
    net_savings_3yr_sgd = Column(Float, nullable=True)
    recommended_program = Column(String(20), nullable=True)

    completed = Column(Boolean, default=False, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="tco_session")

    def __repr__(self) -> str:
        return f"<TcoSession opp_id={self.opportunity_id} completed={self.completed}>"
