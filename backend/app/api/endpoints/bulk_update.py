"""
Bulk Update API endpoints for updating multiple CRM records
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from app.core.database import get_db
from app.services.bulk_update_service import BulkUpdateService
from app.services.zoho_field_service import ZohoFieldService
from app.models.bulk_update import (
    BulkUpdateRequest, 
    SyncToCRMRequest, 
    ZohoField,
    BulkUpdateBatch
)

router = APIRouter(prefix="/bulk-update", tags=["Bulk Update"])

# Initialize services
bulk_update_service = BulkUpdateService()
zoho_field_service = ZohoFieldService()

@router.get("/records")
async def get_all_records(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get paginated list of all CRM records available for bulk update
    """
    try:
        records = await bulk_update_service.get_records_for_update(
            page=page,
            limit=limit,
            search=search,
            db=db
        )
        
        return {
            "records": records["data"],
            "total": records["total"],
            "page": page,
            "limit": limit,
            "total_pages": (records["total"] + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch records: {str(e)}")

@router.get("/zoho/fields")
async def get_zoho_fields(
    module: str = Query("Deals", description="Zoho CRM module name"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get available fields and their validation rules from Zoho CRM
    """
    try:
        fields = await zoho_field_service.get_module_fields(module)
        
        # Filter out system fields and read-only fields
        updatable_fields = [
            field for field in fields 
            if not field.get("is_read_only") and not field.get("is_system_field")
        ]
        
        return {
            "fields": updatable_fields,
            "total_fields": len(updatable_fields),
            "module": module
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Zoho fields: {str(e)}")

@router.get("/zoho/field/{field_name}/values")
async def get_field_values(
    field_name: str,
    module: str = Query("Deals", description="Zoho CRM module name"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get available values for a picklist field
    """
    try:
        # First check if field exists and is a picklist
        fields = await zoho_field_service.get_module_fields(module)
        field = next((f for f in fields if f["api_name"] == field_name), None)
        
        if not field:
            raise HTTPException(
                status_code=404, 
                detail=f"Field '{field_name}' not found in module '{module}'"
            )
        
        if not field.get("has_picklist"):
            return {
                "field_name": field_name,
                "has_picklist": False,
                "values": [],
                "message": "This field does not have predefined values"
            }
        
        values = await zoho_field_service.get_field_picklist_values(field_name, module)
        
        return {
            "field_name": field_name,
            "has_picklist": True,
            "values": values,
            "total_values": len(values)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch field values: {str(e)}")

@router.post("/bulk-update")
async def bulk_update_records(
    request: BulkUpdateRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Update multiple records in local database
    """
    try:
        # Validate field exists in Zoho CRM
        fields = await zoho_field_service.get_module_fields("Deals")
        field = next((f for f in fields if f["api_name"] == request.field_name), None)
        
        if not field:
            raise HTTPException(
                status_code=400,
                detail=f"Field '{request.field_name}' is not available in Zoho CRM. Please select a different field."
            )
        
        if field.get("is_read_only"):
            raise HTTPException(
                status_code=400,
                detail=f"Field '{request.field_name}' is read-only and cannot be updated."
            )
        
        # Validate field value if it's a picklist
        if field.get("has_picklist"):
            valid_values = await zoho_field_service.get_field_picklist_values(request.field_name, "Deals")
            valid_value_list = [v["actual_value"] for v in valid_values]
            
            if str(request.field_value) not in valid_value_list:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid value '{request.field_value}' for field '{request.field_name}'. Valid values are: {valid_value_list}"
                )
        
        # Execute bulk update
        result = await bulk_update_service.execute_bulk_update(request, db)
        
        return {
            "success": True,
            "batch_id": result["batch_id"],
            "total_records": result["total_records"],
            "successful_updates": result["successful_updates"],
            "failed_updates": result["failed_updates"],
            "status": result["status"],
            "message": f"Successfully updated {result['successful_updates']} out of {result['total_records']} records"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk update failed: {str(e)}")

@router.post("/sync-to-crm")
async def sync_updates_to_crm(
    request: SyncToCRMRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Push updates to Zoho CRM in background
    """
    try:
        # Validate batch exists
        batch = await bulk_update_service.get_batch_details(request.update_batch_id, db)
        if not batch:
            raise HTTPException(
                status_code=404,
                detail=f"Update batch '{request.update_batch_id}' not found"
            )
        
        if batch["sync_status"] == "syncing":
            raise HTTPException(
                status_code=409,
                detail="Sync is already in progress for this batch"
            )
        
        if batch["sync_status"] == "synced":
            return {
                "success": True,
                "batch_id": request.update_batch_id,
                "message": "This batch has already been synced to CRM",
                "sync_status": "synced"
            }
        
        # Start background sync
        background_tasks.add_task(
            bulk_update_service.sync_to_crm_background,
            request.update_batch_id,
            db
        )
        
        return {
            "success": True,
            "batch_id": request.update_batch_id,
            "message": "Sync to CRM started in background",
            "sync_status": "syncing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start CRM sync: {str(e)}")

@router.get("/batch/{batch_id}/status")
async def get_batch_status(
    batch_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get status of a bulk update batch
    """
    try:
        batch_details = await bulk_update_service.get_batch_details(batch_id, db)
        
        if not batch_details:
            raise HTTPException(
                status_code=404,
                detail=f"Batch '{batch_id}' not found"
            )
        
        # Get individual record statuses
        record_statuses = await bulk_update_service.get_batch_record_statuses(batch_id, db)
        
        return {
            "batch_id": batch_id,
            "batch_details": batch_details,
            "record_statuses": record_statuses,
            "summary": {
                "total_records": batch_details["total_records"],
                "successful_updates": batch_details["successful_updates"],
                "failed_updates": batch_details["failed_updates"],
                "sync_status": batch_details["sync_status"],
                "created_at": batch_details["created_at"],
                "updated_at": batch_details["updated_at"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get batch status: {str(e)}")

@router.get("/batches")
async def get_update_batches(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    created_by: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get list of bulk update batches
    """
    try:
        batches = await bulk_update_service.get_update_batches(
            page=page,
            limit=limit,
            created_by=created_by,
            db=db
        )
        
        return {
            "batches": batches["data"],
            "total": batches["total"],
            "page": page,
            "limit": limit,
            "total_pages": (batches["total"] + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch update batches: {str(e)}")

@router.delete("/batch/{batch_id}")
async def delete_batch(
    batch_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete a bulk update batch and its records
    """
    try:
        success = await bulk_update_service.delete_batch(batch_id, db)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Batch '{batch_id}' not found"
            )
        
        return {
            "success": True,
            "message": f"Batch '{batch_id}' deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete batch: {str(e)}")

@router.post("/validate-field")
async def validate_field(
    field_name: str,
    field_value: str,
    module: str = Query("Deals"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Validate if a field and value are valid for bulk update
    """
    try:
        validation_result = await bulk_update_service.validate_field_and_value(
            field_name=field_name,
            field_value=field_value,
            module=module,
            db=db
        )
        
        return validation_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Field validation failed: {str(e)}")
