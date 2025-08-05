from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from ..models.opportunity import HealthStatus, O2RPhase

# Supported currencies for validation
SUPPORTED_CURRENCIES = ["SGD", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY", "HKD", "MYR", "THB", "INR"]


class OpportunityBase(BaseModel):
    """Base opportunity schema with common fields."""
    
    name: str = Field(..., min_length=1, max_length=255, description="Opportunity name")
    amount_local: Decimal = Field(..., gt=0, decimal_places=2, description="Amount in local currency")
    local_currency: str = Field(..., pattern=r'^[A-Z]{3}$', description="ISO currency code")
    probability: int = Field(..., ge=0, le=100, description="Win probability percentage")
    phase: O2RPhase = Field(..., description="O2R phase (1-4)")
    territory_id: int = Field(..., gt=0, description="Territory ID")
    account_id: int = Field(..., gt=0, description="Account ID")
    proposal_date: Optional[datetime] = Field(None, description="Proposal milestone date")
    kickoff_date: Optional[datetime] = Field(None, description="Kickoff milestone date")
    completion_date: Optional[datetime] = Field(None, description="Completion milestone date")
    
    @validator('local_currency')
    def validate_currency_code(cls, v):
        if v not in SUPPORTED_CURRENCIES:
            raise ValueError(f'Currency {v} not supported. Supported: {", ".join(SUPPORTED_CURRENCIES)}')
        return v
    
    @validator('completion_date')
    def validate_date_sequence(cls, v, values):
        """Ensure dates are in logical sequence."""
        proposal_date = values.get('proposal_date')
        kickoff_date = values.get('kickoff_date')
        
        if proposal_date and kickoff_date and proposal_date > kickoff_date:
            raise ValueError('Proposal date cannot be after kickoff date')
        
        if kickoff_date and v and kickoff_date > v:
            raise ValueError('Kickoff date cannot be after completion date')
        
        return v


class OpportunityCreate(OpportunityBase):
    """Schema for creating opportunities."""
    pass


class OpportunityUpdate(BaseModel):
    """Schema for updating opportunities."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    amount_local: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    local_currency: Optional[str] = Field(None, pattern=r'^[A-Z]{3}$')
    probability: Optional[int] = Field(None, ge=0, le=100)
    phase: Optional[O2RPhase] = None
    health_status: Optional[HealthStatus] = None
    territory_id: Optional[int] = Field(None, gt=0)
    account_id: Optional[int] = Field(None, gt=0)
    proposal_date: Optional[datetime] = None
    kickoff_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    
    @validator('local_currency')
    def validate_currency_code(cls, v):
        if v and v not in SUPPORTED_CURRENCIES:
            raise ValueError(f'Currency {v} not supported')
        return v


class OpportunityResponse(OpportunityBase):
    """Schema for opportunity responses."""
    
    id: int
    amount_sgd: Decimal = Field(..., description="Amount converted to SGD")
    health_status: HealthStatus
    created_at: datetime
    updated_at: datetime
    created_by: int
    updated_by: int
    zoho_deal_id: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OpportunityListResponse(BaseModel):
    """Schema for paginated opportunity list responses."""
    
    opportunities: List[OpportunityResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        from_attributes = True


class BulkHealthStatusUpdate(BaseModel):
    """Schema for bulk health status updates."""
    
    opportunity_ids: List[int] = Field(..., min_items=1, max_items=100)
    health_status: HealthStatus
    
    @validator('opportunity_ids')
    def validate_opportunity_ids(cls, v):
        if len(set(v)) != len(v):
            raise ValueError('Duplicate opportunity IDs not allowed')
        return v