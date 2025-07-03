"""
Live Sync API Endpoints
Handles real-time synchronization with Zoho CRM
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.services.data_sync_service import DataSyncService
from app.services.sync_status_service import SyncStatusService
from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
from app.services.zoho_crm.core.exceptions import (
    ZohoAPIError, ZohoAuthError, ZohoValidationError
)

router = APIRouter(prefix="/sync", tags=["Live Sync"])


def get_sync_service(db: Session = Depends(get_db)) -> DataSyncService:
    """Dependency to get sync service instance"""
    return DataSyncService(db)


def get_status_service(db: Session = Depends(get_db)) -> SyncStatusService:
    """Dependency to get sync status service instance"""
    return SyncStatusService(db)


def get_crm_service(db: Session = Depends(get_db)) -> UnifiedZohoCRMService:
    """Dependency to get CRM service instance"""
    return UnifiedZohoCRMService(db)


@router.post("/full")
async def trigger_full_sync(
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Force sync even if recently completed"),
    include_metadata: bool = Query(True, description="Include field metadata refresh"),
    sync_service: DataSyncService = Depends(get_sync_service),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Trigger full synchronization with Zoho CRM
    
    This performs a complete sync of all deals, fields, and metadata
    """
    try:
        # Generate session ID for tracking
        session_id = str(uuid.uuid4())
        
        # Check if sync is already in progress
        current_status = await status_service.get_current_sync_status()
        if current_status and current_status.get("status") == "in_progress" and not force:
            return {
                "success": False,
                "message": "Sync already in progress",
                "current_session": current_status.get("session_id"),
                "session_id": session_id,
                "status": "rejected"
            }
        
        # Initialize sync status
        await status_service.initialize_sync_session(
            session_id=session_id,
            sync_type="full",
            include_metadata=include_metadata
        )
        
        # Start background sync
        background_tasks.add_task(
            sync_service.perform_full_sync,
            session_id=session_id,
            include_metadata=include_metadata
        )
        
        return {
            "success": True,
            "message": "Full sync initiated",
            "session_id": session_id,
            "sync_type": "full",
            "include_metadata": include_metadata,
            "status": "initiated",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger full sync: {str(e)}")


@router.post("/incremental")
async def trigger_incremental_sync(
    background_tasks: BackgroundTasks,
    since_hours: int = Query(1, ge=1, le=168, description="Sync changes from last N hours"),
    sync_service: DataSyncService = Depends(get_sync_service),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Trigger incremental synchronization with Zoho CRM
    
    This syncs only records modified since the specified time
    """
    try:
        # Generate session ID for tracking
        session_id = str(uuid.uuid4())
        
        # Check if sync is already in progress
        current_status = await status_service.get_current_sync_status()
        if current_status and current_status.get("status") == "in_progress":
            return {
                "success": False,
                "message": "Sync already in progress",
                "current_session": current_status.get("session_id"),
                "session_id": session_id,
                "status": "rejected"
            }
        
        # Initialize sync status
        await status_service.initialize_sync_session(
            session_id=session_id,
            sync_type="incremental",
            since_hours=since_hours
        )
        
        # Start background sync
        background_tasks.add_task(
            sync_service.perform_incremental_sync,
            session_id=session_id,
            since_hours=since_hours
        )
        
        return {
            "success": True,
            "message": "Incremental sync initiated",
            "session_id": session_id,
            "sync_type": "incremental",
            "since_hours": since_hours,
            "status": "initiated",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger incremental sync: {str(e)}")


@router.get("/status/{session_id}")
async def get_sync_progress(
    session_id: str,
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get detailed progress information for a specific sync session
    """
    try:
        status = await status_service.get_sync_session_status(session_id)
        
        if not status:
            raise HTTPException(status_code=404, detail=f"Sync session {session_id} not found")
        
        return {
            "session_id": session_id,
            "status": status.get("status"),
            "sync_type": status.get("sync_type"),
            "progress": status.get("progress", {}),
            "metrics": status.get("metrics", {}),
            "errors": status.get("errors", []),
            "started_at": status.get("started_at"),
            "completed_at": status.get("completed_at"),
            "duration_seconds": status.get("duration_seconds"),
            "last_updated": status.get("last_updated")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sync progress: {str(e)}")


@router.get("/status/current")
async def get_current_sync_status(
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get current synchronization status
    
    Returns information about any active sync or the last completed sync
    """
    try:
        current_status = await status_service.get_current_sync_status()
        recent_sessions = await status_service.get_recent_sync_sessions(limit=5)
        
        return {
            "current_sync": current_status,
            "recent_sessions": recent_sessions,
            "sync_health": await status_service.get_sync_health_status(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get current sync status: {str(e)}")


@router.post("/manual")
async def manual_sync_trigger(
    background_tasks: BackgroundTasks,
    sync_type: str = Query("incremental", regex="^(full|incremental)$"),
    force: bool = Query(False, description="Force sync even if recently completed"),
    record_ids: Optional[str] = Query(None, description="Comma-separated list of specific record IDs to sync"),
    sync_service: DataSyncService = Depends(get_sync_service),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Manual sync trigger with advanced options
    
    Allows for targeted sync of specific records or forced sync operations
    """
    try:
        # Generate session ID for tracking
        session_id = str(uuid.uuid4())
        
        # Parse record IDs if provided
        target_record_ids = None
        if record_ids:
            target_record_ids = [rid.strip() for rid in record_ids.split(",") if rid.strip()]
        
        # Check if sync is already in progress (unless forcing)
        if not force:
            current_status = await status_service.get_current_sync_status()
            if current_status and current_status.get("status") == "in_progress":
                return {
                    "success": False,
                    "message": "Sync already in progress. Use force=true to override.",
                    "current_session": current_status.get("session_id"),
                    "session_id": session_id,
                    "status": "rejected"
                }
        
        # Initialize sync status
        await status_service.initialize_sync_session(
            session_id=session_id,
            sync_type=f"manual_{sync_type}",
            target_records=target_record_ids,
            forced=force
        )
        
        # Start appropriate sync based on type
        if sync_type == "full":
            background_tasks.add_task(
                sync_service.perform_full_sync,
                session_id=session_id,
                target_records=target_record_ids
            )
        else:
            background_tasks.add_task(
                sync_service.perform_incremental_sync,
                session_id=session_id,
                since_hours=1,
                target_records=target_record_ids
            )
        
        return {
            "success": True,
            "message": f"Manual {sync_type} sync initiated",
            "session_id": session_id,
            "sync_type": f"manual_{sync_type}",
            "target_records": target_record_ids,
            "forced": force,
            "status": "initiated",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger manual sync: {str(e)}")


@router.delete("/session/{session_id}")
async def cancel_sync_session(
    session_id: str,
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Cancel an active sync session
    
    Note: This marks the session as cancelled but may not immediately stop
    background processes. Use with caution.
    """
    try:
        result = await status_service.cancel_sync_session(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail=f"Sync session {session_id} not found or not cancellable")
        
        return {
            "success": True,
            "message": f"Sync session {session_id} cancelled",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel sync session: {str(e)}")


@router.get("/health")
async def get_sync_health(
    status_service: SyncStatusService = Depends(get_status_service),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Get comprehensive sync health status
    
    Includes CRM connectivity, sync performance metrics, and error rates
    """
    try:
        # Get sync health metrics
        sync_health = await status_service.get_sync_health_status()
        
        # Get CRM connectivity status
        crm_health = await crm_service.health_check()
        
        # Combine health information
        overall_health = "healthy"
        if sync_health.get("status") != "healthy" or crm_health.get("status") != "healthy":
            overall_health = "degraded"
        
        return {
            "overall_status": overall_health,
            "sync_health": sync_health,
            "crm_health": crm_health,
            "last_successful_sync": sync_health.get("last_successful_sync"),
            "error_rate": sync_health.get("error_rate", 0),
            "performance_metrics": sync_health.get("performance_metrics", {}),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sync health: {str(e)}")


@router.get("/dashboard-data")
async def get_dashboard_data(
    db: Session = Depends(get_db),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Get live dashboard data from CRM using SDK
    
    Returns current pipeline summary for dashboard display
    """
    try:
        from app.services.async_zoho_wrapper import AsyncZohoWrapper
        from app.services.sdk_response_transformer import transform_records_response
        
        # Use SDK directly for dashboard data
        async with AsyncZohoWrapper() as wrapper:
            # Get deals with essential fields for dashboard
            dashboard_fields = [
                "Deal_Name", "Amount", "Stage", "Account_Name", "Owner",
                "Probability", "Closing_Date", "Created_Time", "Modified_Time",
                "Territory", "Service_Line", "Strategic_Account", "AWS_Funded"
            ]
            
            # Fetch deals using SDK
            sdk_response = await wrapper.get_records(
                "Deals", 
                page=1, 
                per_page=200,  # Zoho max per page
                fields=dashboard_fields
            )
            
            # Transform response
            result = transform_records_response(sdk_response)
            
            if result.get("status") != "success":
                return {
                    "deals": [],
                    "total_value": 0,
                    "total_count": 0,
                    "last_updated": datetime.now().isoformat(),
                    "status": "no_data",
                    "error": result.get("message", "Failed to fetch data")
                }
            
            deals = result.get("data", [])
            
            # Fetch additional pages if needed (up to 1000 total records)
            if len(deals) == 200:  # There might be more pages
                for page in range(2, 6):  # Pages 2-5 (total 1000 records max)
                    sdk_response = await wrapper.get_records(
                        "Deals", 
                        page=page, 
                        per_page=200, 
                        fields=dashboard_fields
                    )
                    
                    page_result = transform_records_response(sdk_response)
                    if page_result.get("status") == "success":
                        page_deals = page_result.get("data", [])
                        if page_deals:
                            deals.extend(page_deals)
                        if len(page_deals) < 200:  # Last page
                            break
                    else:
                        break
            
            # Calculate totals
            total_value = 0
            for deal in deals:
                amount = deal.get("amount", 0) or deal.get("Amount", 0) or 0
                try:
                    total_value += float(amount)
                except (ValueError, TypeError):
                    continue
            
            total_count = len(deals)
            
            return {
                "deals": deals[:100],  # Limit for performance on frontend
                "total_value": total_value,
                "total_count": total_count,
                "last_updated": datetime.now().isoformat(),
                "status": "success",
                "sdk_used": True
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data via SDK: {str(e)}")


@router.post("/validate")
async def validate_sync_configuration(
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Validate sync configuration and prerequisites
    
    Checks authentication, required fields, permissions, and connectivity
    """
    try:
        # Check authentication
        auth_status = await crm_service.check_auth()
        if not auth_status:
            return {
                "valid": False,
                "error": "CRM authentication failed",
                "details": "Please check your Zoho CRM credentials"
            }
        
        # Validate connection
        connection_info = await crm_service.validate_connection()
        
        # Check required permissions
        permissions_check = await crm_service.check_required_permissions()
        
        # Validate required fields exist
        fields_validation = await crm_service.validate_required_fields()
        
        all_valid = all([
            auth_status,
            connection_info.get("valid", False),
            permissions_check.get("valid", False),
            fields_validation.get("valid", False)
        ])
        
        return {
            "valid": all_valid,
            "authentication": {"valid": auth_status},
            "connection": connection_info,
            "permissions": permissions_check,
            "fields": fields_validation,
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoAuthError as e:
        return {
            "valid": False,
            "error": "Authentication error",
            "details": str(e)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")