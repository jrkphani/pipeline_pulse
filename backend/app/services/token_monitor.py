"""
Token Monitoring Background Service
Proactive monitoring and alerting for token health
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.database import get_db
from app.models.token_management import ZohoTokenRecord, TokenAlert
from app.services.token_manager import token_manager

logger = logging.getLogger(__name__)


class TokenMonitor:
    """
    Background service for proactive token monitoring
    """
    
    def __init__(self):
        self.monitoring_interval = 300  # Check every 5 minutes
        self.is_running = False
        self._task = None
        
        # Alert thresholds
        self.expiry_warning_minutes = 30  # Warn when < 30 minutes remaining
        self.error_threshold = 3  # Alert after 3 consecutive errors
        self.stale_token_hours = 24  # Alert if token unused for 24 hours
    
    async def start_monitoring(self):
        """Start the background monitoring task"""
        if self.is_running:
            logger.warning("Token monitoring already running")
            return
        
        self.is_running = True
        self._task = asyncio.create_task(self._monitoring_loop())
        logger.info("Token monitoring started")
    
    async def stop_monitoring(self):
        """Stop the background monitoring task"""
        if not self.is_running:
            return
        
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        logger.info("Token monitoring stopped")
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.monitoring_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in token monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def _perform_health_checks(self):
        """Perform comprehensive token health checks"""
        db = next(get_db())
        try:
            # Get current token record
            current_record = await token_manager.get_current_token_record(db)
            
            if not current_record:
                await self._create_no_token_alert(db)
                return
            
            # Check for expiry warnings
            await self._check_expiry_warnings(db, current_record)
            
            # Check for error thresholds
            await self._check_error_thresholds(db, current_record)
            
            # Check for stale tokens
            await self._check_stale_tokens(db, current_record)
            
            # Attempt proactive refresh if needed
            await self._proactive_refresh(db, current_record)
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error performing health checks: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def _check_expiry_warnings(self, db: Session, record: ZohoTokenRecord):
        """Check for upcoming token expiry"""
        if not record.expires_at:
            return
        
        time_until_expiry = record.expires_at - datetime.now()
        warning_threshold = timedelta(minutes=self.expiry_warning_minutes)
        
        if time_until_expiry <= warning_threshold and not record.is_expired:
            # Check if we already have an active expiry warning
            existing_alert = db.query(TokenAlert).filter(
                and_(
                    TokenAlert.token_record_id == record.id,
                    TokenAlert.alert_type == "expiry_warning",
                    TokenAlert.is_resolved == False
                )
            ).first()
            
            if not existing_alert:
                await self._create_alert(
                    db,
                    record.id,
                    "expiry_warning",
                    "medium",
                    f"Token expires in {time_until_expiry}. Consider refreshing soon."
                )
                logger.warning(f"Token expiry warning: {time_until_expiry} remaining")
    
    async def _check_error_thresholds(self, db: Session, record: ZohoTokenRecord):
        """Check for error count thresholds"""
        if record.error_count >= self.error_threshold:
            # Check if we already have an active error threshold alert
            existing_alert = db.query(TokenAlert).filter(
                and_(
                    TokenAlert.token_record_id == record.id,
                    TokenAlert.alert_type == "error_threshold",
                    TokenAlert.is_resolved == False
                )
            ).first()
            
            if not existing_alert:
                severity = "critical" if record.error_count >= 5 else "high"
                await self._create_alert(
                    db,
                    record.id,
                    "error_threshold",
                    severity,
                    f"Token has {record.error_count} consecutive errors. Manual intervention may be required."
                )
                logger.error(f"Token error threshold exceeded: {record.error_count} errors")
    
    async def _check_stale_tokens(self, db: Session, record: ZohoTokenRecord):
        """Check for tokens that haven't been used recently"""
        if not record.last_used:
            return
        
        time_since_use = datetime.now() - record.last_used
        stale_threshold = timedelta(hours=self.stale_token_hours)
        
        if time_since_use >= stale_threshold:
            # Check if we already have an active stale token alert
            existing_alert = db.query(TokenAlert).filter(
                and_(
                    TokenAlert.token_record_id == record.id,
                    TokenAlert.alert_type == "stale_token",
                    TokenAlert.is_resolved == False
                )
            ).first()
            
            if not existing_alert:
                await self._create_alert(
                    db,
                    record.id,
                    "stale_token",
                    "low",
                    f"Token hasn't been used for {time_since_use}. Consider testing connectivity."
                )
                logger.info(f"Stale token detected: unused for {time_since_use}")
    
    async def _proactive_refresh(self, db: Session, record: ZohoTokenRecord):
        """Attempt proactive token refresh if conditions are met"""
        # Only refresh if token is near expiry and error count is low
        if record.is_near_expiry and record.error_count < 3:
            try:
                logger.info("Attempting proactive token refresh")
                await token_manager.get_valid_access_token(db, force_refresh=True)
                logger.info("Proactive token refresh successful")
            except Exception as e:
                logger.error(f"Proactive token refresh failed: {e}")
    
    async def _create_no_token_alert(self, db: Session):
        """Create alert for missing token"""
        # Check if we already have an active no-token alert
        existing_alert = db.query(TokenAlert).filter(
            and_(
                TokenAlert.alert_type == "no_token",
                TokenAlert.is_resolved == False
            )
        ).first()
        
        if not existing_alert:
            await self._create_alert(
                db,
                "system",
                "no_token",
                "critical",
                "No active Zoho token found. Manual token refresh required."
            )
            logger.critical("No active Zoho token found")
    
    async def _create_alert(
        self, 
        db: Session, 
        token_record_id: str, 
        alert_type: str, 
        severity: str, 
        message: str
    ):
        """Create a new alert"""
        alert = TokenAlert(
            token_record_id=token_record_id,
            alert_type=alert_type,
            severity=severity,
            message=message
        )
        db.add(alert)
    
    async def get_monitoring_status(self) -> Dict[str, Any]:
        """Get current monitoring status"""
        return {
            "is_running": self.is_running,
            "monitoring_interval_seconds": self.monitoring_interval,
            "thresholds": {
                "expiry_warning_minutes": self.expiry_warning_minutes,
                "error_threshold": self.error_threshold,
                "stale_token_hours": self.stale_token_hours
            }
        }
    
    async def get_active_alerts(self, db: Session) -> List[Dict[str, Any]]:
        """Get all active alerts"""
        alerts = db.query(TokenAlert).filter(
            TokenAlert.is_resolved == False
        ).order_by(TokenAlert.created_at.desc()).all()
        
        return [
            {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "message": alert.message,
                "created_at": alert.created_at.isoformat(),
                "token_record_id": alert.token_record_id
            }
            for alert in alerts
        ]
    
    async def acknowledge_alert(self, db: Session, alert_id: str, acknowledged_by: str = "system"):
        """Acknowledge an alert"""
        alert = db.query(TokenAlert).filter(TokenAlert.id == alert_id).first()
        if alert:
            alert.is_acknowledged = True
            alert.acknowledged_at = datetime.now()
            alert.acknowledged_by = acknowledged_by
            db.commit()
            return True
        return False


# Global instance
token_monitor = TokenMonitor()
