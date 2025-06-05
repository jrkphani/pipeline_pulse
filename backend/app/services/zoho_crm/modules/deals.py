"""
Unified Deal Operations Manager
Consolidates all deal-related functionality from existing services
"""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from ..core.api_client import ZohoAPIClient
from ..core.exceptions import ZohoAPIError, ZohoValidationError
from ..conflicts.resolver import ConflictResolutionEngine
from ..conflicts.sync_tracker import SyncOperationTracker
import logging

logger = logging.getLogger(__name__)


class ZohoDealManager:
    """
    Unified manager for all deal operations with conflict resolution
    Replaces functionality from zoho_service.py
    """
    
    def __init__(self, db: Session):
        self.api_client = ZohoAPIClient()
        self.conflict_resolver = ConflictResolutionEngine()
        self.sync_tracker = SyncOperationTracker(db)
        self.db = db
    
    @staticmethod
    def normalize_deal_id(deal_id: str) -> str:
        """
        Convert CSV Record ID to API ID format
        CSV: 'zcrm_495490000010864021' -> API: '495490000010864021'
        """
        if deal_id.startswith('zcrm_'):
            return deal_id[5:]  # Remove 'zcrm_' prefix
        return deal_id
    
    @staticmethod
    def format_csv_id(api_id: str) -> str:
        """
        Convert API ID to CSV Record ID format
        API: '495490000010864021' -> CSV: 'zcrm_495490000010864021'
        """
        if not api_id.startswith('zcrm_'):
            return f"zcrm_{api_id}"
        return api_id
    
    async def get_deals(
        self,
        limit: int = 100,
        offset: int = 0,
        fields: Optional[List[str]] = None,
        criteria: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch deals from Zoho CRM with enhanced filtering and field selection
        Note: Zoho API v8 requires 'fields' parameter for all module data requests
        """

        params = {
            "per_page": min(limit, 200),  # Zoho max is 200
            "page": offset // limit + 1
        }

        # Zoho API v8 requires fields parameter - use defaults if none provided
        if not fields:
            # Default fields for Pipeline Pulse analysis
            fields = [
                "Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name",
                "Owner", "Probability", "Created_Time", "Modified_Time",
                "Deal_Category_Type", "Lead_Source", "Next_Step", "Description"
            ]

        params["fields"] = ",".join(fields)

        if criteria:
            params["criteria"] = criteria
        
        try:
            response = await self.api_client.get("Deals", params=params)
            deals = response.get("data", [])
            
            # Add CSV-compatible Record ID to each deal
            for deal in deals:
                if 'id' in deal:
                    deal['Record Id'] = self.format_csv_id(deal['id'])
                    deal['zoho_api_id'] = deal['id']  # Keep original for reference
            
            logger.info(f"Fetched {len(deals)} deals from Zoho CRM")
            return deals
            
        except Exception as e:
            logger.error(f"Error fetching deals: {str(e)}")
            raise ZohoAPIError(f"Failed to fetch deals: {str(e)}")
    
    async def get_deal_by_id(self, deal_id: str, fields: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """Get a specific deal by ID"""

        api_deal_id = self.normalize_deal_id(deal_id)

        # Prepare parameters with fields (required for v8 API)
        params = {}
        if not fields:
            # Default fields for single deal retrieval
            fields = [
                "Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name",
                "Owner", "Probability", "Created_Time", "Modified_Time",
                "Deal_Category_Type", "Lead_Source", "Next_Step", "Description"
            ]
        params["fields"] = ",".join(fields)

        try:
            response = await self.api_client.get(f"Deals/{api_deal_id}", params=params)
            deal_data = response.get("data", [])

            if deal_data:
                deal = deal_data[0]
                deal['Record Id'] = self.format_csv_id(deal['id'])
                deal['zoho_api_id'] = deal['id']
                return deal

            return None

        except Exception as e:
            logger.error(f"Error fetching deal {deal_id}: {str(e)}")
            raise ZohoAPIError(f"Failed to fetch deal: {str(e)}")
    
    async def update_deal(
        self, 
        deal_id: str, 
        deal_data: Dict[str, Any],
        validate_conflicts: bool = True
    ) -> Dict[str, Any]:
        """
        Update a deal in Zoho CRM with conflict resolution
        """
        
        api_deal_id = self.normalize_deal_id(deal_id)
        
        # Validate field updates if conflict resolution is enabled
        if validate_conflicts:
            for field_name, new_value in deal_data.items():
                validation = self.conflict_resolver.validate_field_update(
                    field_name, new_value, {}
                )
                if not validation['allowed']:
                    raise ZohoValidationError(
                        f"Field update not allowed: {validation['reason']}",
                        field_errors={field_name: validation['reason']}
                    )
        
        payload = {"data": [deal_data]}
        
        try:
            response = await self.api_client.put(f"Deals/{api_deal_id}", data=payload)
            logger.info(f"Successfully updated deal {deal_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error updating deal {deal_id}: {str(e)}")
            raise ZohoAPIError(f"Failed to update deal: {str(e)}")
    
    async def create_deal(self, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new deal in Zoho CRM"""
        
        payload = {"data": [deal_data]}
        
        try:
            response = await self.api_client.post("Deals", data=payload)
            logger.info("Successfully created new deal")
            return response
            
        except Exception as e:
            logger.error(f"Error creating deal: {str(e)}")
            raise ZohoAPIError(f"Failed to create deal: {str(e)}")
    
    async def delete_deal(self, deal_id: str) -> Dict[str, Any]:
        """Delete a deal from Zoho CRM"""
        
        api_deal_id = self.normalize_deal_id(deal_id)
        
        try:
            response = await self.api_client.delete(f"Deals/{api_deal_id}")
            logger.info(f"Successfully deleted deal {deal_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error deleting deal {deal_id}: {str(e)}")
            raise ZohoAPIError(f"Failed to delete deal: {str(e)}")
    
    async def sync_deals_with_local_db(
        self, 
        local_records: List[Dict[str, Any]],
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """
        Sync deals between Zoho CRM and local database with conflict resolution
        """
        
        # Start sync operation tracking
        operation_id = self.sync_tracker.start_sync_operation(
            operation_type="DEAL_SYNC",
            total_records=len(local_records),
            metadata={"sync_direction": "bidirectional"},
            created_by=created_by
        )
        
        try:
            # Get all deals from Zoho
            zoho_deals = await self.get_deals(limit=1000)  # Adjust as needed
            
            # Resolve conflicts
            resolved_records, conflicts = self.conflict_resolver.resolve_bulk_conflicts(
                local_records, zoho_deals, id_field='deal_id'
            )
            
            # Log conflicts
            for conflict in conflicts:
                self.sync_tracker.log_conflict(
                    sync_operation_id=operation_id,
                    record_id=conflict['record_id'],
                    field_name=conflict['field'],
                    local_value=conflict['local_value'],
                    zoho_value=conflict['zoho_value'],
                    resolution=conflict['resolution'],
                    reason=conflict['reason']
                )
            
            # Update progress
            self.sync_tracker.update_sync_progress(
                operation_id=operation_id,
                successful_records=len(resolved_records),
                conflicts_resolved=len(conflicts)
            )
            
            # Complete operation
            self.sync_tracker.complete_sync_operation(operation_id, "COMPLETED")
            
            return {
                "operation_id": operation_id,
                "status": "completed",
                "total_records": len(local_records),
                "resolved_records": len(resolved_records),
                "conflicts_resolved": len(conflicts),
                "conflict_report": self.conflict_resolver.generate_conflict_report(conflicts)
            }
            
        except Exception as e:
            # Mark operation as failed
            self.sync_tracker.complete_sync_operation(
                operation_id, "FAILED", str(e)
            )
            logger.error(f"Deal sync operation failed: {str(e)}")
            raise ZohoAPIError(f"Deal sync failed: {str(e)}")
    
    async def get_deal_stages(self) -> List[Dict[str, Any]]:
        """Get available deal stages from Zoho CRM"""
        
        try:
            response = await self.api_client.get("settings/layouts/Deals")
            # Extract stage information from layout data
            # This is a simplified implementation - actual implementation would parse layout data
            return response.get("layouts", [])
            
        except Exception as e:
            logger.error(f"Error fetching deal stages: {str(e)}")
            raise ZohoAPIError(f"Failed to fetch deal stages: {str(e)}")
    
    async def search_deals(self, search_criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search deals using Zoho CRM search API"""
        
        # Build search criteria string
        criteria_parts = []
        for field, value in search_criteria.items():
            if isinstance(value, str):
                criteria_parts.append(f"({field}:equals:{value})")
            elif isinstance(value, (int, float)):
                criteria_parts.append(f"({field}:equals:{value})")
        
        criteria = " and ".join(criteria_parts)
        
        try:
            return await self.get_deals(criteria=criteria)
            
        except Exception as e:
            logger.error(f"Error searching deals: {str(e)}")
            raise ZohoAPIError(f"Failed to search deals: {str(e)}")
