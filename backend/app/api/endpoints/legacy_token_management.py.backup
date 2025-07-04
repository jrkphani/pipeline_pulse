"""
Token Management API Endpoints
Comprehensive token lifecycle management and monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.services.token_manager import token_manager
from app.services.token_monitor import token_monitor
from app.models.token_management import TokenAlert, TokenRefreshLog
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/token-management", tags=["Token Management"])


@router.get("/health")
async def get_token_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get comprehensive token health status
    """
    try:
        health_status = await token_manager.get_token_health_status(db)
        monitoring_status = await token_monitor.get_monitoring_status()
        active_alerts = await token_monitor.get_active_alerts(db)
        
        return {
            "token_health": health_status,
            "monitoring": monitoring_status,
            "active_alerts": active_alerts,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting token health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get token health: {str(e)}")


@router.post("/refresh")
async def manual_token_refresh(
    force: bool = False,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Manually trigger token refresh
    """
    try:
        start_time = datetime.now()
        
        # Get fresh access token
        access_token = await token_manager.get_valid_access_token(db, force_refresh=force)
        
        response_time = (datetime.now() - start_time).total_seconds()
        
        # Get updated health status
        health_status = await token_manager.get_token_health_status(db)
        
        return {
            "success": True,
            "message": "Token refreshed successfully",
            "response_time_seconds": response_time,
            "token_health": health_status,
            "access_token_present": bool(access_token),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Manual token refresh failed: {e}")
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {str(e)}")


@router.get("/alerts")
async def get_active_alerts(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get all active token alerts
    """
    try:
        alerts = await token_monitor.get_active_alerts(db)
        
        # Group alerts by severity
        alerts_by_severity = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": []
        }
        
        for alert in alerts:
            severity = alert.get("severity", "medium")
            alerts_by_severity[severity].append(alert)
        
        return {
            "alerts": alerts,
            "alerts_by_severity": alerts_by_severity,
            "total_alerts": len(alerts),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    acknowledged_by: str = "api_user",
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Acknowledge a specific alert
    """
    try:
        success = await token_monitor.acknowledge_alert(db, alert_id, acknowledged_by)
        
        if success:
            return {
                "success": True,
                "message": f"Alert {alert_id} acknowledged",
                "acknowledged_by": acknowledged_by,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Alert not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to acknowledge alert: {str(e)}")


@router.get("/refresh-logs")
async def get_refresh_logs(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get token refresh logs for monitoring and debugging
    """
    try:
        logs = db.query(TokenRefreshLog).order_by(
            TokenRefreshLog.attempted_at.desc()
        ).offset(offset).limit(limit).all()
        
        log_data = []
        for log in logs:
            log_data.append({
                "id": log.id,
                "attempted_at": log.attempted_at.isoformat(),
                "success": log.success,
                "error_message": log.error_message,
                "response_time_ms": log.response_time_ms,
                "trigger_reason": log.trigger_reason,
                "retry_count": log.retry_count
            })
        
        # Calculate success rate
        total_logs = len(log_data)
        successful_logs = sum(1 for log in log_data if log["success"])
        success_rate = (successful_logs / total_logs * 100) if total_logs > 0 else 0
        
        return {
            "logs": log_data,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total_logs
            },
            "statistics": {
                "total_attempts": total_logs,
                "successful_attempts": successful_logs,
                "success_rate_percent": round(success_rate, 2)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting refresh logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get refresh logs: {str(e)}")


@router.post("/monitoring/start")
async def start_monitoring(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Start token monitoring background service
    """
    try:
        if token_monitor.is_running:
            return {
                "success": True,
                "message": "Token monitoring is already running",
                "timestamp": datetime.now().isoformat()
            }
        
        background_tasks.add_task(token_monitor.start_monitoring)
        
        return {
            "success": True,
            "message": "Token monitoring started",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error starting monitoring: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start monitoring: {str(e)}")


@router.post("/monitoring/stop")
async def stop_monitoring() -> Dict[str, Any]:
    """
    Stop token monitoring background service
    """
    try:
        await token_monitor.stop_monitoring()
        
        return {
            "success": True,
            "message": "Token monitoring stopped",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error stopping monitoring: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop monitoring: {str(e)}")


@router.get("/monitoring/status")
async def get_monitoring_status() -> Dict[str, Any]:
    """
    Get current monitoring service status
    """
    try:
        status = await token_monitor.get_monitoring_status()
        return {
            "monitoring_status": status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting monitoring status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get monitoring status: {str(e)}")


@router.post("/test-connection")
async def test_zoho_connection(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Test Zoho CRM connection with current token
    """
    try:
        # Get valid access token
        access_token = await token_manager.get_valid_access_token(db)
        
        # Test connection by making a simple API call
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ZOHO_BASE_URL}/settings/modules",
                headers={
                    "Authorization": f"Zoho-oauthtoken {access_token}",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": "Zoho CRM connection successful",
                    "api_response": {
                        "status_code": response.status_code,
                        "modules_count": len(data.get("modules", [])) if data else 0
                    },
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "message": f"Zoho CRM connection failed: {response.status_code}",
                    "api_response": {
                        "status_code": response.status_code,
                        "error": response.text
                    },
                    "timestamp": datetime.now().isoformat()
                }
                
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
