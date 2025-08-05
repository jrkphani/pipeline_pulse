"""
Simple field discovery endpoint that handles initialization properly.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
import structlog

from app.core.deps import get_current_user
from app.models.user import User
from app.core.database import init_db

logger = structlog.get_logger()
router = APIRouter()

@router.get("/fields")
async def get_fields(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get available fields from Zoho CRM modules."""
    try:
        # Ensure database is initialized
        await init_db()
        
        # Import after DB init
        from app.services.improved_zoho_sdk_manager import get_improved_sdk_manager
        
        # Get the SDK manager
        manager = get_improved_sdk_manager()
        
        # Initialize if needed
        if not manager.is_initialized():
            logger.info("Initializing SDK manager")
            await manager.initialize()
        
        # Add the current user if not already added
        logger.info(f"Adding user {current_user.email} to SDK manager")
        await manager.add_user(
            user_email=current_user.email,
            refresh_token=current_user.zoho_refresh_token
        )
        
        # Switch to the user
        logger.info(f"Switching to user {current_user.email}")
        switch_result = await manager.switch_user(current_user.email)
        
        if not switch_result:
            raise HTTPException(
                status_code=500,
                detail="Failed to switch to user context"
            )
        
        # Now get the fields
        from zohocrmsdk.src.com.zoho.crm.api.fields import FieldsOperations, GetFieldsParam
        from zohocrmsdk.src.com.zoho.crm.api.parameter_map import ParameterMap
        
        modules = ["Leads", "Contacts", "Accounts", "Deals", "Tasks"]
        all_fields = {}
        
        for module_name in modules:
            try:
                fields_operations = FieldsOperations()
                param_instance = ParameterMap()
                param_instance.add(GetFieldsParam.module, module_name)
                
                response = fields_operations.get_fields(param_instance)
                
                if response is not None:
                    response_handler = response.get_object()
                    
                    if hasattr(response_handler, 'get_fields'):
                        fields = response_handler.get_fields()
                        
                        module_fields = {
                            "standard": [],
                            "custom": []
                        }
                        
                        for field in fields:
                            field_info = {
                                "api_name": field.get_api_name(),
                                "display_label": field.get_display_label(),
                                "data_type": field.get_data_type(),
                                "required": field.get_required() if hasattr(field, 'get_required') else False,
                                "read_only": field.get_read_only() if hasattr(field, 'get_read_only') else False,
                            }
                            
                            if field.get_custom_field():
                                module_fields["custom"].append(field_info)
                            else:
                                module_fields["standard"].append(field_info)
                        
                        all_fields[module_name] = module_fields
                        logger.info(f"Retrieved fields for {module_name}: {len(fields)} total")
                    
            except Exception as e:
                logger.error(f"Error getting fields for {module_name}: {e}")
                all_fields[module_name] = {"error": str(e)}
        
        return {
            "success": True,
            "user": current_user.email,
            "fields": all_fields
        }
        
    except Exception as e:
        logger.error(f"Failed to get fields: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve fields: {str(e)}"
        )