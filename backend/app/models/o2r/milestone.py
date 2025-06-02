"""
Milestone model for O2R tracking
"""

from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
from enum import Enum

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    BLOCKED = "blocked"

class MilestoneSource(str, Enum):
    CSV_FIELD = "csv_field"
    MANUAL = "manual"
    CALCULATED = "calculated"
    STAGE_PROGRESSION = "stage_progression"

class Milestone(BaseModel):
    """Individual milestone within O2R phases"""
    
    id: Optional[str] = Field(None, description="Unique milestone ID")
    name: str = Field(..., description="Milestone name")
    phase_number: int = Field(..., description="Parent phase number (1-4)")
    sequence: int = Field(..., description="Sequence within phase")
    
    # Dates
    baseline_date: Optional[date] = Field(None, description="Planned completion date")
    actual_date: Optional[date] = Field(None, description="Actual completion date")
    
    # Status and ownership
    status: MilestoneStatus = Field(MilestoneStatus.PENDING, description="Current status")
    owner: str = Field(..., description="Responsible person")
    
    # Source tracking
    source: MilestoneSource = Field(MilestoneSource.MANUAL, description="Data source")
    csv_field: Optional[str] = Field(None, description="Source CSV field if applicable")
    
    # Additional info
    description: Optional[str] = Field(None, description="Milestone description")
    notes: Optional[str] = Field(None, description="Additional notes")
    blockers: list[str] = Field(default_factory=list, description="Current blockers")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    updated_by: str = Field(..., description="User who last updated")
    
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
    
    def days_until_due(self) -> Optional[int]:
        """Calculate days until due date (negative if overdue)"""
        if not self.baseline_date:
            return None
        return (self.baseline_date - date.today()).days
    
    def duration_to_complete(self) -> Optional[int]:
        """Calculate days taken to complete (if completed)"""
        if self.status != MilestoneStatus.COMPLETED or not self.actual_date:
            return None
        
        # Use baseline date as start, or creation date if no baseline
        start_date = self.baseline_date or self.created_at.date()
        return (self.actual_date - start_date).days
    
    def is_on_time(self) -> bool:
        """Check if milestone was completed on time"""
        if self.status != MilestoneStatus.COMPLETED:
            return not self.is_overdue()  # For pending milestones
        
        if not self.baseline_date or not self.actual_date:
            return True  # Cannot determine without dates
        
        return self.actual_date <= self.baseline_date
    
    def update_status(self, updated_by: str) -> None:
        """Update milestone status based on current state"""
        self.updated_at = datetime.now()
        self.updated_by = updated_by
        
        if self.actual_date:
            self.status = MilestoneStatus.COMPLETED
        elif self.blockers:
            self.status = MilestoneStatus.BLOCKED
        elif self.is_overdue():
            self.status = MilestoneStatus.OVERDUE
        else:
            self.status = MilestoneStatus.PENDING

class MilestoneTemplate(BaseModel):
    """Template for creating standard milestones"""
    
    name: str = Field(..., description="Milestone name")
    phase_number: int = Field(..., description="Phase number (1-4)")
    sequence: int = Field(..., description="Sequence within phase")
    description: str = Field(..., description="Milestone description")
    source: MilestoneSource = Field(..., description="Expected data source")
    csv_field: Optional[str] = Field(None, description="CSV field mapping")
    default_owner: str = Field("TBD", description="Default owner")
    
    def create_milestone(self, owner: str = None, updated_by: str = "system") -> Milestone:
        """Create milestone from template"""
        return Milestone(
            name=self.name,
            phase_number=self.phase_number,
            sequence=self.sequence,
            description=self.description,
            source=self.source,
            csv_field=self.csv_field,
            owner=owner or self.default_owner,
            updated_by=updated_by
        )

