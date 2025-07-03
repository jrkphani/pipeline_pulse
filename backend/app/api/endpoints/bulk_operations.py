"""
Bulk Operations API Endpoints
Handles bulk updates and mass operations with Zoho CRM
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
from app.services.zoho_crm.modules.bulk_async import BulkAsyncService
from app.services.sync_status_service import SyncStatusService
from app.services.zoho_crm.core.exceptions import (
    ZohoAPIError, ZohoAuthError, ZohoValidationError, ZohoBulkOperationError
)

router = APIRouter(prefix="/bulk", tags=["Bulk Operations"])


def get_crm_service(db: Session = Depends(get_db)) -> UnifiedZohoCRMService:
    """Dependency to get CRM service instance"""
    return UnifiedZohoCRMService(db)


def get_bulk_service(db: Session = Depends(get_db)) -> BulkAsyncService:
    """Dependency to get bulk async service instance"""
    return BulkAsyncService(db)


def get_status_service(db: Session = Depends(get_db)) -> SyncStatusService:
    """Dependency to get sync status service instance"""
    return SyncStatusService(db)


@router.post("/small-batch")
async def small_batch_update(
    records: List[Dict[str, Any]],
    operation: str = Query("update", regex="^(create|update|upsert)$"),
    module: str = Query("Deals", description="CRM module to operate on"),
    validate_before_update: bool = Query(True, description="Validate records before updating"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Small batch operations (≤100 records)
    
    Performs synchronous bulk operations for small batches
    Suitable for real-time updates and immediate feedback
    """
    try:
        # Validate batch size
        if len(records) > 100:
            raise HTTPException(
                status_code=400, 
                detail=f"Small batch limit is 100 records. Got {len(records)} records. Use /bulk/mass-update for larger batches."
            )
        
        if len(records) == 0:
            raise HTTPException(status_code=400, detail="No records provided")
        
        # Validate operation requirements
        if operation in ["update", "upsert"]:
            records_without_id = [i for i, record in enumerate(records) if not record.get("id")]
            if records_without_id and operation == "update":
                raise HTTPException(
                    status_code=400,
                    detail=f"Update operation requires 'id' field. Missing IDs in records at positions: {records_without_id}"
                )
        
        # Pre-validation if requested
        validation_errors = []
        if validate_before_update:
            for i, record in enumerate(records):
                try:
                    # Validate each record
                    validation = await crm_service.validate_record_data(record, module)
                    if not validation.get("valid", False):
                        validation_errors.append({
                            "record_index": i,
                            "record_id": record.get("id"),
                            "errors": validation.get("errors", [])
                        })
                except Exception as e:
                    validation_errors.append({
                        "record_index": i,
                        "record_id": record.get("id"),
                        "errors": [str(e)]
                    })
        
        if validation_errors:
            return {
                "success": False,
                "message": "Validation failed for some records",
                "validation_errors": validation_errors,
                "total_records": len(records),
                "failed_validation": len(validation_errors)
            }
        
        # Perform the operation
        start_time = datetime.now()
        
        if operation == "create":
            result = await crm_service.bulk_create_deals(records, "small_batch_api")
        elif operation == "update":
            result = await crm_service.bulk_update_deals(records, "small_batch_api")
        else:  # upsert
            result = await crm_service.bulk_upsert_deals(records, None, "small_batch_api")
        
        operation_duration = (datetime.now() - start_time).total_seconds()
        
        return {
            "success": True,
            "operation": operation,
            "module": module,
            "total_records": len(records),
            "operation_duration_seconds": operation_duration,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except ZohoBulkOperationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ZohoValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Small batch operation failed: {str(e)}")


@router.post("/mass-update")
async def mass_update_operation(
    records: List[Dict[str, Any]],
    background_tasks: BackgroundTasks,
    operation: str = Query("update", regex="^(create|update|upsert)$"),
    module: str = Query("Deals", description="CRM module to operate on"),
    batch_size: int = Query(100, ge=10, le=100, description="Size of each batch"),
    validate_before_update: bool = Query(False, description="Validate records before updating"),
    bulk_service: BulkAsyncService = Depends(get_bulk_service),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Mass update operations (≤50,000 records)
    
    Performs asynchronous bulk operations for large batches
    Uses background processing with status tracking
    """
    try:
        # Validate batch size
        if len(records) > 50000:
            raise HTTPException(
                status_code=400,
                detail=f"Mass update limit is 50,000 records. Got {len(records)} records."
            )
        
        if len(records) == 0:
            raise HTTPException(status_code=400, detail="No records provided")
        
        # Generate session ID for tracking
        session_id = str(uuid.uuid4())
        
        # Validate operation requirements
        if operation in ["update", "upsert"]:
            records_without_id = [i for i, record in enumerate(records) if not record.get("id")]
            if records_without_id and operation == "update":
                raise HTTPException(
                    status_code=400,
                    detail=f"Update operation requires 'id' field. Missing IDs in {len(records_without_id)} records."
                )
        
        # Initialize operation status
        await status_service.initialize_bulk_operation(
            session_id=session_id,
            operation_type=f"mass_{operation}",
            module=module,
            total_records=len(records),
            batch_size=batch_size,
            validate_before_update=validate_before_update
        )
        
        # Start background mass operation
        background_tasks.add_task(
            bulk_service.perform_mass_operation,
            session_id=session_id,
            records=records,
            operation=operation,
            module=module,
            batch_size=batch_size,
            validate_before_update=validate_before_update
        )
        
        return {
            "success": True,
            "message": f"Mass {operation} operation initiated",
            "session_id": session_id,
            "operation": operation,
            "module": module,
            "total_records": len(records),
            "batch_size": batch_size,
            "estimated_batches": (len(records) + batch_size - 1) // batch_size,
            "status": "initiated",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mass update operation failed: {str(e)}")


@router.get("/operation/{session_id}/status")
async def get_bulk_operation_status(
    session_id: str,
    include_details: bool = Query(False, description="Include detailed batch results"),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get detailed status of a bulk operation
    
    Returns progress, metrics, and error information for the operation
    """
    try:
        status = await status_service.get_bulk_operation_status(session_id)
        
        if not status:
            raise HTTPException(status_code=404, detail=f"Bulk operation {session_id} not found")
        
        response = {
            "session_id": session_id,
            "status": status.get("status"),
            "operation_type": status.get("operation_type"),
            "module": status.get("module"),
            "progress": status.get("progress", {}),
            "metrics": status.get("metrics", {}),
            "started_at": status.get("started_at"),
            "completed_at": status.get("completed_at"),
            "duration_seconds": status.get("duration_seconds"),
            "last_updated": status.get("last_updated")
        }
        
        # Include errors if any
        if status.get("errors"):
            response["errors"] = status["errors"]
        
        # Include detailed batch results if requested
        if include_details and status.get("batch_results"):
            response["batch_results"] = status["batch_results"]
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get operation status: {str(e)}")


@router.post("/operation/{session_id}/cancel")
async def cancel_bulk_operation(
    session_id: str,
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Cancel an active bulk operation
    
    Marks the operation as cancelled and prevents further batch processing
    """
    try:
        result = await status_service.cancel_bulk_operation(session_id)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Bulk operation {session_id} not found or cannot be cancelled"
            )
        
        return {
            "success": True,
            "message": f"Bulk operation {session_id} cancelled",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel operation: {str(e)}")


@router.get("/operation/{session_id}/results")
async def get_bulk_operation_results(
    session_id: str,
    include_successful: bool = Query(False, description="Include successful record results"),
    include_failed: bool = Query(True, description="Include failed record results"),
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get detailed results of a bulk operation
    
    Returns individual record results with pagination
    """
    try:
        results = await status_service.get_bulk_operation_results(
            session_id=session_id,
            include_successful=include_successful,
            include_failed=include_failed,
            limit=limit,
            offset=offset
        )
        
        if not results:
            raise HTTPException(status_code=404, detail=f"Results for operation {session_id} not found")
        
        return {
            "session_id": session_id,
            "results": results.get("results", []),
            "total_results": results.get("total_results", 0),
            "limit": limit,
            "offset": offset,
            "has_more": results.get("has_more", False),
            "summary": results.get("summary", {}),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get operation results: {str(e)}")


@router.get("/operations/active")
async def get_active_bulk_operations(
    limit: int = Query(10, ge=1, le=50),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get currently active bulk operations
    
    Returns list of operations that are currently running or queued
    """
    try:
        active_operations = await status_service.get_active_bulk_operations(limit)
        
        return {
            "active_operations": active_operations,
            "total_active": len(active_operations),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active operations: {str(e)}")


@router.get("/operations/recent")
async def get_recent_bulk_operations(
    limit: int = Query(20, ge=1, le=100),
    include_completed: bool = Query(True, description="Include completed operations"),
    include_failed: bool = Query(True, description="Include failed operations"),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get recent bulk operations
    
    Returns list of recent operations with their status
    """
    try:
        recent_operations = await status_service.get_recent_bulk_operations(
            limit=limit,
            include_completed=include_completed,
            include_failed=include_failed
        )
        
        return {
            "recent_operations": recent_operations,
            "total_returned": len(recent_operations),
            "filters": {
                "include_completed": include_completed,
                "include_failed": include_failed
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent operations: {str(e)}")


@router.post("/validate")
async def validate_bulk_data(
    records: List[Dict[str, Any]],
    operation: str = Query("update", regex="^(create|update|upsert)$"),
    module: str = Query("Deals", description="CRM module to validate against"),
    batch_size: int = Query(50, ge=1, le=100, description="Validation batch size"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Validate bulk data without performing operations
    
    Validates record structure, field constraints, and data types
    """
    try:
        if len(records) > 1000:
            raise HTTPException(
                status_code=400,
                detail="Validation limit is 1000 records. For larger datasets, use smaller batches."
            )
        
        validation_results = []
        validation_errors = []
        
        # Process records in batches for validation
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            for j, record in enumerate(batch):
                record_index = i + j
                try:
                    validation = await crm_service.validate_record_data(record, module)
                    
                    validation_result = {
                        "record_index": record_index,
                        "record_id": record.get("id"),
                        "valid": validation.get("valid", False),
                        "warnings": validation.get("warnings", [])
                    }
                    
                    if not validation.get("valid", False):
                        validation_result["errors"] = validation.get("errors", [])
                        validation_errors.append(validation_result)
                    
                    validation_results.append(validation_result)
                    
                except Exception as e:
                    error_result = {
                        "record_index": record_index,
                        "record_id": record.get("id"),
                        "valid": False,
                        "errors": [str(e)]
                    }
                    validation_results.append(error_result)
                    validation_errors.append(error_result)
        
        valid_count = len([r for r in validation_results if r.get("valid", False)])
        
        return {
            "validation_summary": {
                "total_records": len(records),
                "valid_records": valid_count,
                "invalid_records": len(validation_errors),
                "validation_passed": len(validation_errors) == 0
            },
            "validation_results": validation_results,
            "validation_errors": validation_errors,
            "operation": operation,
            "module": module,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/health")
async def get_bulk_operations_health(
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get health status of bulk operations system
    
    Returns metrics about operation performance and system health
    """
    try:
        health_metrics = await status_service.get_bulk_operations_health()
        
        return {
            "system_health": health_metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get bulk operations health: {str(e)}")