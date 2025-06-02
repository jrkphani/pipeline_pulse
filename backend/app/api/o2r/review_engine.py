"""
Weekly Review Engine - Automated weekly review preparation and analysis
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from dataclasses import dataclass
from enum import Enum

from app.models.o2r.opportunity import O2ROpportunity, OpportunityPhase, HealthSignalType
from app.models.o2r.health import HealthSignalEngine

@dataclass
class ReviewOpportunity:
    """Opportunity with review-specific metadata"""
    opportunity: O2ROpportunity
    updated_this_week: bool
    requires_attention: bool
    status_change: str  # 'improved', 'deteriorated', 'stable'
    review_notes: str
    days_since_update: int
    
class StatusChange(str, Enum):
    IMPROVED = "improved"
    DETERIORATED = "deteriorated"
    STABLE = "stable"
    NEW = "new"

@dataclass
class WeeklyReviewSummary:
    """Summary metrics for weekly review"""
    total_opportunities: int
    total_value_sgd: float
    updated_this_week: int
    attention_required: int
    revenue_realized_this_week: float
    new_opportunities: int
    blocked_opportunities: int
    overdue_opportunities: int
    
class ActionItem:
    """Action item for weekly review"""
    def __init__(self, priority: str, description: str, owner: str, opportunity_id: Optional[str] = None):
        self.priority = priority  # 'High', 'Medium', 'Low'
        self.description = description
        self.owner = owner
        self.opportunity_id = opportunity_id
        self.created_date = datetime.now()

class WeeklyReviewEngine:
    """Engine for generating comprehensive weekly reviews"""
    
    def __init__(self):
        self.health_engine = HealthSignalEngine()
    
    def prepare_weekly_review(self, opportunities: List[O2ROpportunity], week_of: date) -> Dict[str, Any]:
        """Prepare comprehensive weekly review"""
        
        # Calculate week boundaries
        week_start = self._get_week_start(week_of)
        week_end = week_start + timedelta(days=6)
        
        # Analyze each opportunity for review
        review_opportunities = []
        for opp in opportunities:
            review_opp = self._analyze_opportunity_for_review(opp, week_start)
            review_opportunities.append(review_opp)
        
        # Generate summary metrics
        summary = self._generate_review_summary(review_opportunities, week_start)
        
        # Identify action items
        action_items = self._generate_action_items(review_opportunities)
        
        # Create insights and recommendations
        insights = self._generate_insights(review_opportunities, summary)
        
        return {
            'week_of': week_start.isoformat(),
            'week_end': week_end.isoformat(),
            'summary': summary.__dict__,
            'opportunities': [self._serialize_review_opportunity(ro) for ro in review_opportunities],
            'action_items': [self._serialize_action_item(ai) for ai in action_items],
            'insights': insights,
            'generated_at': datetime.now().isoformat()
        }
    
    def _get_week_start(self, date_input: date) -> date:
        """Get Monday of the week containing the given date"""
        days_since_monday = date_input.weekday()
        return date_input - timedelta(days=days_since_monday)
    
    def _analyze_opportunity_for_review(self, opp: O2ROpportunity, week_start: date) -> ReviewOpportunity:
        """Analyze individual opportunity for weekly review"""
        
        # Check if updated this week
        updated_this_week = self._was_updated_this_week(opp, week_start)
        
        # Check if requires attention
        health_signal = self.health_engine.calculate_health_signal(opp)
        requires_attention = health_signal.signal in [HealthSignalType.RED, HealthSignalType.BLOCKED]
        
        # Calculate days since update
        days_since_update = (datetime.now() - opp.last_updated).days
        
        # Determine status change (simplified - would need historical data in real implementation)
        status_change = self._calculate_status_change(opp, week_start)
        
        # Generate review notes
        review_notes = self._generate_review_notes(opp, health_signal, updated_this_week)
        
        return ReviewOpportunity(
            opportunity=opp,
            updated_this_week=updated_this_week,
            requires_attention=requires_attention,
            status_change=status_change,
            review_notes=review_notes,
            days_since_update=days_since_update
        )
    
    def _was_updated_this_week(self, opp: O2ROpportunity, week_start: date) -> bool:
        """Check if opportunity was updated this week"""
        return opp.last_updated.date() >= week_start
    
    def _calculate_status_change(self, opp: O2ROpportunity, week_start: date) -> str:
        """Calculate status change (simplified without historical data)"""
        
        # In real implementation, would compare with previous week's data
        # For now, use simple heuristics
        
        if opp.created_date.date() >= week_start:
            return StatusChange.NEW
        
        # Check for recent milestone completions
        recent_milestones = 0
        if opp.proposal_date and opp.proposal_date >= week_start:
            recent_milestones += 1
        if opp.po_date and opp.po_date >= week_start:
            recent_milestones += 1
        if opp.kickoff_date and opp.kickoff_date >= week_start:
            recent_milestones += 1
        if opp.invoice_date and opp.invoice_date >= week_start:
            recent_milestones += 1
        if opp.payment_date and opp.payment_date >= week_start:
            recent_milestones += 1
        if opp.revenue_date and opp.revenue_date >= week_start:
            recent_milestones += 1
        
        if recent_milestones > 0:
            return StatusChange.IMPROVED
        elif opp.health_signal in [HealthSignalType.RED, HealthSignalType.BLOCKED]:
            return StatusChange.DETERIORATED
        else:
            return StatusChange.STABLE
    
    def _generate_review_notes(self, opp: O2ROpportunity, health_signal, updated_this_week: bool) -> str:
        """Generate review notes for opportunity"""
        
        notes = []
        
        # Health status
        if health_signal.signal == HealthSignalType.GREEN:
            notes.append("✅ On track")
        elif health_signal.signal == HealthSignalType.YELLOW:
            notes.append(f"⚠️ {health_signal.reason}")
        elif health_signal.signal == HealthSignalType.RED:
            notes.append(f"🔴 CRITICAL: {health_signal.reason}")
        elif health_signal.signal == HealthSignalType.BLOCKED:
            notes.append(f"🚧 BLOCKED: {health_signal.reason}")
        elif health_signal.signal == HealthSignalType.NEEDS_UPDATE:
            notes.append(f"📋 {health_signal.reason}")
        
        # Update status
        if not updated_this_week:
            notes.append("❌ Not updated this week")
        else:
            notes.append("✅ Updated this week")
        
        # Next milestone
        next_milestone = opp.get_next_milestone()
        if next_milestone:
            milestone_map = {
                'proposal_sent': 'Send proposal',
                'po_received': 'Follow up on PO',
                'kickoff_complete': 'Schedule kickoff',
                'invoice_raised': 'Prepare invoice',
                'payment_received': 'Follow up payment',
                'revenue_recognized': 'Complete revenue recognition'
            }
            if next_milestone in milestone_map:
                notes.append(f"🎯 Next: {milestone_map[next_milestone]}")
        
        # AWS funding note
        if opp.funding_type and 'AWS' in opp.funding_type:
            notes.append("🌩️ AWS funded")
        
        # Strategic account note
        if opp.strategic_account:
            notes.append("⭐ Strategic account")
        
        return " | ".join(notes)
    
    def _generate_review_summary(self, review_opportunities: List[ReviewOpportunity], week_start: date) -> WeeklyReviewSummary:
        """Generate summary metrics for weekly review"""
        
        opportunities = [ro.opportunity for ro in review_opportunities]
        
        # Basic counts
        total_opportunities = len(opportunities)
        total_value = sum(opp.sgd_amount for opp in opportunities)
        
        # Weekly metrics
        updated_this_week = sum(1 for ro in review_opportunities if ro.updated_this_week)
        attention_required = sum(1 for ro in review_opportunities if ro.requires_attention)
        
        # Revenue realized this week
        revenue_this_week = sum(
            opp.sgd_amount for opp in opportunities 
            if opp.revenue_date and opp.revenue_date >= week_start
        )
        
        # New opportunities this week
        new_opportunities = sum(
            1 for opp in opportunities 
            if opp.created_date.date() >= week_start
        )
        
        # Status counts
        blocked_opportunities = sum(
            1 for opp in opportunities 
            if opp.health_signal == HealthSignalType.BLOCKED
        )
        
        overdue_opportunities = sum(
            1 for opp in opportunities 
            if opp.closing_date < datetime.now().date() and not opp.is_revenue_realized()
        )
        
        return WeeklyReviewSummary(
            total_opportunities=total_opportunities,
            total_value_sgd=total_value,
            updated_this_week=updated_this_week,
            attention_required=attention_required,
            revenue_realized_this_week=revenue_this_week,
            new_opportunities=new_opportunities,
            blocked_opportunities=blocked_opportunities,
            overdue_opportunities=overdue_opportunities
        )
    
    def _generate_action_items(self, review_opportunities: List[ReviewOpportunity]) -> List[ActionItem]:
        """Generate action items for weekly review"""
        
        action_items = []
        
        # High priority: Critical and blocked opportunities
        critical_opportunities = [ro for ro in review_opportunities if ro.opportunity.health_signal == HealthSignalType.RED]
        blocked_opportunities = [ro for ro in review_opportunities if ro.opportunity.health_signal == HealthSignalType.BLOCKED]
        
        for ro in critical_opportunities:
            action_items.append(ActionItem(
                priority="High",
                description=f"Address critical issues for {ro.opportunity.deal_name}: {ro.opportunity.health_reason}",
                owner=ro.opportunity.owner,
                opportunity_id=ro.opportunity.id
            ))
        
        for ro in blocked_opportunities:
            action_items.append(ActionItem(
                priority="High", 
                description=f"Resolve blockers for {ro.opportunity.deal_name}",
                owner=ro.opportunity.owner,
                opportunity_id=ro.opportunity.id
            ))
        
        # Medium priority: Not updated this week
        not_updated = [ro for ro in review_opportunities if not ro.updated_this_week]
        for ro in not_updated[:5]:  # Limit to top 5
            action_items.append(ActionItem(
                priority="Medium",
                description=f"Get status update for {ro.opportunity.deal_name} (not updated in {ro.days_since_update} days)",
                owner=ro.opportunity.owner,
                opportunity_id=ro.opportunity.id
            ))
        
        # Medium priority: Overdue deals
        overdue_deals = [
            ro for ro in review_opportunities 
            if ro.opportunity.closing_date < datetime.now().date() and not ro.opportunity.is_revenue_realized()
        ]
        for ro in overdue_deals:
            action_items.append(ActionItem(
                priority="Medium",
                description=f"Review overdue deal {ro.opportunity.deal_name} (past closing date)",
                owner=ro.opportunity.owner,
                opportunity_id=ro.opportunity.id
            ))
        
        # Low priority: AWS compliance
        aws_deals = [
            ro for ro in review_opportunities 
            if ro.opportunity.funding_type and 'AWS' in ro.opportunity.funding_type
        ]
        if aws_deals:
            action_items.append(ActionItem(
                priority="Low",
                description=f"Review AWS compliance for {len(aws_deals)} AWS-funded deals",
                owner="Alliance Team"
            ))
        
        # Low priority: Strategic account reviews
        strategic_deals = [
            ro for ro in review_opportunities 
            if ro.opportunity.strategic_account
        ]
        if strategic_deals:
            action_items.append(ActionItem(
                priority="Low",
                description=f"Strategic account review for {len(strategic_deals)} deals",
                owner="CRO"
            ))
        
        return action_items
    
    def _generate_insights(self, review_opportunities: List[ReviewOpportunity], summary: WeeklyReviewSummary) -> Dict[str, Any]:
        """Generate insights and recommendations"""
        
        insights = {
            'key_highlights': [],
            'concerns': [],
            'recommendations': [],
            'trends': {}
        }
        
        # Key highlights
        if summary.revenue_realized_this_week > 0:
            insights['key_highlights'].append(
                f"💰 SGD {summary.revenue_realized_this_week:,.0f} revenue realized this week"
            )
        
        if summary.new_opportunities > 0:
            insights['key_highlights'].append(
                f"🆕 {summary.new_opportunities} new opportunities added"
            )
        
        update_percentage = (summary.updated_this_week / summary.total_opportunities) * 100 if summary.total_opportunities > 0 else 0
        if update_percentage >= 80:
            insights['key_highlights'].append(
                f"✅ {update_percentage:.0f}% of opportunities updated this week"
            )
        
        # Concerns
        if summary.blocked_opportunities > 0:
            insights['concerns'].append(
                f"🚧 {summary.blocked_opportunities} opportunities are blocked"
            )
        
        if summary.overdue_opportunities > 0:
            insights['concerns'].append(
                f"⏰ {summary.overdue_opportunities} opportunities are overdue"
            )
        
        if update_percentage < 50:
            insights['concerns'].append(
                f"📋 Only {update_percentage:.0f}% of opportunities updated this week"
            )
        
        # Recommendations
        if summary.attention_required > 0:
            insights['recommendations'].append(
                f"Focus on {summary.attention_required} opportunities requiring immediate attention"
            )
        
        if summary.blocked_opportunities > 0:
            insights['recommendations'].append(
                "Prioritize resolving blockers to maintain pipeline flow"
            )
        
        if update_percentage < 70:
            insights['recommendations'].append(
                "Improve weekly update cadence for better visibility"
            )
        
        # Trends (simplified - would need historical data)
        phase_distribution = {}
        territory_performance = {}
        service_performance = {}
        
        for ro in review_opportunities:
            opp = ro.opportunity
            
            # Phase distribution
            phase = opp.current_phase
            if phase not in phase_distribution:
                phase_distribution[phase] = {'count': 0, 'value': 0}
            phase_distribution[phase]['count'] += 1
            phase_distribution[phase]['value'] += opp.sgd_amount
            
            # Territory performance
            territory = opp.territory or 'Unknown'
            if territory not in territory_performance:
                territory_performance[territory] = {'count': 0, 'value': 0, 'attention_required': 0}
            territory_performance[territory]['count'] += 1
            territory_performance[territory]['value'] += opp.sgd_amount
            if ro.requires_attention:
                territory_performance[territory]['attention_required'] += 1
            
            # Service performance
            service = opp.service_type or 'Unknown'
            if service not in service_performance:
                service_performance[service] = {'count': 0, 'value': 0}
            service_performance[service]['count'] += 1
            service_performance[service]['value'] += opp.sgd_amount
        
        insights['trends'] = {
            'phase_distribution': phase_distribution,
            'territory_performance': territory_performance,
            'service_performance': service_performance
        }
        
        return insights
    
    def _serialize_review_opportunity(self, ro: ReviewOpportunity) -> Dict[str, Any]:
        """Serialize ReviewOpportunity for JSON response"""
        return {
            'opportunity': ro.opportunity.dict(),
            'updated_this_week': ro.updated_this_week,
            'requires_attention': ro.requires_attention,
            'status_change': ro.status_change,
            'review_notes': ro.review_notes,
            'days_since_update': ro.days_since_update
        }
    
    def _serialize_action_item(self, ai: ActionItem) -> Dict[str, Any]:
        """Serialize ActionItem for JSON response"""
        return {
            'priority': ai.priority,
            'description': ai.description,
            'owner': ai.owner,
            'opportunity_id': ai.opportunity_id,
            'created_date': ai.created_date.isoformat()
        }
    
    def generate_weekly_email_report(self, review_data: Dict[str, Any]) -> str:
        """Generate HTML email report for weekly review"""
        
        summary = review_data['summary']
        insights = review_data['insights']
        action_items = review_data['action_items']
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #1e40af; color: white; padding: 20px; border-radius: 5px; }}
                .summary {{ background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .metric {{ display: inline-block; margin: 10px 20px 10px 0; }}
                .metric-value {{ font-size: 24px; font-weight: bold; color: #1e40af; }}
                .metric-label {{ font-size: 12px; color: #6b7280; }}
                .section {{ margin: 20px 0; }}
                .highlight {{ background-color: #d1fae5; padding: 10px; border-left: 4px solid #10b981; margin: 5px 0; }}
                .concern {{ background-color: #fee2e2; padding: 10px; border-left: 4px solid #ef4444; margin: 5px 0; }}
                .action-item {{ background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 5px 0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Weekly O2R Review - {review_data['week_of']}</h1>
                <p>Generated: {review_data['generated_at']}</p>
            </div>
            
            <div class="summary">
                <h2>📊 Week Summary</h2>
                <div class="metric">
                    <div class="metric-value">{summary['total_opportunities']}</div>
                    <div class="metric-label">Total Opportunities</div>
                </div>
                <div class="metric">
                    <div class="metric-value">SGD {summary['total_value_sgd']:,.0f}</div>
                    <div class="metric-label">Total Value</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{summary['updated_this_week']}</div>
                    <div class="metric-label">Updated This Week</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{summary['attention_required']}</div>
                    <div class="metric-label">Require Attention</div>
                </div>
                <div class="metric">
                    <div class="metric-value">SGD {summary['revenue_realized_this_week']:,.0f}</div>
                    <div class="metric-label">Revenue Realized</div>
                </div>
            </div>
            
            <div class="section">
                <h2>✨ Key Highlights</h2>
        """
        
        for highlight in insights['key_highlights']:
            html += f'<div class="highlight">{highlight}</div>'
        
        html += """
            </div>
            
            <div class="section">
                <h2>⚠️ Concerns</h2>
        """
        
        for concern in insights['concerns']:
            html += f'<div class="concern">{concern}</div>'
        
        html += """
            </div>
            
            <div class="section">
                <h2>🎯 Action Items</h2>
        """
        
        # Group action items by priority
        high_priority = [ai for ai in action_items if ai['priority'] == 'High']
        medium_priority = [ai for ai in action_items if ai['priority'] == 'Medium']
        
        html += "<h3>🔴 High Priority</h3>"
        for ai in high_priority:
            html += f'<div class="action-item"><strong>{ai["owner"]}:</strong> {ai["description"]}</div>'
        
        html += "<h3>🟡 Medium Priority</h3>"
        for ai in medium_priority:
            html += f'<div class="action-item"><strong>{ai["owner"]}:</strong> {ai["description"]}</div>'
        
        html += """
            </div>
        </body>
        </html>
        """
        
        return html
