"""
Simple test endpoint for debugging connection issues
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.crm_record import CrmRecord
from app.models.crm_sync_sessions import CRMSyncSession

router = APIRouter()

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify API connection"""
    return {
        "status": "success",
        "message": "API connection working",
        "timestamp": datetime.now().isoformat(),
        "server": "Pipeline Pulse Backend"
    }

@router.get("/database-status")
async def check_database_status(db: Session = Depends(get_db)):
    """Check database status and data counts"""
    try:
        # Check CRM records
        crm_record_count = db.query(CrmRecord).count()
        
        # Check sync sessions
        sync_session_count = db.query(CRMSyncSession).count()
        recent_sync = db.query(CRMSyncSession).order_by(CRMSyncSession.started_at.desc()).first()
        
        result = {
            "status": "success",
            "database_connected": True,
            "crm_records_count": crm_record_count,
            "sync_sessions_count": sync_session_count,
            "last_sync": {
                "id": recent_sync.id if recent_sync else None,
                "status": recent_sync.status if recent_sync else None,
                "started_at": recent_sync.started_at.isoformat() if recent_sync else None,
                "error": recent_sync.error_message if recent_sync else None
            } if recent_sync else None,
            "timestamp": datetime.now().isoformat()
        }
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "database_connected": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/zoho/status")
async def simple_zoho_status():
    """Test Zoho SDK status using improved implementation"""
    try:
        from app.services.zoho_sdk_manager import get_sdk_manager
        
        # Get SDK manager (now using improved implementation)
        manager = get_sdk_manager()
        
        # Validate initialization status
        status = manager.validate_initialization()
        
        return {
            "connected": status.get("initialized", False),
            "status": status.get("status", "unknown"),
            "message": status.get("message", "Status unknown"),
            "sdk_version": status.get("config", {}).get("sdk_version", "unknown"),
            "implementation": "improved_with_official_patterns",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "connected": False,
            "status": "error",
            "message": f"SDK status check failed: {str(e)}",
            "implementation": "improved_with_official_patterns",
            "timestamp": datetime.now().isoformat()
        }

@router.get("/sync/health")
async def get_sync_overview(db: Session = Depends(get_db)):
    """Get sync overview for dashboard health monitoring"""
    try:
        # Get actual record count
        crm_record_count = db.query(CrmRecord).count()
        
        # Get recent sync session
        recent_sync = db.query(CRMSyncSession).order_by(CRMSyncSession.started_at.desc()).first()
        
        # Calculate health score based on sync status
        health_score = 85  # Default healthy score
        overall_health = "healthy"
        connection_status = "connected"
        last_sync_time = None
        last_sync_records = 0
        
        if recent_sync:
            last_sync_time = recent_sync.started_at.isoformat() if recent_sync.started_at else None
            last_sync_records = recent_sync.processed_records or 0
            
            if recent_sync.status == "FAILED":
                health_score = 30
                overall_health = "error"
                connection_status = "disconnected"
            elif recent_sync.status == "IN_PROGRESS":
                health_score = 70
                overall_health = "warning"
                connection_status = "partial"
        
        # Calculate success rate from recent syncs
        recent_syncs = db.query(CRMSyncSession).order_by(CRMSyncSession.started_at.desc()).limit(10).all()
        successful_syncs = len([s for s in recent_syncs if s.status == "COMPLETED"])
        success_rate = (successful_syncs / len(recent_syncs) * 100) if recent_syncs else 0
        
        return {
            "overall_health": overall_health,
            "health_score": health_score,
            "connection_status": connection_status,
            "active_connections": 1 if connection_status == "connected" else 0,
            "success_rate": success_rate,
            "active_sync": None,  # No active sync currently
            "recent_issues": [],  # No recent issues for now
            "total_records": crm_record_count,
            "last_sync_time": last_sync_time,
            "last_sync_records": last_sync_records,
            "pending_conflicts": 0,
            "avg_sync_time": "2.5 min"
        }
        
    except Exception as e:
        return {
            "overall_health": "error",
            "health_score": 0,
            "connection_status": "disconnected",
            "active_connections": 0,
            "success_rate": 0,
            "active_sync": None,
            "recent_issues": [{"severity": "high", "message": f"Health check failed: {str(e)}", "timestamp": datetime.now().isoformat()}],
            "total_records": 0,
            "last_sync_time": None,
            "last_sync_records": 0,
            "pending_conflicts": 0,
            "avg_sync_time": "N/A"
        }

@router.get("/sync/dashboard-data")
async def get_data_summary(db: Session = Depends(get_db)):
    """Get data summary for dashboard with live CRM record counts"""
    try:
        # Get actual CRM record count from database
        crm_record_count = db.query(CrmRecord).count()
        
        # Calculate data freshness based on last sync time
        recent_sync = db.query(CRMSyncSession).order_by(CRMSyncSession.started_at.desc()).first()
        data_freshness = 0
        last_updated = datetime.now().isoformat()
        
        if recent_sync and recent_sync.started_at:
            time_diff = datetime.now() - recent_sync.started_at
            data_freshness = time_diff.total_seconds() / 60  # minutes
            last_updated = recent_sync.started_at.isoformat()
        
        # Return structure expected by frontend
        return {
            "total_records": crm_record_count,
            "records_by_type": {
                "deals": crm_record_count,
                "contacts": 0,  # Add when implemented
                "accounts": 0,  # Add when implemented
            },
            "last_updated": last_updated,
            "data_freshness": data_freshness
        }
        
    except Exception as e:
        # Fallback to default structure
        return {
            "total_records": 0,
            "records_by_type": {
                "deals": 0,
                "contacts": 0,
                "accounts": 0,
            },
            "last_updated": datetime.now().isoformat(),
            "data_freshness": 0
        }

@router.get("/o2r/dashboard/summary")
async def simple_o2r_summary():
    """Simple O2R dashboard summary"""
    return {
        "status": "success",
        "data": {
            "total_opportunities": 0,
            "active_opportunities": 0,
            "completed_opportunities": 0,
            "total_revenue": 0
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/zoho/real-data")
async def test_real_zoho_data():
    """Test fetching real data from Zoho CRM using the SDK"""
    try:
        from app.services.async_zoho_wrapper import AsyncZohoWrapper
        
        # Try to fetch real deals using the async wrapper
        async with AsyncZohoWrapper() as wrapper:
            response = await wrapper.get_records(
                "Deals",
                page=1,
                per_page=5,
                fields=["Deal_Name", "Amount", "Stage", "Account_Name", "Owner"]
            )
            
            return {
                "status": "success",
                "message": "Real Zoho data fetched successfully",
                "data": response,
                "timestamp": datetime.now().isoformat()
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch real Zoho data: {str(e)}",
            "error_type": type(e).__name__,
            "timestamp": datetime.now().isoformat()
        }