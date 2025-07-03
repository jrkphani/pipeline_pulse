"""
Async Bulk Operations Manager
Eliminates CSV dependency with direct JSON bulk operations
"""

import json
import asyncio
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from ..core.api_client import ZohoAPIClient
from ..core.exceptions import ZohoBulkOperationError, ZohoAPIError
from ..conflicts.resolver import ConflictResolutionEngine
from ..conflicts.sync_tracker import SyncOperationTracker
import logging

logger = logging.getLogger(__name__)


class BulkAsyncService:
    """
    Bulk async service for background operations
    Compatible with bulk_operations.py endpoint expectations
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.bulk_manager = ZohoAsyncBulkManager(db)
    
    async def perform_mass_operation(self, 
                                   session_id: str,
                                   records: List[Dict[str, Any]],
                                   operation: str,
                                   module: str = "Deals",
                                   batch_size: int = 100,
                                   validate_before_update: bool = False):
        """
        Perform mass operation - delegated to ZohoAsyncBulkManager
        """
        try:
            if operation == "create":
                result = await self.bulk_manager.bulk_create_deals(records, f"mass_operation_{session_id}")
            elif operation == "update":
                result = await self.bulk_manager.bulk_update_deals(records, f"mass_operation_{session_id}")
            elif operation == "upsert":
                result = await self.bulk_manager.bulk_upsert_deals(records, None, f"mass_operation_{session_id}")
            else:
                raise ValueError(f"Unsupported operation: {operation}")
            
            return result
        except Exception as e:
            logger.error(f"Mass operation failed for session {session_id}: {str(e)}")
            raise


class ZohoAsyncBulkManager:
    """
    Advanced async bulk operations manager
    Replaces CSV-based bulk operations with direct JSON API calls
    """
    
    def __init__(self, db: Session):
        self.api_client = ZohoAPIClient()
        self.conflict_resolver = ConflictResolutionEngine()
        self.sync_tracker = SyncOperationTracker(db)
        self.db = db
        self.max_batch_size = 100  # Zoho CRM limit
    
    async def bulk_create_deals(
        self, 
        deals_data: List[Dict[str, Any]],
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """
        Create multiple deals using async bulk API
        """
        
        operation_id = self.sync_tracker.start_sync_operation(
            operation_type="BULK_CREATE_DEALS",
            total_records=len(deals_data),
            metadata={"operation": "create", "module": "Deals"},
            created_by=created_by
        )
        
        try:
            # Split into batches
            batches = self._split_into_batches(deals_data, self.max_batch_size)
            all_results = []
            successful_count = 0
            failed_count = 0
            
            for batch_index, batch in enumerate(batches):
                logger.info(f"Processing batch {batch_index + 1}/{len(batches)} with {len(batch)} records")
                
                try:
                    # Prepare batch payload
                    payload = {
                        "data": batch,
                        "duplicate_check_fields": ["Deal_Name", "Account_Name"],
                        "apply_feature_execution": [
                            {"name": "layout_rules"},
                            {"name": "validation_rules"},
                            {"name": "approval_rules"}
                        ]
                    }
                    
                    # Execute batch create
                    response = await self.api_client.post("Deals", data=payload)
                    
                    # Process batch results
                    batch_results = response.get("data", [])
                    for result in batch_results:
                        if result.get("status") == "success":
                            successful_count += 1
                        else:
                            failed_count += 1
                    
                    all_results.extend(batch_results)
                    
                    # Small delay between batches to respect rate limits
                    if batch_index < len(batches) - 1:
                        await asyncio.sleep(0.5)
                        
                except Exception as e:
                    logger.error(f"Error in batch {batch_index + 1}: {str(e)}")
                    failed_count += len(batch)
                    # Continue with next batch
            
            # Update progress
            self.sync_tracker.update_sync_progress(
                operation_id=operation_id,
                successful_records=successful_count,
                failed_records=failed_count
            )
            
            # Complete operation
            self.sync_tracker.complete_sync_operation(operation_id, "COMPLETED")
            
            return {
                "operation_id": operation_id,
                "status": "completed",
                "total_records": len(deals_data),
                "successful_records": successful_count,
                "failed_records": failed_count,
                "batches_processed": len(batches),
                "results": all_results
            }
            
        except Exception as e:
            self.sync_tracker.complete_sync_operation(operation_id, "FAILED", str(e))
            logger.error(f"Bulk create operation failed: {str(e)}")
            raise ZohoBulkOperationError(f"Bulk create failed: {str(e)}")
    
    async def bulk_update_deals(
        self, 
        updates_data: List[Dict[str, Any]],
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """
        Update multiple deals using async bulk API
        """
        
        operation_id = self.sync_tracker.start_sync_operation(
            operation_type="BULK_UPDATE_DEALS",
            total_records=len(updates_data),
            metadata={"operation": "update", "module": "Deals"},
            created_by=created_by
        )
        
        try:
            # Validate all records have IDs
            for record in updates_data:
                if not record.get("id"):
                    raise ZohoBulkOperationError("All records must have 'id' field for bulk update")
            
            # Split into batches
            batches = self._split_into_batches(updates_data, self.max_batch_size)
            all_results = []
            successful_count = 0
            failed_count = 0
            
            for batch_index, batch in enumerate(batches):
                logger.info(f"Processing update batch {batch_index + 1}/{len(batches)} with {len(batch)} records")
                
                try:
                    payload = {
                        "data": batch,
                        "apply_feature_execution": [
                            {"name": "layout_rules"},
                            {"name": "validation_rules"},
                            {"name": "approval_rules"}
                        ]
                    }
                    
                    # Execute batch update
                    response = await self.api_client.put("Deals", data=payload)
                    
                    # Process batch results
                    batch_results = response.get("data", [])
                    for result in batch_results:
                        if result.get("status") == "success":
                            successful_count += 1
                        else:
                            failed_count += 1
                    
                    all_results.extend(batch_results)
                    
                    # Small delay between batches
                    if batch_index < len(batches) - 1:
                        await asyncio.sleep(0.5)
                        
                except Exception as e:
                    logger.error(f"Error in update batch {batch_index + 1}: {str(e)}")
                    failed_count += len(batch)
            
            # Update progress
            self.sync_tracker.update_sync_progress(
                operation_id=operation_id,
                successful_records=successful_count,
                failed_records=failed_count
            )
            
            # Complete operation
            self.sync_tracker.complete_sync_operation(operation_id, "COMPLETED")
            
            return {
                "operation_id": operation_id,
                "status": "completed",
                "total_records": len(updates_data),
                "successful_records": successful_count,
                "failed_records": failed_count,
                "batches_processed": len(batches),
                "results": all_results
            }
            
        except Exception as e:
            self.sync_tracker.complete_sync_operation(operation_id, "FAILED", str(e))
            logger.error(f"Bulk update operation failed: {str(e)}")
            raise ZohoBulkOperationError(f"Bulk update failed: {str(e)}")
    
    async def bulk_upsert_deals(
        self,
        deals_data: List[Dict[str, Any]],
        duplicate_check_fields: Optional[List[str]] = None,
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """
        Upsert (insert or update) multiple deals
        """
        
        if not duplicate_check_fields:
            duplicate_check_fields = ["Deal_Name", "Account_Name"]
        
        operation_id = self.sync_tracker.start_sync_operation(
            operation_type="BULK_UPSERT_DEALS",
            total_records=len(deals_data),
            metadata={
                "operation": "upsert", 
                "module": "Deals",
                "duplicate_check_fields": duplicate_check_fields
            },
            created_by=created_by
        )
        
        try:
            # Split into batches
            batches = self._split_into_batches(deals_data, self.max_batch_size)
            all_results = []
            successful_count = 0
            failed_count = 0
            
            for batch_index, batch in enumerate(batches):
                logger.info(f"Processing upsert batch {batch_index + 1}/{len(batches)} with {len(batch)} records")
                
                try:
                    payload = {
                        "data": batch,
                        "duplicate_check_fields": duplicate_check_fields,
                        "apply_feature_execution": [
                            {"name": "layout_rules"},
                            {"name": "validation_rules"},
                            {"name": "approval_rules"}
                        ]
                    }
                    
                    # Execute batch upsert
                    response = await self.api_client.post("Deals/upsert", data=payload)
                    
                    # Process batch results
                    batch_results = response.get("data", [])
                    for result in batch_results:
                        if result.get("status") == "success":
                            successful_count += 1
                        else:
                            failed_count += 1
                    
                    all_results.extend(batch_results)
                    
                    # Small delay between batches
                    if batch_index < len(batches) - 1:
                        await asyncio.sleep(0.5)
                        
                except Exception as e:
                    logger.error(f"Error in upsert batch {batch_index + 1}: {str(e)}")
                    failed_count += len(batch)
            
            # Update progress
            self.sync_tracker.update_sync_progress(
                operation_id=operation_id,
                successful_records=successful_count,
                failed_records=failed_count
            )
            
            # Complete operation
            self.sync_tracker.complete_sync_operation(operation_id, "COMPLETED")
            
            return {
                "operation_id": operation_id,
                "status": "completed",
                "total_records": len(deals_data),
                "successful_records": successful_count,
                "failed_records": failed_count,
                "batches_processed": len(batches),
                "results": all_results
            }
            
        except Exception as e:
            self.sync_tracker.complete_sync_operation(operation_id, "FAILED", str(e))
            logger.error(f"Bulk upsert operation failed: {str(e)}")
            raise ZohoBulkOperationError(f"Bulk upsert failed: {str(e)}")
    
    def _split_into_batches(self, data: List[Dict[str, Any]], batch_size: int) -> List[List[Dict[str, Any]]]:
        """Split data into batches of specified size"""
        
        batches = []
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            batches.append(batch)
        
        return batches
    
    async def get_bulk_operation_status(self, operation_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a bulk operation"""
        
        return self.sync_tracker.get_sync_operation_status(operation_id)
    
    async def cancel_bulk_operation(self, operation_id: str) -> Dict[str, Any]:
        """Cancel a running bulk operation"""
        
        try:
            # Mark operation as cancelled
            self.sync_tracker.complete_sync_operation(
                operation_id, "CANCELLED", "Operation cancelled by user"
            )
            
            return {
                "operation_id": operation_id,
                "status": "cancelled",
                "message": "Bulk operation has been cancelled"
            }
            
        except Exception as e:
            logger.error(f"Error cancelling bulk operation: {str(e)}")
            raise ZohoBulkOperationError(f"Failed to cancel operation: {str(e)}")
