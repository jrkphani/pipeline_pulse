"""
CRM Authentication and Field Management API Endpoints
Handles Zoho CRM authentication validation and custom field management
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.core.database import get_db
from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
from app.services.zoho_field_service import ZohoFieldService
from app.services.token_manager import token_manager
from app.services.zoho_crm.core.exceptions import (
    ZohoAPIError, ZohoAuthError, ZohoValidationError, ZohoFieldError
)

router = APIRouter(prefix="/auth", tags=["CRM Authentication"])


def get_crm_service(db: Session = Depends(get_db)) -> UnifiedZohoCRMService:
    """Dependency to get CRM service instance"""
    return UnifiedZohoCRMService(db)


def get_field_service(db: Session = Depends(get_db)) -> ZohoFieldService:
    """Dependency to get field service instance"""
    return ZohoFieldService(db)


@router.get("/validate")
async def validate_auth_status(
    check_permissions: bool = Query(True, description="Also validate CRM permissions"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Validate authentication status and permissions
    
    Performs comprehensive validation of:
    - Token validity and refresh status
    - CRM connectivity 
    - Required permissions
    - Organization access
    """
    try:
        # Check token health
        token_health = await token_manager.get_token_health_status(db)
        
        # Check basic authentication
        is_authenticated = await crm_service.check_auth()
        
        validation_result = {
            "authenticated": is_authenticated,
            "token_health": token_health,
            "timestamp": datetime.now().isoformat()
        }
        
        if is_authenticated:
            # Get connection info
            connection_info = await crm_service.validate_connection()
            validation_result["connection"] = connection_info
            
            # Get user info
            try:
                user_info = await crm_service.get_user_info()
                validation_result["user"] = user_info
            except Exception as e:
                validation_result["user_error"] = str(e)
            
            # Check permissions if requested
            if check_permissions:
                try:
                    permissions = await crm_service.check_required_permissions()
                    validation_result["permissions"] = permissions
                except Exception as e:
                    validation_result["permissions_error"] = str(e)
            
            # Check organization access
            try:
                org_info = await crm_service.get_organization_info()
                validation_result["organization"] = org_info
            except Exception as e:
                validation_result["organization_error"] = str(e)
        
        return validation_result
        
    except ZohoAuthError as e:
        return {
            "authenticated": False,
            "error": "Authentication failed",
            "details": str(e),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth validation failed: {str(e)}")


@router.post("/refresh")
async def refresh_auth_token(
    force: bool = Query(False, description="Force token refresh even if valid"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Manually refresh authentication token
    
    Forces a token refresh and validates the new token
    """
    try:
        start_time = datetime.now()
        
        # Refresh token
        access_token = await token_manager.get_valid_access_token(db, force_refresh=force)
        
        refresh_duration = (datetime.now() - start_time).total_seconds()
        
        # Get updated token health
        token_health = await token_manager.get_token_health_status(db)
        
        return {
            "success": True,
            "message": "Token refreshed successfully",
            "refresh_duration_seconds": refresh_duration,
            "token_health": token_health,
            "access_token_present": bool(access_token),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {str(e)}")


@router.get("/permissions")
async def check_crm_permissions(
    detailed: bool = Query(False, description="Return detailed permission breakdown"),
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Check CRM permissions for Pipeline Pulse operations
    
    Validates all required permissions for full functionality
    """
    try:
        permissions_result = await crm_service.check_required_permissions()
        
        if detailed:
            # Get detailed permission breakdown
            detailed_permissions = await crm_service.get_detailed_permissions()
            permissions_result["detailed_permissions"] = detailed_permissions
        
        return permissions_result
        
    except ZohoAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Permission check failed: {str(e)}")


@router.get("/fields/metadata")
async def get_field_metadata(
    module: str = Query("Deals", description="CRM module to get fields for"),
    force_refresh: bool = Query(False, description="Force refresh from CRM"),
    include_validation: bool = Query(True, description="Include field validation rules"),
    field_service: ZohoFieldService = Depends(get_field_service)
) -> Dict[str, Any]:
    """
    Get field metadata with validation rules
    
    Returns comprehensive field information including:
    - Field types and constraints
    - Picklist values
    - Required field status
    - Custom field detection
    """
    try:
        # Get basic field metadata
        fields = await field_service.get_module_fields(module, force_refresh)
        
        # Process fields for Pipeline Pulse requirements
        pipeline_fields = []
        custom_fields = []
        required_fields = []
        
        for field in fields:
            field_info = {
                "api_name": field.get("api_name"),
                "display_label": field.get("display_label"),
                "data_type": field.get("data_type"),
                "is_custom": field.get("custom_field", False),
                "is_required": field.get("required", False),
                "is_read_only": field.get("read_only", False)
            }
            
            # Include validation rules if requested
            if include_validation and "validation" in field:
                field_info["validation"] = field["validation"]
            
            # Include picklist values for choice fields
            if field.get("data_type") in ["picklist", "multiselectpicklist"] and "pick_list_values" in field:
                field_info["pick_list_values"] = field["pick_list_values"]
            
            pipeline_fields.append(field_info)
            
            # Categorize fields
            if field.get("custom_field", False):
                custom_fields.append(field_info)
            
            if field.get("required", False):
                required_fields.append(field_info)
        
        return {
            "module": module,
            "total_fields": len(pipeline_fields),
            "custom_fields_count": len(custom_fields),
            "required_fields_count": len(required_fields),
            "fields": pipeline_fields,
            "custom_fields": custom_fields,
            "required_fields": required_fields,
            "last_refreshed": datetime.now().isoformat(),
            "cache_used": not force_refresh
        }
        
    except ZohoFieldError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get field metadata: {str(e)}")


@router.post("/fields/create")
async def create_pipeline_fields(
    module: str = Query("Deals", description="CRM module to create fields in"),
    field_definitions: List[Dict[str, Any]] = None,
    dry_run: bool = Query(False, description="Validate without creating"),
    field_service: ZohoFieldService = Depends(get_field_service)
) -> Dict[str, Any]:
    """
    Create Pipeline Pulse custom fields in CRM
    
    Creates the required custom fields for Pipeline Pulse functionality
    """
    try:
        # Default Pipeline Pulse field definitions if not provided
        if not field_definitions:
            field_definitions = [
                {
                    "api_name": "Territory",
                    "display_label": "Territory",
                    "data_type": "picklist",
                    "description": "Sales territory for Pipeline Pulse tracking",
                    "pick_list_values": ["APAC", "EMEA", "Americas", "Global"]
                },
                {
                    "api_name": "Service_Line",
                    "display_label": "Service Line",
                    "data_type": "picklist",
                    "description": "Service line classification",
                    "pick_list_values": ["Cloud Migration", "Data Analytics", "DevOps", "Security", "AI/ML"]
                },
                {
                    "api_name": "Strategic_Account",
                    "display_label": "Strategic Account",
                    "data_type": "boolean",
                    "description": "Strategic account flag for Pipeline Pulse"
                },
                {
                    "api_name": "AWS_Funded",
                    "display_label": "AWS Funded",
                    "data_type": "boolean",
                    "description": "AWS funding status"
                },
                {
                    "api_name": "Alliance_Motion",
                    "display_label": "Alliance Motion",
                    "data_type": "picklist",
                    "description": "Alliance motion type",
                    "pick_list_values": ["Direct", "Co-sell", "Marketplace", "Channel"]
                },
                {
                    "api_name": "Proposal_Date",
                    "display_label": "Proposal Date",
                    "data_type": "date",
                    "description": "Proposal submission date for O2R tracking"
                },
                {
                    "api_name": "SOW_Date",
                    "display_label": "SOW Date",
                    "data_type": "date",
                    "description": "Statement of Work date"
                },
                {
                    "api_name": "PO_Date",
                    "display_label": "PO Date",
                    "data_type": "date",
                    "description": "Purchase Order date"
                },
                {
                    "api_name": "Kickoff_Date",
                    "display_label": "Kickoff Date",
                    "data_type": "date",
                    "description": "Project kickoff date"
                },
                {
                    "api_name": "Invoice_Date",
                    "display_label": "Invoice Date",
                    "data_type": "date",
                    "description": "Invoice submission date"
                },
                {
                    "api_name": "Payment_Date",
                    "display_label": "Payment Date",
                    "data_type": "date",
                    "description": "Payment received date"
                },
                {
                    "api_name": "Revenue_Date",
                    "display_label": "Revenue Date",
                    "data_type": "date",
                    "description": "Revenue recognition date"
                }
            ]
        
        if dry_run:
            # Validate field definitions without creating
            validation_results = []
            for field_def in field_definitions:
                try:
                    validation = await field_service.validate_field_definition(field_def, module)
                    validation_results.append({
                        "field": field_def.get("api_name"),
                        "valid": validation.get("valid", False),
                        "issues": validation.get("issues", [])
                    })
                except Exception as e:
                    validation_results.append({
                        "field": field_def.get("api_name"),
                        "valid": False,
                        "error": str(e)
                    })
            
            return {
                "dry_run": True,
                "total_fields": len(field_definitions),
                "validation_results": validation_results,
                "can_proceed": all(r.get("valid", False) for r in validation_results)
            }
        
        # Create fields
        creation_results = await field_service.create_custom_fields(field_definitions, module)
        
        return {
            "success": True,
            "module": module,
            "total_fields": len(field_definitions),
            "creation_results": creation_results,
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoFieldError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ZohoAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Field creation failed: {str(e)}")


@router.get("/fields/validate")
async def validate_custom_fields(
    module: str = Query("Deals", description="CRM module to validate"),
    check_required: bool = Query(True, description="Check if all Pipeline Pulse fields exist"),
    field_service: ZohoFieldService = Depends(get_field_service)
) -> Dict[str, Any]:
    """
    Validate custom fields exist and are properly configured
    
    Checks that all required Pipeline Pulse fields are present and configured correctly
    """
    try:
        # Required Pipeline Pulse fields
        required_fields = [
            "Territory", "Service_Line", "Strategic_Account", "AWS_Funded", 
            "Alliance_Motion", "Proposal_Date", "SOW_Date", "PO_Date",
            "Kickoff_Date", "Invoice_Date", "Payment_Date", "Revenue_Date"
        ]
        
        # Get current fields
        current_fields = await field_service.get_module_fields(module, force_refresh=True)
        current_field_names = {field.get("api_name") for field in current_fields}
        
        # Check which required fields exist
        existing_fields = []
        missing_fields = []
        
        for field_name in required_fields:
            if field_name in current_field_names:
                # Find field details
                field_details = next(
                    (f for f in current_fields if f.get("api_name") == field_name), 
                    None
                )
                existing_fields.append({
                    "api_name": field_name,
                    "status": "exists",
                    "details": field_details
                })
            else:
                missing_fields.append({
                    "api_name": field_name,
                    "status": "missing"
                })
        
        # Validate field configurations
        configuration_issues = []
        for field in existing_fields:
            field_details = field.get("details", {})
            issues = []
            
            # Check if field is read-only
            if field_details.get("read_only", False):
                issues.append("Field is read-only")
            
            # Check if field has appropriate data type for dates
            if field["api_name"].endswith("_Date") and field_details.get("data_type") != "date":
                issues.append(f"Expected date type, got {field_details.get('data_type')}")
            
            if issues:
                configuration_issues.append({
                    "field": field["api_name"],
                    "issues": issues
                })
        
        validation_passed = len(missing_fields) == 0 and len(configuration_issues) == 0
        
        return {
            "module": module,
            "validation_passed": validation_passed,
            "total_required": len(required_fields),
            "existing_count": len(existing_fields),
            "missing_count": len(missing_fields),
            "existing_fields": existing_fields,
            "missing_fields": missing_fields,
            "configuration_issues": configuration_issues,
            "can_sync": validation_passed,
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoFieldError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Field validation failed: {str(e)}")


@router.get("/organization")
async def get_organization_info(
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Get CRM organization information
    
    Returns organization details and configuration
    """
    try:
        org_info = await crm_service.get_organization_info()
        return {
            "organization": org_info,
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get organization info: {str(e)}")


@router.get("/modules")
async def get_available_modules(
    crm_service: UnifiedZohoCRMService = Depends(get_crm_service)
) -> Dict[str, Any]:
    """
    Get available CRM modules and their permissions
    
    Returns list of modules the authenticated user can access
    """
    try:
        modules = await crm_service.get_available_modules()
        return {
            "modules": modules,
            "total_modules": len(modules),
            "timestamp": datetime.now().isoformat()
        }
        
    except ZohoAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get modules: {str(e)}")