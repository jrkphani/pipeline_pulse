"""
Data Quality Service for anomaly detection and validation
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, date

from app.models.crm_record import DataQualityAlert, DataQualityConfig


class DataQualityService:
    """Service for data quality validation and anomaly detection"""
    
    def __init__(self):
        # Default thresholds - will be configurable later
        self.default_thresholds = {
            'amount_change_percent': 50.0,
            'probability_drop_percent': 30.0,
            'closing_date_extension_days': 90,
            'stage_regression_flag': True
        }
        
        # Stage progression mapping (customize based on your CRM stages)
        self.stage_progression = {
            'Prospecting': 1,
            'Qualification': 2,
            'Needs Analysis': 3,
            'Value Proposition': 4,
            'Id. Decision Makers': 5,
            'Perception Analysis': 6,
            'Proposal/Price Quote': 7,
            'Negotiation/Review': 8,
            'Closed Won': 9,
            'Closed Lost': 0,
            'Closed - Old Opportunity (0)': 0
        }
    
    def detect_anomalies(
        self, 
        record_id: str, 
        changes: List[Dict[str, Any]], 
        analysis_id: str,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalies in record changes
        Returns list of anomaly descriptions
        """
        
        anomalies = []
        
        for change in changes:
            field = change['field']
            old_value = change['old_value']
            new_value = change['new_value']
            
            # Amount change detection
            if field == 'Amount':
                anomaly = self._check_amount_anomaly(old_value, new_value, record_id, analysis_id, db)
                if anomaly:
                    anomalies.append(anomaly)
            
            # Probability drop detection
            elif field == 'Probability (%)':
                anomaly = self._check_probability_anomaly(old_value, new_value, record_id, analysis_id, db)
                if anomaly:
                    anomalies.append(anomaly)
            
            # Stage regression detection
            elif field == 'Stage':
                anomaly = self._check_stage_anomaly(old_value, new_value, record_id, analysis_id, db)
                if anomaly:
                    anomalies.append(anomaly)
            
            # Closing date extension detection
            elif field == 'Closing Date':
                anomaly = self._check_closing_date_anomaly(old_value, new_value, record_id, analysis_id, db)
                if anomaly:
                    anomalies.append(anomaly)
        
        return anomalies
    
    def _check_amount_anomaly(
        self, 
        old_value: Any, 
        new_value: Any, 
        record_id: str, 
        analysis_id: str,
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """Check for significant amount changes"""
        
        try:
            old_amount = float(old_value) if old_value else 0
            new_amount = float(new_value) if new_value else 0
            
            if old_amount == 0:
                return None  # Can't calculate percentage change from zero
            
            change_percent = abs((new_amount - old_amount) / old_amount) * 100
            threshold = self._get_threshold('amount_change_percent')
            
            if change_percent > threshold:
                severity = 'high' if change_percent > threshold * 2 else 'medium'
                
                alert = DataQualityAlert(
                    record_id=record_id,
                    analysis_id=analysis_id,
                    alert_type='amount_spike',
                    description=f"Amount changed by {change_percent:.1f}% from {old_amount:,.0f} to {new_amount:,.0f}",
                    severity=severity
                )
                db.add(alert)
                
                return {
                    'type': 'amount_spike',
                    'description': alert.description,
                    'severity': severity,
                    'change_percent': change_percent
                }
        
        except (ValueError, TypeError):
            return None
    
    def _check_probability_anomaly(
        self, 
        old_value: Any, 
        new_value: Any, 
        record_id: str, 
        analysis_id: str,
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """Check for significant probability drops"""
        
        try:
            old_prob = float(old_value) if old_value else 0
            new_prob = float(new_value) if new_value else 0
            
            prob_drop = old_prob - new_prob
            threshold = self._get_threshold('probability_drop_percent')
            
            if prob_drop > threshold:
                severity = 'high' if prob_drop > threshold * 1.5 else 'medium'
                
                alert = DataQualityAlert(
                    record_id=record_id,
                    analysis_id=analysis_id,
                    alert_type='probability_drop',
                    description=f"Probability dropped by {prob_drop:.1f}% from {old_prob}% to {new_prob}%",
                    severity=severity
                )
                db.add(alert)
                
                return {
                    'type': 'probability_drop',
                    'description': alert.description,
                    'severity': severity,
                    'drop_amount': prob_drop
                }
        
        except (ValueError, TypeError):
            return None
    
    def _check_stage_anomaly(
        self, 
        old_value: Any, 
        new_value: Any, 
        record_id: str, 
        analysis_id: str,
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """Check for stage regression"""
        
        if not self._get_threshold('stage_regression_flag'):
            return None
        
        old_stage = str(old_value) if old_value else ''
        new_stage = str(new_value) if new_value else ''
        
        old_level = self.stage_progression.get(old_stage, 0)
        new_level = self.stage_progression.get(new_stage, 0)
        
        # Check for regression (moving to earlier stage)
        if old_level > 0 and new_level > 0 and new_level < old_level:
            severity = 'high' if old_level - new_level > 2 else 'medium'
            
            alert = DataQualityAlert(
                record_id=record_id,
                analysis_id=analysis_id,
                alert_type='stage_regression',
                description=f"Stage moved backward from '{old_stage}' to '{new_stage}'",
                severity=severity
            )
            db.add(alert)
            
            return {
                'type': 'stage_regression',
                'description': alert.description,
                'severity': severity,
                'old_stage': old_stage,
                'new_stage': new_stage
            }
        
        return None
    
    def _check_closing_date_anomaly(
        self, 
        old_value: Any, 
        new_value: Any, 
        record_id: str, 
        analysis_id: str,
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """Check for significant closing date extensions"""
        
        try:
            from datetime import datetime
            
            # Try to parse dates
            if isinstance(old_value, str):
                old_date = datetime.strptime(old_value, '%Y-%m-%d').date()
            elif hasattr(old_value, 'date'):
                old_date = old_value.date()
            else:
                return None
            
            if isinstance(new_value, str):
                new_date = datetime.strptime(new_value, '%Y-%m-%d').date()
            elif hasattr(new_value, 'date'):
                new_date = new_value.date()
            else:
                return None
            
            # Check for extension
            extension_days = (new_date - old_date).days
            threshold = self._get_threshold('closing_date_extension_days')
            
            if extension_days > threshold:
                severity = 'high' if extension_days > threshold * 2 else 'medium'
                
                alert = DataQualityAlert(
                    record_id=record_id,
                    analysis_id=analysis_id,
                    alert_type='closing_date_extension',
                    description=f"Closing date extended by {extension_days} days from {old_date} to {new_date}",
                    severity=severity
                )
                db.add(alert)
                
                return {
                    'type': 'closing_date_extension',
                    'description': alert.description,
                    'severity': severity,
                    'extension_days': extension_days
                }
        
        except (ValueError, TypeError, AttributeError):
            return None
    
    def _get_threshold(self, key: str) -> float:
        """Get threshold value from config or default"""
        # For now, return default values
        # Later this will query the DataQualityConfig table
        return self.default_thresholds.get(key, 0)
    
    def get_alert_summary(self, analysis_id: str, db: Session) -> Dict[str, Any]:
        """Get summary of alerts for an analysis"""
        
        alerts = db.query(DataQualityAlert).filter(
            DataQualityAlert.analysis_id == analysis_id
        ).all()
        
        summary = {
            'total_alerts': len(alerts),
            'high_severity': len([a for a in alerts if a.severity == 'high']),
            'medium_severity': len([a for a in alerts if a.severity == 'medium']),
            'low_severity': len([a for a in alerts if a.severity == 'low']),
            'unresolved': len([a for a in alerts if not a.is_resolved]),
            'by_type': {}
        }
        
        # Group by alert type
        for alert in alerts:
            if alert.alert_type not in summary['by_type']:
                summary['by_type'][alert.alert_type] = 0
            summary['by_type'][alert.alert_type] += 1
        
        return summary
