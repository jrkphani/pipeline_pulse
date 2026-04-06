import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    Date, Enum, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class DealStage(str, enum.Enum):
    new_hunt = "new_hunt"          # Stage 1
    discovery = "discovery"         # Stage 2
    proposal = "proposal"           # Stage 3
    negotiation = "negotiation"     # Stage 4
    order_book = "order_book"       # Stage 5


class FundingType(str, enum.Enum):
    customer = "customer"
    aws = "aws"
    dual = "dual"


class Program(str, enum.Enum):
    map = "MAP"
    mmp = "MMP"
    poc = "POC"
    none = "none"


class GtmMotion(str, enum.Enum):
    migration = "migration"
    modernisation = "modernisation"
    new_workload = "new_workload"
    managed_services = "managed_services"
    genai = "genai"


class SolutionArea(str, enum.Enum):
    sap = "SAP"
    vmware = "VMware"
    genai = "GenAI"
    data = "Data"
    ams = "AMS"


class FitStatus(str, enum.Enum):
    fit = "Fit"
    partial_fit = "Partial Fit"
    no_fit = "No Fit"
    not_evaluated = "Not Evaluated"


class O2RPhase(str, enum.Enum):
    phase_1 = "1"   # Opportunity
    phase_2 = "2"   # Proposal
    phase_3 = "3"   # Order Book
    phase_4 = "4"   # Revenue


class HealthStatus(str, enum.Enum):
    green = "green"
    amber = "amber"
    red = "red"
    unknown = "unknown"


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)

    # Core identifiers
    name = Column(String(255), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Relay race — dynamic custodianship
    custodian_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Stage
    stage = Column(Enum(DealStage), nullable=False, default=DealStage.new_hunt, index=True)
    stage_entered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Deal value (multi-currency)
    deal_value = Column(Float, nullable=False, default=0.0)    # original currency
    deal_value_sgd = Column(Float, nullable=False, default=0.0) # SGD equivalent
    currency_code = Column(String(3), nullable=False, default="SGD")

    # Classification
    funding_type = Column(Enum(FundingType), nullable=False, default=FundingType.customer)
    program = Column(Enum(Program), nullable=False, default=Program.none)
    gtm_motion = Column(Enum(GtmMotion), nullable=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True)
    solution_area = Column(Enum(SolutionArea), nullable=True)

    # AWS APN / ACE fields
    ace_id = Column(String(100), nullable=True, index=True)   # ACE opportunity ID
    map_status = Column(String(50), nullable=True)            # MAP approval status

    # Dates
    expected_close_date = Column(Date, nullable=True)
    po_received_date = Column(Date, nullable=True)

    # PO / order details
    po_id = Column(String(100), nullable=True, index=True)
    po_value_sgd = Column(Float, nullable=True)

    # IAT qualification fields
    iat_score = Column(Integer, nullable=True)                 # 0–100 IAT score
    iat_qualified = Column(Boolean, nullable=True)
    iat_notes = Column(Text, nullable=True)

    # AI: Solution Fit (read-only, computed by AI)
    fit_status = Column(Enum(FitStatus), nullable=False, default=FitStatus.not_evaluated)
    fit_confidence = Column(String(20), nullable=True)        # High / Medium / Low
    fit_areas_matched = Column(Integer, nullable=True)
    fit_signals_confirmed = Column(Integer, nullable=True)
    fit_last_evaluated_at = Column(DateTime(timezone=True), nullable=True)

    # AI: TCO Creator (read-only, computed from TCO session)
    tco_arr_sgd = Column(Float, nullable=True)
    tco_3yr_savings = Column(Float, nullable=True)
    tco_current_infra_cost = Column(Float, nullable=True)
    tco_migration_cost_est = Column(Float, nullable=True)
    tco_net_savings_3yr = Column(Float, nullable=True)
    tco_recommended_program = Column(String(20), nullable=True)

    # Proposal / SOW generation
    proposal_unlocked = Column(Boolean, default=False, nullable=False)
    proposal_status = Column(String(50), nullable=True)       # Draft / Approved / Sent
    cro_approval_required = Column(Boolean, default=False, nullable=False)
    cro_approval_granted = Column(Boolean, nullable=True)

    # Notes
    notes = Column(Text, nullable=True)
    next_action = Column(Text, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    account = relationship("Account", back_populates="opportunities")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_opportunities")
    custodian = relationship("User", foreign_keys=[custodian_id], back_populates="custodian_opportunities")
    snapshots = relationship("OpportunitySnapshot", back_populates="opportunity", cascade="all, delete-orphan")
    stage_events = relationship("StageEvent", back_populates="opportunity", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="opportunity", cascade="all, delete-orphan")
    revenue_milestones = relationship("RevenueMilestone", back_populates="opportunity", cascade="all, delete-orphan")
    tco_session = relationship("TcoSession", back_populates="opportunity", uselist=False)
    ai_q_responses = relationship("AiQResponse", back_populates="opportunity", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Opportunity id={self.id} name={self.name!r} stage={self.stage}>"
