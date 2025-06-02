"""
Unified Zoho CRM Service
Single point of access for all Zoho CRM operations
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from .core.auth_manager import ZohoAuthManager
from .core.api_client import ZohoAPIClient
from .modules.deals import ZohoDealManager
from .modules.fields import ZohoFieldManager
from .modules.bulk_async import ZohoAsyncBulkManager
from .conflicts.resolver import ConflictResolutionEngine
from .conflicts.sync_tracker import SyncOperationTracker
from .core.exceptions import ZohoAPIError
import logging

logger = logging.getLogger(__name__)


class UnifiedZohoCRMService:
    """
    Unified service that provides single point of access to all Zoho CRM functionality
    Replaces all scattered Zoho service implementations
    """
    
    def __init__(self, db: Session):
        self.db = db
        
        # Core components
        self.auth_manager = ZohoAuthManager()
        self.api_client = ZohoAPIClient()
        
        # Module managers
        self.deals = ZohoDealManager(db)
        self.fields = ZohoFieldManager()
        self.bulk = ZohoAsyncBulkManager(db)
        
        # Conflict resolution and tracking
        self.conflict_resolver = ConflictResolutionEngine()
        self.sync_tracker = SyncOperationTracker(db)
    
    # Authentication methods
    async def validate_connection(self) -> Dict[str, Any]:
        """Validate Zoho CRM connection"""
        return await self.auth_manager.validate_connection()
    
    async def get_user_info(self) -> Dict[str, Any]:
        """Get current user information"""
        return await self.auth_manager.get_user_info()
    
    async def check_auth(self) -> bool:
        """Check if authentication is working"""
        try:
            await self.auth_manager.get_access_token()
            return True
        except Exception:
            return False
    
    # Deal operations (delegated to ZohoDealManager)
    async def get_deals(
        self, 
        limit: int = 100, 
        offset: int = 0,
        fields: Optional[List[str]] = None,
        criteria: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get deals from Zoho CRM"""
        return await self.deals.get_deals(limit, offset, fields, criteria)
    
    async def get_deal_by_id(self, deal_id: str) -> Optional[Dict[str, Any]]:
        """Get specific deal by ID"""
        return await self.deals.get_deal_by_id(deal_id)
    
    async def update_deal(
        self, 
        deal_id: str, 
        deal_data: Dict[str, Any],
        validate_conflicts: bool = True
    ) -> Dict[str, Any]:
        """Update deal in Zoho CRM"""
        return await self.deals.update_deal(deal_id, deal_data, validate_conflicts)
    
    async def create_deal(self, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new deal in Zoho CRM"""
        return await self.deals.create_deal(deal_data)
    
    async def delete_deal(self, deal_id: str) -> Dict[str, Any]:
        """Delete deal from Zoho CRM"""
        return await self.deals.delete_deal(deal_id)
    
    async def search_deals(self, search_criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search deals using criteria"""
        return await self.deals.search_deals(search_criteria)
    
    # Field operations (delegated to ZohoFieldManager)
    async def get_module_fields(
        self, 
        module: str = "Deals", 
        force_refresh: bool = False
    ) -> List[Dict[str, Any]]:
        """Get field metadata for module"""
        return await self.fields.get_module_fields(module, force_refresh)
    
    async def validate_field_value(
        self, 
        field_name: str, 
        value: Any, 
        module: str = "Deals"
    ) -> Dict[str, Any]:
        """Validate field value"""
        return await self.fields.validate_field_value(field_name, value, module)
    
    def clear_field_cache(self, module: Optional[str] = None):
        """Clear field cache"""
        self.fields.clear_cache(module)
    
    # Bulk operations (delegated to ZohoAsyncBulkManager)
    async def bulk_create_deals(
        self, 
        deals_data: List[Dict[str, Any]],
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """Bulk create deals"""
        return await self.bulk.bulk_create_deals(deals_data, created_by)
    
    async def bulk_update_deals(
        self, 
        updates_data: List[Dict[str, Any]],
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """Bulk update deals"""
        return await self.bulk.bulk_update_deals(updates_data, created_by)
    
    async def bulk_upsert_deals(
        self,
        deals_data: List[Dict[str, Any]],
        duplicate_check_fields: Optional[List[str]] = None,
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """Bulk upsert deals"""
        return await self.bulk.bulk_upsert_deals(deals_data, duplicate_check_fields, created_by)
    
    # Sync operations
    async def sync_deals_with_local_db(
        self, 
        local_records: List[Dict[str, Any]],
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """Sync deals between Zoho and local database"""
        return await self.deals.sync_deals_with_local_db(local_records, created_by)
    
    async def sync_analysis_to_crm(self, analysis_id: str) -> Dict[str, Any]:
        """Sync analysis results back to Zoho CRM"""
        # This is a placeholder - implement based on your analysis model
        try:
            # Get analysis data from database
            # Convert to Zoho format
            # Update relevant deals
            
            return {
                "analysis_id": analysis_id,
                "status": "success",
                "message": "Analysis synced to CRM",
                "deals_updated": 0
            }
            
        except Exception as e:
            logger.error(f"Error syncing analysis to CRM: {str(e)}")
            raise ZohoAPIError(f"Failed to sync analysis: {str(e)}")
    
    # Operation tracking
    async def get_sync_operation_status(self, operation_id: str) -> Optional[Dict[str, Any]]:
        """Get sync operation status"""
        return self.sync_tracker.get_sync_operation_status(operation_id)
    
    async def get_recent_sync_operations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent sync operations"""
        return self.sync_tracker.get_recent_sync_operations(limit)
    
    async def get_operation_conflicts(self, operation_id: str) -> List[Dict[str, Any]]:
        """Get conflicts for specific operation"""
        return self.sync_tracker.get_conflicts_for_operation(operation_id)
    
    # Utility methods
    @staticmethod
    def normalize_deal_id(deal_id: str) -> str:
        """Convert CSV Record ID to API ID format"""
        return ZohoDealManager.normalize_deal_id(deal_id)
    
    @staticmethod
    def format_csv_id(api_id: str) -> str:
        """Convert API ID to CSV Record ID format"""
        return ZohoDealManager.format_csv_id(api_id)
    
    # Legacy compatibility methods (for backward compatibility during migration)
    async def exchange_code_for_tokens(self, code: str, client_id: str, client_secret: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens (legacy compatibility)"""
        return await self.auth_manager.exchange_code_for_tokens(code, client_id, client_secret)
    
    async def get_user_profile(self, access_token: Optional[str] = None) -> Dict[str, Any]:
        """Get user profile (legacy compatibility)"""
        if access_token:
            # Use provided token
            pass
        return await self.get_user_info()
    
    async def get_complete_user_info(self, access_token: Optional[str] = None) -> Dict[str, Any]:
        """Get complete user information (legacy compatibility)"""
        try:
            user_info = await self.get_user_info()
            return {
                "profile": user_info,
                "permissions": {},  # Would need to implement permissions fetching
                "territories": [],  # Would need to implement territories fetching
                "fetched_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting complete user info: {str(e)}")
            raise ZohoAPIError(f"Failed to get user info: {str(e)}")
    
    # Health check and diagnostics
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check of all CRM components"""
        
        health_status = {
            "overall_status": "healthy",
            "components": {},
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            # Check authentication
            auth_valid = await self.check_auth()
            health_status["components"]["authentication"] = {
                "status": "healthy" if auth_valid else "unhealthy",
                "details": "Authentication working" if auth_valid else "Authentication failed"
            }
            
            # Check API connectivity
            try:
                connection = await self.validate_connection()
                health_status["components"]["api_connectivity"] = {
                    "status": "healthy" if connection.get("authenticated") else "unhealthy",
                    "details": connection
                }
            except Exception as e:
                health_status["components"]["api_connectivity"] = {
                    "status": "unhealthy",
                    "details": f"API connectivity failed: {str(e)}"
                }
            
            # Check field cache
            try:
                fields = await self.get_module_fields("Deals")
                health_status["components"]["field_metadata"] = {
                    "status": "healthy",
                    "details": f"Retrieved {len(fields)} fields"
                }
            except Exception as e:
                health_status["components"]["field_metadata"] = {
                    "status": "unhealthy",
                    "details": f"Field metadata failed: {str(e)}"
                }
            
            # Determine overall status
            component_statuses = [comp["status"] for comp in health_status["components"].values()]
            if "unhealthy" in component_statuses:
                health_status["overall_status"] = "unhealthy"
            elif not component_statuses:
                health_status["overall_status"] = "unknown"
            
        except Exception as e:
            health_status["overall_status"] = "unhealthy"
            health_status["error"] = str(e)
        
        return health_status
