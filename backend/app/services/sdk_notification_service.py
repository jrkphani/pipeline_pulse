"""
SDK Notification Service
Handles notifications based on SDK data structures and events
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass

from app.services.zoho_sdk_manager import get_sdk_manager
from app.services.sdk_response_transformer import get_response_transformer

logger = logging.getLogger(__name__)


class NotificationType(Enum):
    """Types of notifications"""
    DEAL_CREATED = "deal_created"
    DEAL_UPDATED = "deal_updated"
    DEAL_DELETED = "deal_deleted"
    MILESTONE_COMPLETED = "milestone_completed"
    HEALTH_ALERT = "health_alert"
    SYNC_COMPLETED = "sync_completed"
    SYNC_FAILED = "sync_failed"
    SDK_ERROR = "sdk_error"


class NotificationPriority(Enum):
    """Notification priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class NotificationData:
    """Notification data structure"""
    type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    data: Dict[str, Any]
    timestamp: datetime
    source: str = "sdk"
    

class SDKNotificationService:
    """Service for handling notifications based on SDK data structures"""
    
    def __init__(self):
        self.sdk_manager = get_sdk_manager()
        self.transformer = get_response_transformer()
        self.notification_handlers = {}
        self.notification_history = []
        self.max_history = 1000
        
        logger.info("🔔 SDK Notification Service initialized")
    
    def register_handler(self, notification_type: NotificationType, handler_func):
        """Register a handler for a specific notification type"""
        if notification_type not in self.notification_handlers:
            self.notification_handlers[notification_type] = []
        
        self.notification_handlers[notification_type].append(handler_func)
        logger.info(f"Registered handler for {notification_type.value}")
    
    async def send_notification(self, notification: NotificationData) -> bool:
        """Send a notification to all registered handlers"""
        try:
            # Store in history
            self.notification_history.append(notification)
            if len(self.notification_history) > self.max_history:
                self.notification_history = self.notification_history[-self.max_history:]
            
            # Get handlers for this notification type
            handlers = self.notification_handlers.get(notification.type, [])
            
            if not handlers:
                logger.debug(f"No handlers registered for {notification.type.value}")
                return True
            
            # Execute all handlers
            success_count = 0
            for handler in handlers:
                try:
                    await handler(notification)
                    success_count += 1
                except Exception as e:
                    logger.error(f"Notification handler failed: {e}")
            
            logger.info(f"📬 Sent {notification.type.value} notification to {success_count}/{len(handlers)} handlers")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            return False
    
    async def notify_deal_created(self, deal_data: Dict[str, Any]) -> bool:
        """Send notification for new deal creation via SDK"""
        try:
            deal_name = deal_data.get("deal_name", "Unknown Deal")
            deal_amount = deal_data.get("amount", 0)
            territory = deal_data.get("territory", "Unknown")
            
            notification = NotificationData(
                type=NotificationType.DEAL_CREATED,
                priority=NotificationPriority.MEDIUM,
                title="New Deal Created",
                message=f"Deal '{deal_name}' created in {territory} for ${deal_amount:,.2f}",
                data={
                    "deal_id": deal_data.get("id"),
                    "deal_name": deal_name,
                    "amount": deal_amount,
                    "territory": territory,
                    "owner": deal_data.get("owner", {}),
                    "stage": deal_data.get("stage"),
                    "sdk_source": True
                },
                timestamp=datetime.now()
            )
            
            return await self.send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to notify deal creation: {e}")
            return False
    
    async def notify_deal_updated(self, deal_data: Dict[str, Any], modified_fields: List[str] = None) -> bool:
        """Send notification for deal updates via SDK"""
        try:
            deal_name = deal_data.get("deal_name", "Unknown Deal")
            deal_id = deal_data.get("id")
            
            # Determine priority based on modified fields
            priority = NotificationPriority.LOW
            important_fields = ["stage", "amount", "closing_date"]
            o2r_fields = ["proposal_date", "po_date", "kickoff_date", "invoice_date", "payment_date", "revenue_date"]
            
            if modified_fields:
                if any(field.lower() in important_fields for field in modified_fields):
                    priority = NotificationPriority.MEDIUM
                elif any(field.lower() in o2r_fields for field in modified_fields):
                    priority = NotificationPriority.HIGH
            
            fields_text = ", ".join(modified_fields) if modified_fields else "multiple fields"
            
            notification = NotificationData(
                type=NotificationType.DEAL_UPDATED,
                priority=priority,
                title="Deal Updated",
                message=f"Deal '{deal_name}' updated: {fields_text}",
                data={
                    "deal_id": deal_id,
                    "deal_name": deal_name,
                    "modified_fields": modified_fields or [],
                    "current_stage": deal_data.get("stage"),
                    "current_amount": deal_data.get("amount"),
                    "health_status": deal_data.get("health_status"),
                    "sdk_source": True
                },
                timestamp=datetime.now()
            )
            
            return await self.send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to notify deal update: {e}")
            return False
    
    async def notify_milestone_completed(self, deal_data: Dict[str, Any], milestone: str) -> bool:
        """Send notification for O2R milestone completion"""
        try:
            deal_name = deal_data.get("deal_name", "Unknown Deal")
            
            milestone_names = {
                "proposal_date": "Proposal Submitted",
                "sow_date": "SOW Signed",
                "po_date": "PO Received",
                "kickoff_date": "Project Kickoff",
                "invoice_date": "Invoice Sent",
                "payment_date": "Payment Received",
                "revenue_date": "Revenue Realized"
            }
            
            milestone_display = milestone_names.get(milestone, milestone.replace("_", " ").title())
            
            notification = NotificationData(
                type=NotificationType.MILESTONE_COMPLETED,
                priority=NotificationPriority.HIGH,
                title="Milestone Completed",
                message=f"'{milestone_display}' milestone completed for deal '{deal_name}'",
                data={
                    "deal_id": deal_data.get("id"),
                    "deal_name": deal_name,
                    "milestone": milestone,
                    "milestone_display": milestone_display,
                    "current_phase": deal_data.get("current_phase"),
                    "territory": deal_data.get("territory"),
                    "amount": deal_data.get("amount"),
                    "sdk_source": True
                },
                timestamp=datetime.now()
            )
            
            return await self.send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to notify milestone completion: {e}")
            return False
    
    async def notify_health_alert(self, deal_data: Dict[str, Any], alert_type: str) -> bool:
        """Send notification for deal health alerts"""
        try:
            deal_name = deal_data.get("deal_name", "Unknown Deal")
            health_status = deal_data.get("health_status", "unknown")
            
            alert_messages = {
                "overdue": f"Deal '{deal_name}' is overdue",
                "at_risk": f"Deal '{deal_name}' is at risk",
                "stalled": f"Deal '{deal_name}' appears to be stalled",
                "milestone_delayed": f"Milestone delayed for deal '{deal_name}'"
            }
            
            priority_map = {
                "overdue": NotificationPriority.URGENT,
                "at_risk": NotificationPriority.HIGH,
                "stalled": NotificationPriority.MEDIUM,
                "milestone_delayed": NotificationPriority.HIGH
            }
            
            message = alert_messages.get(alert_type, f"Health alert for deal '{deal_name}'")
            priority = priority_map.get(alert_type, NotificationPriority.MEDIUM)
            
            notification = NotificationData(
                type=NotificationType.HEALTH_ALERT,
                priority=priority,
                title="Deal Health Alert",
                message=message,
                data={
                    "deal_id": deal_data.get("id"),
                    "deal_name": deal_name,
                    "health_status": health_status,
                    "alert_type": alert_type,
                    "closing_date": deal_data.get("closing_date"),
                    "days_in_stage": deal_data.get("days_in_stage"),
                    "territory": deal_data.get("territory"),
                    "sdk_source": True
                },
                timestamp=datetime.now()
            )
            
            return await self.send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to notify health alert: {e}")
            return False
    
    async def notify_sync_completed(self, sync_result: Dict[str, Any]) -> bool:
        """Send notification for successful sync completion"""
        try:
            records_synced = sync_result.get("deals_synced", 0)
            sync_time = sync_result.get("sync_time")
            
            notification = NotificationData(
                type=NotificationType.SYNC_COMPLETED,
                priority=NotificationPriority.LOW,
                title="Sync Completed",
                message=f"Successfully synced {records_synced} deals from CRM",
                data={
                    "records_synced": records_synced,
                    "sync_time": sync_time,
                    "sync_method": sync_result.get("sync_method", "sdk"),
                    "duration": sync_result.get("duration_seconds"),
                    "sdk_source": True
                },
                timestamp=datetime.now()
            )
            
            return await self.send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to notify sync completion: {e}")
            return False
    
    async def notify_sync_failed(self, error_details: Dict[str, Any]) -> bool:
        """Send notification for sync failures"""
        try:
            error_message = error_details.get("message", "Unknown error")
            
            notification = NotificationData(
                type=NotificationType.SYNC_FAILED,
                priority=NotificationPriority.HIGH,
                title="Sync Failed",
                message=f"CRM sync failed: {error_message}",
                data={
                    "error_message": error_message,
                    "error_code": error_details.get("code"),
                    "sync_session_id": error_details.get("session_id"),
                    "module": error_details.get("module", "Deals"),
                    "sdk_source": True
                },
                timestamp=datetime.now()
            )
            
            return await self.send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to notify sync failure: {e}")
            return False
    
    async def notify_sdk_error(self, error_details: Dict[str, Any]) -> bool:
        """Send notification for SDK-specific errors"""
        try:
            error_message = error_details.get("message", "SDK error occurred")
            
            notification = NotificationData(
                type=NotificationType.SDK_ERROR,
                priority=NotificationPriority.HIGH,
                title="SDK Error",
                message=f"Zoho SDK error: {error_message}",
                data={
                    "error_message": error_message,
                    "error_type": error_details.get("type"),
                    "sdk_operation": error_details.get("operation"),
                    "timestamp": error_details.get("timestamp"),
                    "sdk_config": self.sdk_manager.get_config(),
                    "sdk_source": True
                },
                timestamp=datetime.now()
            )
            
            return await self.send_notification(notification)
            
        except Exception as e:
            logger.error(f"Failed to notify SDK error: {e}")
            return False
    
    def get_notification_history(self, 
                                notification_type: Optional[NotificationType] = None,
                                limit: int = 50) -> List[Dict[str, Any]]:
        """Get notification history"""
        try:
            notifications = self.notification_history
            
            # Filter by type if specified
            if notification_type:
                notifications = [n for n in notifications if n.type == notification_type]
            
            # Sort by timestamp (newest first) and limit
            notifications = sorted(notifications, key=lambda x: x.timestamp, reverse=True)
            notifications = notifications[:limit]
            
            # Convert to serializable format
            return [
                {
                    "type": n.type.value,
                    "priority": n.priority.value,
                    "title": n.title,
                    "message": n.message,
                    "data": n.data,
                    "timestamp": n.timestamp.isoformat(),
                    "source": n.source
                }
                for n in notifications
            ]
            
        except Exception as e:
            logger.error(f"Failed to get notification history: {e}")
            return []
    
    def get_notification_stats(self) -> Dict[str, Any]:
        """Get notification statistics"""
        try:
            total_notifications = len(self.notification_history)
            
            if total_notifications == 0:
                return {
                    "total_notifications": 0,
                    "by_type": {},
                    "by_priority": {},
                    "handlers_registered": len(self.notification_handlers)
                }
            
            # Count by type
            type_counts = {}
            for notification in self.notification_history:
                type_name = notification.type.value
                type_counts[type_name] = type_counts.get(type_name, 0) + 1
            
            # Count by priority
            priority_counts = {}
            for notification in self.notification_history:
                priority_name = notification.priority.value
                priority_counts[priority_name] = priority_counts.get(priority_name, 0) + 1
            
            return {
                "total_notifications": total_notifications,
                "by_type": type_counts,
                "by_priority": priority_counts,
                "handlers_registered": len(self.notification_handlers),
                "sdk_enabled": True
            }
            
        except Exception as e:
            logger.error(f"Failed to get notification stats: {e}")
            return {"error": str(e)}


# Global notification service instance
_notification_service = None


def get_notification_service() -> SDKNotificationService:
    """Get or create the global notification service instance"""
    global _notification_service
    if _notification_service is None:
        _notification_service = SDKNotificationService()
    return _notification_service


# Default notification handlers
async def console_notification_handler(notification: NotificationData):
    """Default console notification handler"""
    timestamp = notification.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {notification.priority.value.upper()}: {notification.title} - {notification.message}")


async def log_notification_handler(notification: NotificationData):
    """Default log notification handler"""
    log_level = {
        NotificationPriority.LOW: logger.info,
        NotificationPriority.MEDIUM: logger.info,
        NotificationPriority.HIGH: logger.warning,
        NotificationPriority.URGENT: logger.error
    }.get(notification.priority, logger.info)
    
    log_level(f"📢 {notification.title}: {notification.message}")


# Auto-register default handlers
def setup_default_handlers():
    """Set up default notification handlers"""
    service = get_notification_service()
    
    # Register console handler for all notification types
    for notification_type in NotificationType:
        service.register_handler(notification_type, console_notification_handler)
        service.register_handler(notification_type, log_notification_handler)


# Initialize default handlers on import
setup_default_handlers()