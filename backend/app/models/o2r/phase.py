"""
Phase and Milestone models for O2R tracking
"""

from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from enum import Enum

class PhaseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    BLOCKED = "blocked"

class Milestone(BaseModel):
    """Individual milestone within a phase"""
    name: str = Field(..., description="Milestone name")
    baseline_date: Optional[date] = Field(None, description="Planned completion date")
    actual_date: Optional[date] = Field(None, description="Actual completion date")
    status: MilestoneStatus = Field(MilestoneStatus.PENDING, description="Current status")
    owner: str = Field(..., description="Responsible person")
    source: str = Field("manual", description="Data source (CSV field or manual)")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    def is_overdue(self) -> bool:
        """Check if milestone is overdue"""
        if self.status == MilestoneStatus.COMPLETED:
            return False
        if not self.baseline_date:
            return False
        return date.today() > self.baseline_date
    
    def days_overdue(self) -> int:
        """Calculate days overdue (0 if not overdue)"""
        if not self.is_overdue():
            return 0
        return (date.today() - self.baseline_date).days

class PhaseDetails(BaseModel):
    """Details for a specific O2R phase"""
    name: str = Field(..., description="Phase name")
    status: PhaseStatus = Field(PhaseStatus.NOT_STARTED, description="Phase status")
    owner: str = Field(..., description="Phase owner")
    start_date: Optional[date] = Field(None, description="Phase start date")
    completed_date: Optional[date] = Field(None, description="Phase completion date")
    milestones: List[Milestone] = Field(default_factory=list, description="Phase milestones")
    blockers: List[str] = Field(default_factory=list, description="Current blockers")
    comments: Optional[str] = Field(None, description="Phase comments")
    
    def get_completion_percentage(self) -> float:
        """Calculate phase completion percentage"""
        if not self.milestones:
            return 0.0
        
        completed_milestones = sum(1 for m in self.milestones if m.status == MilestoneStatus.COMPLETED)
        return (completed_milestones / len(self.milestones)) * 100
    
    def get_next_milestone(self) -> Optional[Milestone]:
        """Get next pending milestone"""
        pending_milestones = [m for m in self.milestones if m.status == MilestoneStatus.PENDING]
        if not pending_milestones:
            return None
        
        # Return milestone with earliest baseline date
        return min(pending_milestones, key=lambda x: x.baseline_date or date.max)
    
    def get_overdue_milestones(self) -> List[Milestone]:
        """Get all overdue milestones"""
        return [m for m in self.milestones if m.is_overdue()]

class Phase(BaseModel):
    """Complete phase configuration"""
    phase_number: int = Field(..., description="Phase number (1-4)")
    name: str = Field(..., description="Phase name")
    description: str = Field(..., description="Phase description")
    default_milestones: List[str] = Field(..., description="Default milestone names")
    
    @classmethod
    def get_default_phases(cls) -> List['Phase']:
        """Get default O2R phase definitions"""
        return [
            Phase(
                phase_number=1,
                name="Opportunity to Proposal",
                description="From deal qualification to proposal acceptance",
                default_milestones=[
                    "Deal Qualified",
                    "Proposal Sent", 
                    "Proposal Accepted"
                ]
            ),
            Phase(
                phase_number=2,
                name="Proposal to Commitment",
                description="From proposal acceptance to PO receipt",
                default_milestones=[
                    "SOW Initiated",
                    "SOW Approved",
                    "PO Received"
                ]
            ),
            Phase(
                phase_number=3,
                name="Execution",
                description="From kickoff to delivery completion",
                default_milestones=[
                    "Kickoff Complete",
                    "Milestones Baselined",
                    "Execution Started"
                ]
            ),
            Phase(
                phase_number=4,
                name="Revenue Realization",
                description="From delivery to revenue recognition",
                default_milestones=[
                    "Customer Signoff",
                    "Invoice Raised",
                    "Payment Received",
                    "Revenue Recognized"
                ]
            )
        ]

# Milestone templates for each phase
PHASE_MILESTONE_TEMPLATES = {
    1: {  # Phase 1: Opportunity to Proposal
        "Deal Qualified": {
            "source": "created_time",
            "description": "Opportunity meets qualification criteria"
        },
        "Proposal Sent": {
            "source": "proposal_submission_date",
            "description": "Proposal submitted to customer"
        },
        "Proposal Accepted": {
            "source": "stage_progression", 
            "description": "Customer accepts proposal"
        }
    },
    2: {  # Phase 2: Proposal to Commitment
        "SOW Initiated": {
            "source": "estimated",
            "description": "Statement of Work preparation started"
        },
        "SOW Approved": {
            "source": "stage_progression",
            "description": "Statement of Work approved by customer"
        },
        "PO Received": {
            "source": "po_generation_date",
            "description": "Purchase Order received from customer"
        }
    },
    3: {  # Phase 3: Execution
        "Kickoff Complete": {
            "source": "kick_off_date",
            "description": "Project kickoff meeting completed"
        },
        "Milestones Baselined": {
            "source": "calculated",
            "description": "Project milestones and timeline established"
        },
        "Execution Started": {
            "source": "kick_off_date",
            "description": "Active project execution commenced"
        }
    },
    4: {  # Phase 4: Revenue Realization
        "Customer Signoff": {
            "source": "stage_progression",
            "description": "Customer accepts deliverables"
        },
        "Invoice Raised": {
            "source": "invoice_date",
            "description": "Invoice sent to customer"
        },
        "Payment Received": {
            "source": "received_on",
            "description": "Payment received from customer"
        },
        "Revenue Recognized": {
            "source": "ob_recognition_date",
            "description": "Revenue formally recognized in books"
        }
    }
}

def create_default_milestones(phase_number: int, owner: str = "TBD") -> List[Milestone]:
    """Create default milestones for a phase"""
    milestones = []
    
    if phase_number in PHASE_MILESTONE_TEMPLATES:
        for milestone_name, config in PHASE_MILESTONE_TEMPLATES[phase_number].items():
            milestone = Milestone(
                name=milestone_name,
                owner=owner,
                source=config["source"],
                notes=config["description"]
            )
            milestones.append(milestone)
    
    return milestones

def create_phase_details(phase_number: int, owner: str = "TBD") -> PhaseDetails:
    """Create default phase details"""
    phases = Phase.get_default_phases()
    phase_config = next((p for p in phases if p.phase_number == phase_number), None)
    
    if not phase_config:
        raise ValueError(f"Invalid phase number: {phase_number}")
    
    milestones = create_default_milestones(phase_number, owner)
    
    return PhaseDetails(
        name=phase_config.name,
        owner=owner,
        milestones=milestones
    )
