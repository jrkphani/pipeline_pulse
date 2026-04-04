import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class LeadStatus(str, enum.Enum):
    contacted = "contacted"
    engaged = "engaged"
    mql_ready = "mql_ready"
    graduated = "graduated"    # Converted to opportunity
    disqualified = "disqualified"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    status = Column(Enum(LeadStatus), nullable=False, default=LeadStatus.contacted, index=True)
    icp_score = Column(Integer, nullable=True)        # 1–5 ICP score
    q_tree_completion = Column(Float, nullable=True)  # 0.0–1.0 completion %
    source = Column(String(100), nullable=True)       # Inbound / Outbound / Referral / Event
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True)
    graduated_opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=True)
    first_contacted_at = Column(DateTime(timezone=True), nullable=True)
    graduated_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="owned_leads")

    def __repr__(self) -> str:
        return f"<Lead id={self.id} company={self.company_name!r} status={self.status}>"
