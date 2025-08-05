from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime
from decimal import Decimal
from ..models.opportunity import HealthStatus, O2RPhase


class DashboardMetricsSchema(BaseModel):
    """Schema for key performance indicators displayed on dashboard."""
    
    total_pipeline_value: Decimal = Field(..., description="Total value of all opportunities in pipeline (SGD)")
    total_revenue: Decimal = Field(..., description="Total revenue from closed deals (SGD)")
    deals_in_progress: int = Field(..., description="Number of active deals in pipeline")
    average_deal_size: Decimal = Field(..., description="Average deal size across all opportunities (SGD)")
    win_rate: float = Field(..., ge=0, le=1, description="Win rate percentage (0-1)")
    conversion_rate: float = Field(..., ge=0, le=1, description="Conversion rate percentage (0-1)")
    quarterly_growth: float = Field(..., description="Quarterly growth rate percentage")
    pipeline_velocity: float = Field(..., description="Pipeline velocity metric")
    team_performance: float = Field(..., description="Team performance score")
    risk_factors: int = Field(..., description="Number of deals with risk factors")
    
    class Config:
        from_attributes = True


class ChartDataPointSchema(BaseModel):
    """Generic schema for chart data points with flexible key-value pairs."""
    
    # Using Union to allow both string and numeric values for flexibility
    # This aligns with the TypeScript interface: { [key: string]: string | number }
    data: dict[str, Union[str, int, float, Decimal]] = Field(..., description="Chart data as key-value pairs")
    
    class Config:
        from_attributes = True


class PipelineChartDataSchema(BaseModel):
    """Schema for pipeline value trend chart data points."""
    
    month: str = Field(..., description="Month label (e.g., 'Jan', 'Feb')")
    pipeline: Decimal = Field(..., description="Pipeline value for the month (SGD)")
    closed: Decimal = Field(..., description="Closed deals value for the month (SGD)")
    
    class Config:
        from_attributes = True


class O2RPhaseChartDataSchema(BaseModel):
    """Schema for O2R phase distribution chart data points."""
    
    phase: str = Field(..., description="O2R phase name (e.g., 'Opportunity', 'Qualified', 'Proposal', 'Revenue')")
    deals: int = Field(..., description="Number of deals in this phase")
    value: Decimal = Field(..., description="Total value of deals in this phase (SGD)")
    
    class Config:
        from_attributes = True


class HealthChartDataSchema(BaseModel):
    """Schema for deal health trend chart data points."""
    
    date: str = Field(..., description="Date label for the data point")
    green: int = Field(..., description="Number of deals with success/green health status")
    yellow: int = Field(..., description="Number of deals with warning/yellow health status")
    red: int = Field(..., description="Number of deals with danger/red health status")
    blocked: int = Field(..., description="Number of deals with neutral/blocked health status")
    
    class Config:
        from_attributes = True


class AttentionRequiredItemSchema(BaseModel):
    """Schema for individual deals requiring attention."""
    
    id: int = Field(..., description="Opportunity ID")
    name: str = Field(..., description="Opportunity name")
    amount_sgd: Decimal = Field(..., description="Amount in SGD")
    amount_local: Decimal = Field(..., description="Amount in local currency")
    local_currency: str = Field(..., description="Local currency code")
    probability: int = Field(..., ge=0, le=100, description="Win probability percentage")
    phase: O2RPhase = Field(..., description="O2R phase")
    health_status: HealthStatus = Field(..., description="Health status")
    territory_id: int = Field(..., description="Territory ID")
    account_id: int = Field(..., description="Account ID")
    proposal_date: Optional[datetime] = Field(None, description="Proposal milestone date")
    kickoff_date: Optional[datetime] = Field(None, description="Kickoff milestone date")
    completion_date: Optional[datetime] = Field(None, description="Completion milestone date")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_by: int = Field(..., description="User ID who created the opportunity")
    updated_by: int = Field(..., description="User ID who last updated the opportunity")
    
    class Config:
        from_attributes = True


class AttentionRequiredResponseSchema(BaseModel):
    """Schema for response containing deals requiring attention."""
    
    items: List[AttentionRequiredItemSchema] = Field(..., description="List of opportunities requiring attention")
    total_count: int = Field(..., description="Total number of opportunities requiring attention")
    critical_count: int = Field(..., description="Number of opportunities with critical (danger) status")
    warning_count: int = Field(..., description="Number of opportunities with warning status")
    
    class Config:
        from_attributes = True


# Additional schemas for chart data collections
class PipelineChartResponseSchema(BaseModel):
    """Schema for pipeline chart data response."""
    
    data: List[PipelineChartDataSchema] = Field(..., description="Pipeline chart data points")
    total_months: int = Field(..., description="Total number of months in the dataset")
    
    class Config:
        from_attributes = True


class O2RPhaseChartResponseSchema(BaseModel):
    """Schema for O2R phase chart data response."""
    
    data: List[O2RPhaseChartDataSchema] = Field(..., description="O2R phase distribution data")
    total_deals: int = Field(..., description="Total number of deals across all phases")
    total_value: Decimal = Field(..., description="Total value across all phases (SGD)")
    
    class Config:
        from_attributes = True


class HealthChartResponseSchema(BaseModel):
    """Schema for health chart data response."""
    
    data: List[HealthChartDataSchema] = Field(..., description="Health trend data points")
    total_periods: int = Field(..., description="Total number of time periods in the dataset")
    current_health_summary: dict[str, int] = Field(..., description="Current health status summary")
    
    class Config:
        from_attributes = True


# Combined dashboard data response schema
class DashboardDataResponseSchema(BaseModel):
    """Schema for complete dashboard data response."""
    
    metrics: DashboardMetricsSchema = Field(..., description="Key performance indicators")
    pipeline_chart: List[PipelineChartDataSchema] = Field(..., description="Pipeline value trend data")
    o2r_phase_chart: List[O2RPhaseChartDataSchema] = Field(..., description="O2R phase distribution data")
    health_chart: List[HealthChartDataSchema] = Field(..., description="Health trend data")
    attention_required: AttentionRequiredResponseSchema = Field(..., description="Deals requiring attention")
    
    class Config:
        from_attributes = True