# Standard milestone templates for O2R phases
MILESTONE_TEMPLATES = [
    # Phase 1: Opportunity to Proposal
    MilestoneTemplate(
        name="Deal Qualified",
        phase_number=1,
        sequence=1,
        description="Opportunity meets qualification criteria and is ready for proposal",
        source=MilestoneSource.CSV_FIELD,
        csv_field="Created Time",
        default_owner="Sales Team"
    ),
    MilestoneTemplate(
        name="Proposal Sent",
        phase_number=1,
        sequence=2,
        description="Proposal submitted to customer for review",
        source=MilestoneSource.CSV_FIELD,
        csv_field="Proposal Submission date",
        default_owner="Sales Team"
    ),
    MilestoneTemplate(
        name="Proposal Accepted",
        phase_number=1,
        sequence=3,
        description="Customer accepts proposal and moves to contracting",
        source=MilestoneSource.STAGE_PROGRESSION,
        default_owner="Sales Team"
    ),
    
    # Phase 2: Proposal to Commitment
    MilestoneTemplate(
        name="SOW Initiated",
        phase_number=2,
        sequence=1,
        description="Statement of Work preparation started",
        source=MilestoneSource.CALCULATED,
        default_owner="Sales Team"
    ),
    MilestoneTemplate(
        name="SOW Approved",
        phase_number=2,
        sequence=2,
        description="Statement of Work approved by customer",
        source=MilestoneSource.STAGE_PROGRESSION,
        default_owner="Sales Team"
    ),
    MilestoneTemplate(
        name="PO Received",
        phase_number=2,
        sequence=3,
        description="Purchase Order received from customer",
        source=MilestoneSource.CSV_FIELD,
        csv_field="PO Generation Date",
        default_owner="Sales Team"
    ),
    
    # Phase 3: Execution
    MilestoneTemplate(
        name="Kickoff Complete",
        phase_number=3,
        sequence=1,
        description="Project kickoff meeting completed with customer",
        source=MilestoneSource.CSV_FIELD,
        csv_field="Kick-off Date",
        default_owner="Delivery Team"
    ),
    MilestoneTemplate(
        name="Milestones Baselined",
        phase_number=3,
        sequence=2,
        description="Project milestones and timeline established",
        source=MilestoneSource.CALCULATED,
        default_owner="Delivery Team"
    ),
    MilestoneTemplate(
        name="Execution Started",
        phase_number=3,
        sequence=3,
        description="Active project execution commenced",
        source=MilestoneSource.CSV_FIELD,
        csv_field="Kick-off Date",
        default_owner="Delivery Team"
    ),
    
    # Phase 4: Revenue Realization
    MilestoneTemplate(
        name="Customer Signoff",
        phase_number=4,
        sequence=1,
        description="Customer accepts deliverables and signs off",
        source=MilestoneSource.STAGE_PROGRESSION,
        default_owner="Delivery Team"
    ),
    MilestoneTemplate(
        name="Invoice Raised",
        phase_number=4,
        sequence=2,
        description="Invoice sent to customer for payment",
        source=MilestoneSource.CSV_FIELD,
        csv_field="Invoice Date",
        default_owner="Finance Team"
    ),
    MilestoneTemplate(
        name="Payment Received",
        phase_number=4,
        sequence=3,
        description="Payment received from customer",
        source=MilestoneSource.CSV_FIELD,
        csv_field="Received On",
        default_owner="Finance Team"
    ),
    MilestoneTemplate(
        name="Revenue Recognized",
        phase_number=4,
        sequence=4,
        description="Revenue formally recognized in financial books",
        source=MilestoneSource.CSV_FIELD,
        csv_field="OB Recognition Date",
        default_owner="Finance Team"
    )
]

def get_milestones_for_phase(phase_number: int) -> list[MilestoneTemplate]:
    """Get milestone templates for specific phase"""
    return [template for template in MILESTONE_TEMPLATES if template.phase_number == phase_number]

def create_default_milestones(phase_number: int, owner: str = None, updated_by: str = "system") -> list[Milestone]:
    """Create default milestones for a phase"""
    templates = get_milestones_for_phase(phase_number)
    milestones = []
    
    for template in templates:
        milestone = template.create_milestone(owner=owner, updated_by=updated_by)
        milestones.append(milestone)
    
    return milestones

class MilestoneUpdate(BaseModel):
    """Model for updating milestone"""
    baseline_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: Optional[MilestoneStatus] = None
    owner: Optional[str] = None
    notes: Optional[str] = None
    blockers: Optional[list[str]] = None
    updated_by: str = Field(..., description="User making the update")

class MilestoneCreate(BaseModel):
    """Model for creating new milestone"""
    name: str
    phase_number: int
    sequence: int
    baseline_date: Optional[date] = None
    owner: str
    description: Optional[str] = None
    source: MilestoneSource = MilestoneSource.MANUAL
    csv_field: Optional[str] = None
    updated_by: str
