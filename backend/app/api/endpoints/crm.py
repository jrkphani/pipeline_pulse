"""
Unified CRM API Router
Replaces scattered Zoho endpoints with single unified interface
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.database import get_db
from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
from app.services.zoho_crm.core.exceptions import (
    ZohoAPIError, ZohoAuthError, ZohoValidationError, 
    ZohoBulkOperationError, ZohoFieldError
)

router = APIRouter(prefix="/crm", tags=["Unified CRM"])


def get_crm_service(db: Session = Depends(get_db)) -> UnifiedZohoCRMService:
    """Dependency to get CRM service instance"""
    return UnifiedZohoCRMService(db)


# Authentication and Health Check Endpoints
@router.get("/health")
async def health_check(crm_service: UnifiedZohoCRMService = Depends(get_crm_service)) -> Dict[str, Any]:
    """Comprehensive health check of CRM integration"""
    try:
        return await crm_service.health_check()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/token/health")
async def get_token_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get comprehensive token health status"""
    try:
        from app.services.token_manager import token_manager
        health_status = await token_manager.get_token_health_status(db)

        return {
            "token_health": health_status,
            "timestamp": datetime.now().isoformat(),
            "status": "healthy" if health_status.get("status") == "healthy" else "warning"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get token health: {str(e)}")


@router.post("/token/refresh")
async def refresh_token_manual(
    force: bool = False,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Manually refresh token with health monitoring"""
    try:
        from app.services.token_manager import token_manager
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
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {str(e)}")


@router.get("/auth/status")
async def get_auth_status(crm_service: UnifiedZohoCRMService = Depends(get_crm_service)) -> Dict[str, Any]:
    """Check authentication status"""
    try:
        is_authenticated = await crm_service.check_auth()
        if is_authenticated:
            connection_info = await crm_service.validate_connection()
            return {
                "authenticated": True,
                "connection_info": connection_info
            }
        else:
            return {"authenticated": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth status check failed: {str(e)}")


@router.get("/user/info")
async def get_user_info(crm_service: UnifiedZohoCRMService = Depends(get_crm_service)) -> Dict[str, Any]:
    """Get current user information"""
    try:
        return await crm_service.get_user_info()
    except ZohoAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user info: {str(e)}")


# Deal Operations
@router.get("/deals")
async def get_deals(
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    fields: Optional[str] = Query(None, description="Comma-separated list of fields"),
    criteria: Optional[str] = Query(None, description="Search criteria"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Get deals from Zoho CRM"""
    try:
        field_list = fields.split(",") if fields else None
        deals = await crm_service.get_deals(limit, offset, field_list, criteria)
        
        return {
            "deals": deals,
            "total": len(deals),
            "limit": limit,
            "offset": offset,
            "has_more": len(deals) == limit
        }
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch deals: {str(e)}")


@router.get("/deals/{deal_id}")
async def get_deal_by_id(
    deal_id: str,
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Get specific deal by ID"""
    try:
        deal = await crm_service.get_deal_by_id(deal_id)
        if not deal:
            raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")
        return {"deal": deal}
    except HTTPException:
        raise
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch deal: {str(e)}")


@router.put("/deals/{deal_id}")
async def update_deal(
    deal_id: str,
    deal_data: Dict[str, Any],
    validate_conflicts: bool = Query(True, description="Enable conflict validation"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Update deal in Zoho CRM"""
    try:
        result = await crm_service.update_deal(deal_id, deal_data, validate_conflicts)
        return {
            "success": True,
            "deal_id": deal_id,
            "result": result
        }
    except ZohoValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update deal: {str(e)}")


@router.post("/deals")
async def create_deal(
    deal_data: Dict[str, Any],
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Create new deal in Zoho CRM"""
    try:
        result = await crm_service.create_deal(deal_data)
        return {
            "success": True,
            "result": result
        }
    except ZohoValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create deal: {str(e)}")


@router.delete("/deals/{deal_id}")
async def delete_deal(
    deal_id: str,
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Delete deal from Zoho CRM"""
    try:
        result = await crm_service.delete_deal(deal_id)
        return {
            "success": True,
            "deal_id": deal_id,
            "result": result
        }
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete deal: {str(e)}")


@router.post("/deals/search")
async def search_deals(
    search_criteria: Dict[str, Any],
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Search deals using criteria"""
    try:
        deals = await crm_service.search_deals(search_criteria)
        return {
            "deals": deals,
            "total": len(deals),
            "search_criteria": search_criteria
        }
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search deals: {str(e)}")


# Field Operations
@router.get("/fields/{module}")
async def get_module_fields(
    module: str = "Deals",
    force_refresh: bool = Query(False, description="Force refresh from Zoho"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Get field metadata for module"""
    try:
        fields = await crm_service.get_module_fields(module, force_refresh)
        
        # Filter out system fields and read-only fields for update operations
        updatable_fields = [
            field for field in fields 
            if not field.get("is_read_only") and not field.get("is_system_field")
        ]
        
        return {
            "fields": fields,
            "updatable_fields": updatable_fields,
            "total_fields": len(fields),
            "updatable_count": len(updatable_fields),
            "module": module
        }
    except ZohoFieldError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fields: {str(e)}")


@router.post("/fields/validate")
async def validate_field_value(
    field_name: str,
    value: Any,
    module: str = "Deals",
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Validate field value against Zoho constraints"""
    try:
        return await crm_service.validate_field_value(field_name, value, module)
    except ZohoFieldError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Field validation failed: {str(e)}")


# Bulk Operations
@router.post("/bulk/create")
async def bulk_create_deals(
    deals_data: List[Dict[str, Any]],
    background_tasks: BackgroundTasks,
    created_by: str = "api_user",
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Bulk create deals using async operations"""
    try:
        if len(deals_data) > 1000:
            raise HTTPException(status_code=400, detail="Maximum 1000 records per bulk operation")
        
        # For large operations, run in background
        if len(deals_data) > 100:
            # Start background task
            background_tasks.add_task(
                crm_service.bulk_create_deals, deals_data, created_by
            )
            return {
                "success": True,
                "message": "Bulk create operation started in background",
                "total_records": len(deals_data),
                "status": "processing"
            }
        else:
            # Run synchronously for smaller batches
            result = await crm_service.bulk_create_deals(deals_data, created_by)
            return result
            
    except ZohoBulkOperationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk create failed: {str(e)}")


@router.post("/bulk/update")
async def bulk_update_deals(
    updates_data: List[Dict[str, Any]],
    background_tasks: BackgroundTasks,
    created_by: str = "api_user",
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Bulk update deals using async operations"""
    try:
        if len(updates_data) > 1000:
            raise HTTPException(status_code=400, detail="Maximum 1000 records per bulk operation")
        
        # Validate all records have IDs
        for record in updates_data:
            if not record.get("id"):
                raise HTTPException(status_code=400, detail="All records must have 'id' field for bulk update")
        
        # For large operations, run in background
        if len(updates_data) > 100:
            background_tasks.add_task(
                crm_service.bulk_update_deals, updates_data, created_by
            )
            return {
                "success": True,
                "message": "Bulk update operation started in background",
                "total_records": len(updates_data),
                "status": "processing"
            }
        else:
            result = await crm_service.bulk_update_deals(updates_data, created_by)
            return result
            
    except HTTPException:
        raise
    except ZohoBulkOperationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk update failed: {str(e)}")


@router.post("/bulk/upsert")
async def bulk_upsert_deals(
    deals_data: List[Dict[str, Any]],
    background_tasks: BackgroundTasks,
    duplicate_check_fields: Optional[List[str]] = None,
    created_by: str = "api_user",
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Bulk upsert (insert or update) deals"""
    try:
        if len(deals_data) > 1000:
            raise HTTPException(status_code=400, detail="Maximum 1000 records per bulk operation")
        
        # For large operations, run in background
        if len(deals_data) > 100:
            background_tasks.add_task(
                crm_service.bulk_upsert_deals, deals_data, duplicate_check_fields, created_by
            )
            return {
                "success": True,
                "message": "Bulk upsert operation started in background",
                "total_records": len(deals_data),
                "status": "processing"
            }
        else:
            result = await crm_service.bulk_upsert_deals(deals_data, duplicate_check_fields, created_by)
            return result
            
    except ZohoBulkOperationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk upsert failed: {str(e)}")


# Sync Operations
@router.post("/sync/deals")
async def sync_deals_with_local_db(
    local_records: List[Dict[str, Any]],
    created_by: str = "sync_service",
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Sync deals between Zoho CRM and local database"""
    try:
        result = await crm_service.sync_deals_with_local_db(local_records, created_by)
        return result
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync operation failed: {str(e)}")


# Operation Tracking
@router.get("/operations/{operation_id}")
async def get_operation_status(
    operation_id: str,
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Get status of a CRM operation"""
    try:
        status = await crm_service.get_sync_operation_status(operation_id)
        if not status:
            raise HTTPException(status_code=404, detail=f"Operation {operation_id} not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get operation status: {str(e)}")


@router.get("/operations")
async def get_recent_operations(
    limit: int = Query(10, ge=1, le=50),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Get recent CRM operations"""
    try:
        operations = await crm_service.get_recent_sync_operations(limit)
        return {
            "operations": operations,
            "total": len(operations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get operations: {str(e)}")


@router.get("/operations/{operation_id}/conflicts")
async def get_operation_conflicts(
    operation_id: str,
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Get conflicts for specific operation"""
    try:
        conflicts = await crm_service.get_operation_conflicts(operation_id)
        return {
            "operation_id": operation_id,
            "conflicts": conflicts,
            "total_conflicts": len(conflicts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conflicts: {str(e)}")


# Legacy Compatibility Endpoints (for backward compatibility during migration)
@router.post("/auth/exchange-code")
async def exchange_authorization_code(
    code: str,
    client_id: str,
    client_secret: str,
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """Exchange authorization code for refresh token (legacy compatibility)"""
    try:
        result = await crm_service.exchange_code_for_tokens(code, client_id, client_secret)
        return {
            "success": True,
            "message": "Authorization code exchanged successfully",
            "result": result
        }
    except ZohoAuthError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code exchange failed: {str(e)}")
