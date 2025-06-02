"""
Weekly Review models for O2R tracking
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from enum import Enum

from .opportunity import O2ROpportunity, HealthSignalType

class ReviewStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"

class StatusChange(str, Enum):
    IMPROVED = "improved"
    DETERIORATED = "deteriorated"
    STABLE = "stable"
    NEW = "new"

class ReviewPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ReviewOpportunity(BaseModel):
    """Opportunity with review-specific metadata"""
    
    opportunity_id: str = Field(..., description="Opportunity ID")
    opportunity: O2ROpportunity = Field(..., description="Full opportunity data")
    
    # Review-specific fields
    updated_this_week: bool = Field(..., description="Was updated this week")
    requires_attention: bool = Field(..., description="Requires immediate attention")
    status_change: StatusChange = Field(..., description="Status change from previous week")
    review_notes: str = Field(..., description="Generated review notes")
    days_since_update: int = Field(..., description="Days since last update")
    
    # Action items specific to this opportunity
    action_items: List[str] = Field(default_factory=list, description="Action items")
    blockers_resolved: List[str] = Field(default_factory=list, description="Blockers resolved this week")
    milestones_achieved: List[str] = Field(default_factory=list, description="Milestones achieved this week")
    
    # Risk assessment
    risk_level: ReviewPriority = Field(ReviewPriority.LOW, description="Risk level")
    risk_factors: List[str] = Field(default_factory=list, description="Identified risk factors")

class WeeklyReviewSummary(BaseModel):
    """Summary metrics for weekly review"""
    
    # Basic metrics
    total_opportunities: int = Field(..., description="Total opportunities")
    total_value_sgd: float = Field(..., description="Total pipeline value")
    
    # Weekly activity
    updated_this_week: int = Field(..., description="Opportunities updated this week")
    new_opportunities: int = Field(..., description="New opportunities this week")
    closed_opportunities: int = Field(..., description="Opportunities closed this week")
    
    # Health indicators
    attention_required: int = Field(..., description="Opportunities requiring attention")
    blocked_opportunities: int = Field(..., description="Blocked opportunities")
    overdue_opportunities: int = Field(..., description="Overdue opportunities")
    
    # Revenue tracking
    revenue_realized_this_week: float = Field(..., description="Revenue realized this week")
    revenue_at_risk: float = Field(..., description="Revenue at risk")
    
    # Update compliance
    update_percentage: float = Field(..., description="Percentage updated this week")
    
    # Phase distribution
    phase_distribution: Dict[str, int] = Field(default_factory=dict, description="Count by phase")
    
    # Health distribution
    health_distribution: Dict[str, int] = Field(default_factory=dict, description="Count by health signal")

class ActionItem(BaseModel):
    """Action item from weekly review"""
    
    id: Optional[str] = Field(None, description="Action item ID")
    priority: ReviewPriority = Field(..., description="Priority level")
    description: str = Field(..., description="Action description")
    owner: str = Field(..., description="Responsible person")
    opportunity_id: Optional[str] = Field(None, description="Related opportunity ID")
    due_date: Optional[date] = Field(None, description="Due date")
    status: str = Field("open", description="Action item status")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    created_by: str = Field(..., description="Created by user")

class WeeklyInsights(BaseModel):
    """Insights and recommendations from weekly review"""
    
    key_highlights: List[str] = Field(default_factory=list, description="Key positive highlights")
    concerns: List[str] = Field(default_factory=list, description="Areas of concern")
    recommendations: List[str] = Field(default_factory=list, description="Recommended actions")
    
    # Trend analysis
    trends: Dict[str, Any] = Field(default_factory=dict, description="Trend analysis")
    
    # Territory/service performance
    territory_performance: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Territory performance")
    service_performance: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Service performance")
    
    # AWS/funding analysis
    aws_performance: Dict[str, Any] = Field(default_factory=dict, description="AWS funding performance")

class WeeklyReview(BaseModel):
    """Complete weekly review data"""
    
    # Review metadata
    id: Optional[str] = Field(None, description="Review ID")
    week_of: date = Field(..., description="Week start date (Monday)")
    week_end: date = Field(..., description="Week end date (Sunday)")
    status: ReviewStatus = Field(ReviewStatus.PENDING, description="Review status")
    
    # Core data
    summary: WeeklyReviewSummary = Field(..., description="Summary metrics")
    opportunities: List[ReviewOpportunity] = Field(..., description="Opportunity details")
    action_items: List[ActionItem] = Field(..., description="Generated action items")
    insights: WeeklyInsights = Field(..., description="Insights and recommendations")
    
    # Previous week comparison
    previous_week_comparison: Optional[Dict[str, Any]] = Field(None, description="Comparison with previous week")
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.now, description="Generation timestamp")
    generated_by: str = Field("system", description="Generated by")
    reviewed_by: Optional[str] = Field(None, description="Reviewed by")
    reviewed_at: Optional[datetime] = Field(None, description="Review timestamp")
    
    # Export tracking
    email_sent: bool = Field(False, description="Email report sent")
    email_sent_at: Optional[datetime] = Field(None, description="Email sent timestamp")
    
    def get_week_boundaries(self) -> tuple[date, date]:
        """Get week start and end dates"""
        return self.week_of, self.week_end
    
    def get_opportunities_by_priority(self, priority: ReviewPriority) -> List[ReviewOpportunity]:
        """Get opportunities by risk priority"""
        return [opp for opp in self.opportunities if opp.risk_level == priority]
    
    def get_action_items_by_priority(self, priority: ReviewPriority) -> List[ActionItem]:
        """Get action items by priority"""
        return [item for item in self.action_items if item.priority == priority]
    
    def get_territory_summary(self, territory: str) -> Dict[str, Any]:
        """Get summary for specific territory"""
        territory_opps = [
            opp for opp in self.opportunities 
            if opp.opportunity.territory == territory
        ]
        
        if not territory_opps:
            return {}
        
        return {
            'count': len(territory_opps),
            'value': sum(opp.opportunity.sgd_amount for opp in territory_opps),
            'updated_this_week': sum(1 for opp in territory_opps if opp.updated_this_week),
            'attention_required': sum(1 for opp in territory_opps if opp.requires_attention),
            'avg_deal_size': sum(opp.opportunity.sgd_amount for opp in territory_opps) / len(territory_opps)
        }

class ReviewTemplate(BaseModel):
    """Template for creating weekly reviews"""
    
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    
    # Filters for opportunities to include
    territory_filter: Optional[str] = Field(None, description="Territory filter")
    service_type_filter: Optional[str] = Field(None, description="Service type filter")
    owner_filter: Optional[str] = Field(None, description="Owner filter")
    min_amount_filter: Optional[float] = Field(None, description="Minimum amount filter")
    
    # Review configuration
    include_summary: bool = Field(True, description="Include summary section")
    include_insights: bool = Field(True, description="Include insights section")
    include_action_items: bool = Field(True, description="Include action items")
    
    # Email configuration
    email_recipients: List[str] = Field(default_factory=list, description="Email recipients")
    email_subject_template: str = Field("Weekly O2R Review - {week_of}", description="Email subject template")
    
    # Automation settings
    auto_generate: bool = Field(False, description="Auto-generate weekly")
    auto_send_email: bool = Field(False, description="Auto-send email")

# Predefined review templates
DEFAULT_REVIEW_TEMPLATES = [
    ReviewTemplate(
        name="Executive Summary",
        description="High-level review for executives",
        include_summary=True,
        include_insights=True,
        include_action_items=False,
        email_subject_template="Executive O2R Summary - Week of {week_of}"
    ),
    ReviewTemplate(
        name="Sales Team Review",
        description="Detailed review for sales team",
        include_summary=True,
        include_insights=True,
        include_action_items=True,
        email_subject_template="Sales O2R Review - Week of {week_of}"
    ),
    ReviewTemplate(
        name="Territory Review",
        description="Territory-specific review template",
        include_summary=True,
        include_insights=True,
        include_action_items=True,
        email_subject_template="{territory} O2R Review - Week of {week_of}"
    )
]

class ReviewHistory(BaseModel):
    """Historical review data for trend analysis"""
    
    week_of: date = Field(..., description="Week date")
    total_opportunities: int = Field(..., description="Total opportunities")
    total_value: float = Field(..., description="Total value")
    revenue_realized: float = Field(..., description="Revenue realized")
    health_score: float = Field(..., description="Overall health score")
    update_percentage: float = Field(..., description="Update compliance percentage")
    
    @classmethod
    def from_weekly_review(cls, review: WeeklyReview) -> 'ReviewHistory':
        """Create history entry from weekly review"""
        
        # Calculate health score (simplified)
        health_dist = review.summary.health_distribution
        total_opps = review.summary.total_opportunities
        
        if total_opps > 0:
            health_score = (
                health_dist.get('green', 0) * 100 +
                health_dist.get('yellow', 0) * 60 +
                health_dist.get('red', 0) * 20 +
                health_dist.get('blocked', 0) * 10
            ) / total_opps
        else:
            health_score = 0
        
        return cls(
            week_of=review.week_of,
            total_opportunities=review.summary.total_opportunities,
            total_value=review.summary.total_value_sgd,
            revenue_realized=review.summary.revenue_realized_this_week,
            health_score=health_score,
            update_percentage=review.summary.update_percentage
        )

# Request/Response models for API
class WeeklyReviewRequest(BaseModel):
    """Request model for generating weekly review"""
    week_of: Optional[date] = Field(None, description="Week date (defaults to current week)")
    template_name: Optional[str] = Field(None, description="Review template to use")
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional filters")
    include_previous_comparison: bool = Field(True, description="Include previous week comparison")

class WeeklyReviewResponse(BaseModel):
    """Response model for weekly review"""
    review: WeeklyReview = Field(..., description="Complete review data")
    export_options: List[str] = Field(default_factory=list, description="Available export formats")
    sharing_url: Optional[str] = Field(None, description="Shareable review URL")
