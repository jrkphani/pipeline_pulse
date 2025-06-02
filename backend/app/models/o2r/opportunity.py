"""
O2R Opportunity model - Enhanced opportunity tracking with phase-based lifecycle
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
from enum import Enum

class OpportunityPhase(str, Enum):
    PHASE_1 = "opportunity_to_proposal"
    PHASE_2 = "proposal_to_commitment" 
    PHASE_3 = "execution"
    PHASE_4 = "revenue_realization"

class PhaseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"

class HealthSignalType(str, Enum):
    GREEN = "green"      # On track
    YELLOW = "yellow"    # Minor delays
    RED = "red"          # Critical issues
    BLOCKED = "blocked"  # External dependency
    NEEDS_UPDATE = "needs_update"  # No update >7 days

class O2ROpportunity(BaseModel):
    """Enhanced Opportunity model with O2R tracking"""
    
    # Core CRM fields (from existing Pipeline Pulse)
    id: str = Field(..., description="Unique opportunity ID")
    zoho_id: Optional[str] = Field(None, description="Zoho CRM Record ID")
    deal_name: str = Field(..., description="Opportunity Name")
    account_name: str = Field(..., description="Account Name")
    owner: str = Field(..., description="Opportunity Owner")
    sgd_amount: float = Field(..., description="Revenue amount in SGD")
    probability: int = Field(..., description="Probability percentage")
    current_stage: str = Field(..., description="Current CRM stage")
    closing_date: date = Field(..., description="Expected closing date")
    created_date: datetime = Field(..., description="Opportunity created date")
    country: str = Field(..., description="Country")
    
    # Enhanced tracking fields (NEW from CSV mapping)
    territory: Optional[str] = Field(None, description="Business Region")
    service_type: Optional[str] = Field(None, description="Solution Type")
    funding_type: Optional[str] = Field(None, description="Type of Funding")
    market_segment: Optional[str] = Field(None, description="Market Segment")
    strategic_account: bool = Field(False, description="Strategic account flag")
    
    # O2R specific fields
    current_phase: OpportunityPhase = Field(OpportunityPhase.PHASE_1, description="Current O2R phase")
    health_signal: HealthSignalType = Field(HealthSignalType.GREEN, description="Health signal")
    health_reason: Optional[str] = Field(None, description="Reason for health signal")
    
    # Milestone dates (from CSV)
    proposal_date: Optional[date] = Field(None, description="Proposal Submission date")
    po_date: Optional[date] = Field(None, description="PO Generation Date")
    kickoff_date: Optional[date] = Field(None, description="Kick-off Date") 
    invoice_date: Optional[date] = Field(None, description="Invoice Date")
    payment_date: Optional[date] = Field(None, description="Payment Received Date")
    revenue_date: Optional[date] = Field(None, description="Revenue Recognition Date")
    
    # Tracking metadata
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    updated_by: str = Field(..., description="User who last updated")
    comments: Optional[str] = Field(None, description="Current comments")
    blockers: List[str] = Field(default_factory=list, description="Current blockers")
    action_items: List[str] = Field(default_factory=list, description="Action items")
    
    # Weekly review tracking
    updated_this_week: bool = Field(False, description="Updated in current week")
    requires_attention: bool = Field(False, description="Requires immediate attention")
    
    class Config:
        """Pydantic configuration"""
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
    
    def get_milestone_date(self, milestone_name: str) -> Optional[date]:
        """Get milestone date by name"""
        milestone_mapping = {
            'proposal_sent': self.proposal_date,
            'po_received': self.po_date,
            'kickoff_complete': self.kickoff_date,
            'invoice_raised': self.invoice_date,
            'payment_received': self.payment_date,
            'revenue_recognized': self.revenue_date
        }
        return milestone_mapping.get(milestone_name)
    
    def get_phase_progress(self) -> Dict[str, Any]:
        """Calculate phase completion progress"""
        phases = {
            OpportunityPhase.PHASE_1: {
                'name': 'Opportunity to Proposal',
                'milestones': ['deal_qualified', 'proposal_sent', 'proposal_accepted'],
                'completed': bool(self.proposal_date)
            },
            OpportunityPhase.PHASE_2: {
                'name': 'Proposal to Commitment', 
                'milestones': ['sow_initiated', 'sow_approved', 'po_received'],
                'completed': bool(self.po_date)
            },
            OpportunityPhase.PHASE_3: {
                'name': 'Execution',
                'milestones': ['kickoff_complete', 'milestones_baselined', 'execution_started'],
                'completed': bool(self.kickoff_date)
            },
            OpportunityPhase.PHASE_4: {
                'name': 'Revenue Realization',
                'milestones': ['customer_signoff', 'invoice_raised', 'payment_received', 'revenue_recognized'],
                'completed': bool(self.revenue_date)
            }
        }
        return phases
    
    def calculate_days_in_current_phase(self) -> int:
        """Calculate days spent in current phase"""
        today = date.today()
        
        if self.current_phase == OpportunityPhase.PHASE_1:
            return (today - self.created_date.date()).days
        elif self.current_phase == OpportunityPhase.PHASE_2 and self.proposal_date:
            return (today - self.proposal_date).days
        elif self.current_phase == OpportunityPhase.PHASE_3 and self.po_date:
            return (today - self.po_date).days
        elif self.current_phase == OpportunityPhase.PHASE_4 and self.kickoff_date:
            return (today - self.kickoff_date).days
        
        return 0
    
    def is_revenue_realized(self) -> bool:
        """Check if revenue has been fully realized"""
        return bool(self.revenue_date)
    
    def get_next_milestone(self) -> Optional[str]:
        """Get the next expected milestone"""
        if not self.proposal_date:
            return "proposal_sent"
        elif not self.po_date:
            return "po_received"
        elif not self.kickoff_date:
            return "kickoff_complete"
        elif not self.invoice_date:
            return "invoice_raised"
        elif not self.payment_date:
            return "payment_received"
        elif not self.revenue_date:
            return "revenue_recognized"
        else:
            return None  # All milestones complete

class O2ROpportunityCreate(BaseModel):
    """Model for creating new O2R opportunity"""
    zoho_id: Optional[str] = None
    deal_name: str
    account_name: str
    owner: str
    sgd_amount: float
    probability: int
    current_stage: str
    closing_date: date
    country: str
    territory: Optional[str] = None
    service_type: Optional[str] = None
    funding_type: Optional[str] = None
    market_segment: Optional[str] = None
    strategic_account: bool = False
    updated_by: str
    
    # Optional milestone dates
    proposal_date: Optional[date] = None
    po_date: Optional[date] = None
    kickoff_date: Optional[date] = None
    invoice_date: Optional[date] = None
    payment_date: Optional[date] = None
    revenue_date: Optional[date] = None

class O2ROpportunityUpdate(BaseModel):
    """Model for updating O2R opportunity"""
    deal_name: Optional[str] = None
    account_name: Optional[str] = None
    owner: Optional[str] = None
    sgd_amount: Optional[float] = None
    probability: Optional[int] = None
    current_stage: Optional[str] = None
    closing_date: Optional[date] = None
    country: Optional[str] = None
    territory: Optional[str] = None
    service_type: Optional[str] = None
    funding_type: Optional[str] = None
    market_segment: Optional[str] = None
    strategic_account: Optional[bool] = None
    comments: Optional[str] = None
    blockers: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    updated_by: str
    
    # Milestone date updates
    proposal_date: Optional[date] = None
    po_date: Optional[date] = None
    kickoff_date: Optional[date] = None
    invoice_date: Optional[date] = None
    payment_date: Optional[date] = None
    revenue_date: Optional[date] = None

class O2ROpportunityFilter(BaseModel):
    """Model for filtering O2R opportunities"""
    territory: Optional[str] = None
    service_type: Optional[str] = None
    funding_type: Optional[str] = None
    market_segment: Optional[str] = None
    owner: Optional[str] = None
    current_phase: Optional[OpportunityPhase] = None
    health_signal: Optional[HealthSignalType] = None
    strategic_account: Optional[bool] = None
    requires_attention: Optional[bool] = None
    updated_this_week: Optional[bool] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    closing_date_from: Optional[date] = None
    closing_date_to: Optional[date] = None
