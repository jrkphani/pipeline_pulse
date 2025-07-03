"""
Search and Record Management API Endpoints
Handles CRM record search, retrieval, and individual record operations
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.core.database import get_db
from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
from app.services.data_sync_service import DataSyncService
from app.services.zoho_crm.core.exceptions import (
    ZohoAPIError, ZohoAuthError, ZohoValidationError
)

router = APIRouter(prefix="/search", tags=["Search & Records"])


def get_crm_service(db: Session = Depends(get_db)) -> UnifiedZohoCRMService:
    """Dependency to get CRM service instance"""
    return UnifiedZohoCRMService(db)


def get_sync_service(db: Session = Depends(get_db)) -> DataSyncService:
    """Dependency to get sync service instance"""
    return DataSyncService(db)


@router.get("")
async def search_crm_records(
    query: str = Query(..., min_length=1, description="Search query string"),
    module: str = Query("Deals", description="CRM module to search in"),
    fields: Optional[str] = Query(None, description="Comma-separated list of fields to return"),
    criteria: Optional[str] = Query(None, description="Additional search criteria"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Search CRM records with advanced filtering
    
    Performs intelligent search across CRM records with support for:
    - Text search across multiple fields
    - Field-specific filtering
    - Sorting and pagination
    - Custom field inclusion
    """
    try:
        # Parse fields if provided
        field_list = None
        if fields:
            field_list = [f.strip() for f in fields.split(",") if f.strip()]
        
        # Build search parameters
        search_params = {
            "query": query,
            "module": module,
            "fields": field_list,
            "criteria": criteria,
            "limit": limit,
            "offset": offset,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        # Perform search
        search_results = await crm_service.search_records(search_params)
        
        # Calculate pagination info
        total_results = search_results.get("total", 0)
        has_more = (offset + limit) < total_results
        
        return {
            "search_query": query,
            "module": module,
            "results": search_results.get("records", []),
            "pagination": {
                "total": total_results,
                "limit": limit,
                "offset": offset,
                "has_more": has_more,
                "current_page": (offset // limit) + 1,
                "total_pages": (total_results + limit - 1) // limit
            },
            "search_metadata": {
                "fields_requested": field_list,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "criteria": criteria
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/advanced")
async def advanced_search(
    search_criteria: Dict[str, Any],
    module: str = Query("Deals", description="CRM module to search in"),
    fields: Optional[List[str]] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Advanced search with complex criteria
    
    Supports complex search criteria including:
    - Field-specific filters
    - Date range queries
    - Numeric comparisons
    - Multi-field AND/OR logic
    """
    try:
        # Validate search criteria
        if not search_criteria:
            raise HTTPException(status_code=400, detail="Search criteria cannot be empty")
        
        # Perform advanced search
        search_results = await crm_service.advanced_search(
            criteria=search_criteria,
            module=module,
            fields=fields,
            limit=limit,
            offset=offset
        )
        
        total_results = search_results.get("total", 0)
        has_more = (offset + limit) < total_results
        
        return {
            "search_criteria": search_criteria,
            "module": module,
            "results": search_results.get("records", []),
            "pagination": {
                "total": total_results,
                "limit": limit,
                "offset": offset,
                "has_more": has_more
            },
            "performance": {
                "query_time_ms": search_results.get("query_time_ms"),
                "records_scanned": search_results.get("records_scanned")
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ZohoValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced search failed: {str(e)}")


@router.get("/record/{record_id}")
async def get_record_details(
    record_id: str,
    module: str = Query("Deals", description="CRM module"),
    fields: Optional[str] = Query(None, description="Comma-separated list of fields"),
    include_related: bool = Query(False, description="Include related record data"),
    include_activities: bool = Query(False, description="Include activity history"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Get detailed information for a specific record
    
    Returns comprehensive record data including:
    - All field values
    - Related records (optional)
    - Activity history (optional)
    - Field metadata
    """
    try:
        # Parse fields if provided
        field_list = None
        if fields:
            field_list = [f.strip() for f in fields.split(",") if f.strip()]
        
        # Get record details
        record = await crm_service.get_record_by_id(
            record_id=record_id,
            module=module,
            fields=field_list
        )
        
        if not record:
            raise HTTPException(status_code=404, detail=f"Record {record_id} not found in {module}")
        
        response = {
            "record_id": record_id,
            "module": module,
            "record": record,
            "metadata": {
                "last_modified": record.get("Modified_Time"),
                "created_time": record.get("Created_Time"),
                "owner": record.get("Owner"),
                "record_url": f"/crm/{module.lower()}/{record_id}"
            }
        }
        
        # Include related records if requested
        if include_related:
            try:
                related_records = await crm_service.get_related_records(record_id, module)
                response["related_records"] = related_records
            except Exception as e:
                response["related_records_error"] = str(e)
        
        # Include activities if requested
        if include_activities:
            try:
                activities = await crm_service.get_record_activities(record_id, module)
                response["activities"] = activities
            except Exception as e:
                response["activities_error"] = str(e)
        
        response["timestamp"] = datetime.now().isoformat()
        return response
        
    except HTTPException:
        raise
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get record details: {str(e)}")


@router.post("/record/{record_id}/sync")
async def force_record_sync(
    record_id: str,
    background_tasks: BackgroundTasks,
    module: str = Query("Deals", description="CRM module"),
    sync_direction: str = Query("bidirectional", regex="^(to_crm|from_crm|bidirectional)$"),
    validate_before_sync: bool = Query(True, description="Validate before syncing"),
    sync_service: DataSyncService = Depends(get_sync_service),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Force synchronization of a specific record
    
    Triggers immediate sync for a single record with options for:
    - Sync direction (to CRM, from CRM, or bidirectional)
    - Pre-sync validation
    - Background processing for complex syncs
    """
    try:
        # Validate record exists
        record = await crm_service.get_record_by_id(record_id, module)
        if not record:
            raise HTTPException(status_code=404, detail=f"Record {record_id} not found in {module}")
        
        # Generate sync session ID
        import uuid
        sync_session_id = str(uuid.uuid4())
        
        # Validate before sync if requested
        validation_result = None
        if validate_before_sync:
            try:
                validation_result = await crm_service.validate_record_data(record, module)
                if not validation_result.get("valid", False):
                    return {
                        "success": False,
                        "message": "Record validation failed",
                        "record_id": record_id,
                        "validation_errors": validation_result.get("errors", []),
                        "sync_session_id": sync_session_id
                    }
            except Exception as e:
                return {
                    "success": False,
                    "message": "Record validation error",
                    "record_id": record_id,
                    "validation_error": str(e),
                    "sync_session_id": sync_session_id
                }
        
        # Start background sync for the specific record
        background_tasks.add_task(
            sync_service.sync_specific_record,
            record_id=record_id,
            module=module,
            sync_direction=sync_direction,
            sync_session_id=sync_session_id
        )
        
        return {
            "success": True,
            "message": f"Record sync initiated for {record_id}",
            "record_id": record_id,
            "module": module,
            "sync_direction": sync_direction,
            "sync_session_id": sync_session_id,
            "validation_result": validation_result,
            "status": "initiated",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Record sync failed: {str(e)}")


@router.get("/suggestions")
async def get_search_suggestions(
    partial_query: str = Query(..., min_length=1, description="Partial search query"),
    module: str = Query("Deals", description="CRM module"),
    field: Optional[str] = Query(None, description="Specific field to search in"),
    limit: int = Query(10, ge=1, le=50),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Get search suggestions for auto-complete
    
    Returns suggested search terms based on partial input
    """
    try:
        suggestions = await crm_service.get_search_suggestions(
            partial_query=partial_query,
            module=module,
            field=field,
            limit=limit
        )
        
        return {
            "partial_query": partial_query,
            "module": module,
            "field": field,
            "suggestions": suggestions,
            "total_suggestions": len(suggestions),
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")


@router.get("/filters/available")
async def get_available_filters(
    module: str = Query("Deals", description="CRM module"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Get available filter options for search
    
    Returns filterable fields and their available values/constraints
    """
    try:
        # Get module fields
        fields = await crm_service.get_module_fields(module)
        
        # Process fields to extract filter options
        filter_options = []
        for field in fields:
            if field.get("filterable", True):  # Most fields are filterable unless specified
                filter_option = {
                    "api_name": field.get("api_name"),
                    "display_label": field.get("display_label"),
                    "data_type": field.get("data_type"),
                    "operators": _get_filter_operators(field.get("data_type"))
                }
                
                # Add picklist values if applicable
                if field.get("data_type") in ["picklist", "multiselectpicklist"]:
                    filter_option["pick_list_values"] = field.get("pick_list_values", [])
                
                # Add constraints for numeric/date fields
                if field.get("data_type") in ["number", "currency", "double"]:
                    filter_option["constraints"] = {
                        "min_value": field.get("min_value"),
                        "max_value": field.get("max_value")
                    }
                
                filter_options.append(filter_option)
        
        return {
            "module": module,
            "available_filters": filter_options,
            "total_filters": len(filter_options),
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get filter options: {str(e)}")


@router.post("/export")
async def export_search_results(
    search_criteria: Dict[str, Any],
    background_tasks: BackgroundTasks,
    module: str = Query("Deals", description="CRM module"),
    export_format: str = Query("csv", regex="^(csv|xlsx|json)$"),
    fields: Optional[List[str]] = None,
    limit: int = Query(10000, ge=1, le=50000, description="Maximum records to export"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Export search results to file
    
    Generates downloadable export of search results in specified format
    """
    try:
        # Generate export session ID
        import uuid
        export_session_id = str(uuid.uuid4())
        
        # Validate export parameters
        if limit > 50000:
            raise HTTPException(
                status_code=400,
                detail="Export limit is 50,000 records. Use multiple exports for larger datasets."
            )
        
        # Start background export task
        background_tasks.add_task(
            _perform_search_export,
            export_session_id=export_session_id,
            search_criteria=search_criteria,
            module=module,
            export_format=export_format,
            fields=fields,
            limit=limit,
            crm_service=crm_service
        )
        
        return {
            "success": True,
            "message": "Export initiated",
            "export_session_id": export_session_id,
            "module": module,
            "export_format": export_format,
            "max_records": limit,
            "status": "initiated",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export initiation failed: {str(e)}")


def _get_filter_operators(data_type: str) -> List[str]:
    """Get available filter operators for a data type"""
    operators_map = {
        "text": ["equals", "contains", "starts_with", "ends_with", "is_empty", "is_not_empty"],
        "email": ["equals", "contains", "is_empty", "is_not_empty"],
        "phone": ["equals", "contains", "is_empty", "is_not_empty"],
        "picklist": ["equals", "not_equals", "in", "not_in"],
        "multiselectpicklist": ["contains", "not_contains"],
        "boolean": ["equals"],
        "date": ["equals", "not_equals", "greater_than", "less_than", "between", "is_empty"],
        "datetime": ["equals", "not_equals", "greater_than", "less_than", "between", "is_empty"],
        "number": ["equals", "not_equals", "greater_than", "less_than", "between"],
        "currency": ["equals", "not_equals", "greater_than", "less_than", "between"],
        "double": ["equals", "not_equals", "greater_than", "less_than", "between"]
    }
    
    return operators_map.get(data_type, ["equals", "not_equals", "is_empty", "is_not_empty"])


async def _perform_search_export(
    export_session_id: str,
    search_criteria: Dict[str, Any],
    module: str,
    export_format: str,
    fields: Optional[List[str]],
    limit: int,
    crm_service: UnifiedZohoCRMService
) -> None:
    """Background task to perform search export"""
    try:
        # This would be implemented to handle the actual export process
        # For now, this is a placeholder for the background task structure
        pass
    except Exception as e:
        # Log error and update export status
        print(f"Export failed for session {export_session_id}: {str(e)}")


@router.get("/recent")
async def get_recent_searches(
    limit: int = Query(10, ge=1, le=50),
    user_id: Optional[str] = Query(None, description="Filter by user ID")
) -> Dict[str, Any]:
    """
    Get recent search queries
    
    Returns list of recent searches for quick access
    """
    try:
        # This would integrate with a search history service
        # For now, return a placeholder structure
        recent_searches = [
            {
                "search_id": "search_123",
                "query": "AWS Cloud Migration",
                "module": "Deals",
                "timestamp": datetime.now().isoformat(),
                "result_count": 25
            }
        ]
        
        return {
            "recent_searches": recent_searches,
            "total_returned": len(recent_searches),
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent searches: {str(e)}")