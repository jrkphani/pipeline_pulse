"""
Health Signal Engine - Automated risk detection and health calculation
"""

from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from dataclasses import dataclass
from enum import Enum

from .opportunity import O2ROpportunity, HealthSignalType, OpportunityPhase

@dataclass
class HealthSignal:
    """Health signal with reason and severity"""
    signal: HealthSignalType
    reason: str
    severity: int = 1  # 1-5 scale
    recommendation: Optional[str] = None

class HealthSignalEngine:
    """Engine for calculating opportunity health signals"""
    
    # Configurable thresholds
    PROPOSAL_STALL_DAYS = 30
    KICKOFF_DELAY_DAYS = 14
    EXECUTION_OVERRUN_DAYS = 60
    PAYMENT_OVERDUE_DAYS = 45
    NO_UPDATE_DAYS = 7
    
    def calculate_health_signal(self, opportunity: O2ROpportunity) -> HealthSignal:
        """Calculate comprehensive health signal for opportunity"""
        
        signals = []
        
        # Check for critical issues first (RED signals)
        signals.extend(self._check_critical_issues(opportunity))
        
        # Check for warning signs (YELLOW signals)  
        signals.extend(self._check_warning_signs(opportunity))
        
        # Check for update requirements
        signals.extend(self._check_update_requirements(opportunity))
        
        # Check for blocks
        signals.extend(self._check_blockers(opportunity))
        
        # Return highest priority signal
        return self._aggregate_signals(signals)
    
    def _check_critical_issues(self, opp: O2ROpportunity) -> List[HealthSignal]:
        """Check for critical issues requiring immediate attention"""
        signals = []
        today = date.today()
        
        # Proposal stalled > 30 days
        if opp.proposal_date and not opp.po_date:
            days_since_proposal = (today - opp.proposal_date).days
            if days_since_proposal > self.PROPOSAL_STALL_DAYS:
                signals.append(HealthSignal(
                    signal=HealthSignalType.RED,
                    reason=f"Proposal stalled {days_since_proposal} days",
                    severity=5,
                    recommendation="Follow up with customer on PO status"
                ))
        
        # Payment overdue > 45 days
        if opp.invoice_date and not opp.payment_date:
            days_since_invoice = (today - opp.invoice_date).days
            if days_since_invoice > self.PAYMENT_OVERDUE_DAYS:
                signals.append(HealthSignal(
                    signal=HealthSignalType.RED,
                    reason=f"Payment overdue {days_since_invoice} days",
                    severity=5,
                    recommendation="Escalate payment collection"
                ))
        
        # Deal past closing date without revenue
        if opp.closing_date < today and not opp.revenue_date:
            days_overdue = (today - opp.closing_date).days
            signals.append(HealthSignal(
                signal=HealthSignalType.RED,
                reason=f"Deal overdue {days_overdue} days without revenue",
                severity=4,
                recommendation="Review deal status and update forecast"
            ))
        
        return signals
    
    def _check_warning_signs(self, opp: O2ROpportunity) -> List[HealthSignal]:
        """Check for warning signs requiring attention"""
        signals = []
        today = date.today()
        
        # Kickoff delayed > 14 days after PO
        if opp.po_date and not opp.kickoff_date:
            days_since_po = (today - opp.po_date).days
            if days_since_po > self.KICKOFF_DELAY_DAYS:
                signals.append(HealthSignal(
                    signal=HealthSignalType.YELLOW,
                    reason=f"Kickoff delayed {days_since_po} days after PO",
                    severity=3,
                    recommendation="Schedule kickoff meeting immediately"
                ))
        
        # Execution taking > 60 days
        if opp.kickoff_date and not opp.invoice_date:
            days_since_kickoff = (today - opp.kickoff_date).days
            if days_since_kickoff > self.EXECUTION_OVERRUN_DAYS:
                signals.append(HealthSignal(
                    signal=HealthSignalType.YELLOW,
                    reason=f"Execution running {days_since_kickoff} days",
                    severity=3,
                    recommendation="Review project timeline and milestones"
                ))
        
        # High probability deal without recent progress
        if opp.probability >= 80 and not opp.po_date:
            signals.append(HealthSignal(
                signal=HealthSignalType.YELLOW,
                reason=f"High probability ({opp.probability}%) deal without PO",
                severity=2,
                recommendation="Verify deal status and next steps"
            ))
        
        # Low probability deal consuming resources
        if opp.probability <= 20 and opp.kickoff_date:
            signals.append(HealthSignal(
                signal=HealthSignalType.YELLOW,
                reason=f"Low probability ({opp.probability}%) deal in execution",
                severity=2,
                recommendation="Review resource allocation"
            ))
        
        return signals
    
    def _check_update_requirements(self, opp: O2ROpportunity) -> List[HealthSignal]:
        """Check for update requirements"""
        signals = []
        
        # No update in > 7 days
        days_since_update = (datetime.now() - opp.last_updated).days
        if days_since_update > self.NO_UPDATE_DAYS:
            signals.append(HealthSignal(
                signal=HealthSignalType.NEEDS_UPDATE,
                reason=f"No update in {days_since_update} days",
                severity=1,
                recommendation="Request status update from owner"
            ))
        
        # Not updated this week
        if not opp.updated_this_week:
            signals.append(HealthSignal(
                signal=HealthSignalType.NEEDS_UPDATE,
                reason="Not updated this week",
                severity=1,
                recommendation="Include in weekly review"
            ))
        
        return signals
    
    def _check_blockers(self, opp: O2ROpportunity) -> List[HealthSignal]:
        """Check for reported blockers"""
        signals = []
        
        if opp.blockers:
            signals.append(HealthSignal(
                signal=HealthSignalType.BLOCKED,
                reason=f"{len(opp.blockers)} active blocker(s)",
                severity=4,
                recommendation="Address blockers to unblock progress"
            ))
        
        return signals
    
    def _aggregate_signals(self, signals: List[HealthSignal]) -> HealthSignal:
        """Aggregate multiple signals into single health signal"""
        
        if not signals:
            return HealthSignal(
                signal=HealthSignalType.GREEN,
                reason="No issues detected",
                severity=0,
                recommendation="Continue current execution"
            )
        
        # Priority order: BLOCKED > RED > YELLOW > NEEDS_UPDATE > GREEN
        priority_order = [
            HealthSignalType.BLOCKED,
            HealthSignalType.RED,
            HealthSignalType.YELLOW,
            HealthSignalType.NEEDS_UPDATE,
            HealthSignalType.GREEN
        ]
        
        # Find highest priority signal
        for signal_type in priority_order:
            matching_signals = [s for s in signals if s.signal == signal_type]
            if matching_signals:
                # Return highest severity signal of this type
                highest_severity = max(matching_signals, key=lambda x: x.severity)
                
                # Combine reasons if multiple
                if len(matching_signals) > 1:
                    reasons = [s.reason for s in matching_signals]
                    highest_severity.reason = "; ".join(reasons)
                
                return highest_severity
        
        # Fallback (should not happen)
        return signals[0]
    
    def get_health_summary_for_portfolio(self, opportunities: List[O2ROpportunity]) -> Dict[str, int]:
        """Get health signal summary for portfolio of opportunities"""
        
        summary = {
            'total': len(opportunities),
            'green': 0,
            'yellow': 0, 
            'red': 0,
            'blocked': 0,
            'needs_update': 0
        }
        
        for opp in opportunities:
            health = self.calculate_health_signal(opp)
            
            if health.signal == HealthSignalType.GREEN:
                summary['green'] += 1
            elif health.signal == HealthSignalType.YELLOW:
                summary['yellow'] += 1
            elif health.signal == HealthSignalType.RED:
                summary['red'] += 1
            elif health.signal == HealthSignalType.BLOCKED:
                summary['blocked'] += 1
            elif health.signal == HealthSignalType.NEEDS_UPDATE:
                summary['needs_update'] += 1
        
        return summary
    
    def get_opportunities_requiring_attention(self, opportunities: List[O2ROpportunity]) -> List[O2ROpportunity]:
        """Get opportunities that require immediate attention"""
        
        attention_required = []
        
        for opp in opportunities:
            health = self.calculate_health_signal(opp)
            
            # RED or BLOCKED signals require attention
            if health.signal in [HealthSignalType.RED, HealthSignalType.BLOCKED]:
                attention_required.append(opp)
        
        # Sort by severity (highest first)
        attention_required.sort(
            key=lambda x: self.calculate_health_signal(x).severity,
            reverse=True
        )
        
        return attention_required
    
    def generate_health_recommendations(self, opportunity: O2ROpportunity) -> List[str]:
        """Generate specific recommendations for opportunity"""
        
        health = self.calculate_health_signal(opportunity)
        recommendations = []
        
        if health.recommendation:
            recommendations.append(health.recommendation)
        
        # Phase-specific recommendations
        if opportunity.current_phase == OpportunityPhase.PHASE_1:
            if not opportunity.proposal_date:
                recommendations.append("Prepare and send proposal to customer")
        
        elif opportunity.current_phase == OpportunityPhase.PHASE_2:
            if opportunity.proposal_date and not opportunity.po_date:
                days_since_proposal = (date.today() - opportunity.proposal_date).days
                if days_since_proposal > 14:
                    recommendations.append("Follow up on proposal acceptance and PO generation")
        
        elif opportunity.current_phase == OpportunityPhase.PHASE_3:
            if opportunity.po_date and not opportunity.kickoff_date:
                recommendations.append("Schedule project kickoff meeting")
            elif opportunity.kickoff_date and not opportunity.invoice_date:
                recommendations.append("Track project milestones and prepare for billing")
        
        elif opportunity.current_phase == OpportunityPhase.PHASE_4:
            if opportunity.invoice_date and not opportunity.payment_date:
                recommendations.append("Follow up on payment collection")
            elif opportunity.payment_date and not opportunity.revenue_date:
                recommendations.append("Complete revenue recognition process")
        
        # AWS funding specific recommendations
        if opportunity.funding_type and 'AWS' in opportunity.funding_type:
            recommendations.append("Ensure AWS compliance and reporting requirements are met")
        
        return recommendations
