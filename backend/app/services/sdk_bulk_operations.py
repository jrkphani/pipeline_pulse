"""
SDK Bulk Operations Service - Optimized bulk updates using official Zoho SDK
Handles large-scale data operations with progress tracking and error recovery.
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from app.services.async_zoho_wrapper import AsyncZohoWrapper
from app.services.sdk_response_transformer import get_response_transformer
from app.services.zoho_sdk_manager import get_sdk_manager

logger = logging.getLogger(__name__)


class BulkOperationType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


@dataclass
class BulkOperationResult:
    """Result of a bulk operation"""
    operation_id: str
    operation_type: BulkOperationType
    total_records: int
    successful_records: int
    failed_records: int
    progress_percentage: float
    status: str  # 'running', 'completed', 'failed', 'partial'
    start_time: datetime
    end_time: Optional[datetime] = None
    errors: List[Dict[str, Any]] = None


class SDKBulkOperationsService:
    """
    SDK-based bulk operations service with optimized batching and progress tracking
    """
    
    def __init__(self):
        self.sdk_manager = get_sdk_manager()
        self.transformer = get_response_transformer()
        self.max_batch_size = 100  # Zoho SDK limit
        self.concurrent_batches = 5  # Parallel batch processing
        self.active_operations: Dict[str, BulkOperationResult] = {}
        
    def _generate_operation_id(self) -> str:
        """Generate unique operation ID"""
        return f"bulk_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{id(self)}"
    
    async def bulk_update_deals(
        self, 
        updates: List[Dict[str, Any]], 
        progress_callback: Optional[callable] = None
    ) -> BulkOperationResult:
        """
        Perform bulk update of deals using SDK with progress tracking
        
        Args:
            updates: List of deal updates (must include 'id' field)
            progress_callback: Optional callback for progress updates
            
        Returns:
            BulkOperationResult with operation status
        """
        operation_id = self._generate_operation_id()
        start_time = datetime.now()
        
        # Initialize operation result
        result = BulkOperationResult(
            operation_id=operation_id,
            operation_type=BulkOperationType.UPDATE,
            total_records=len(updates),
            successful_records=0,
            failed_records=0,
            progress_percentage=0.0,
            status="running",
            start_time=start_time,
            errors=[]
        )
        
        self.active_operations[operation_id] = result
        
        try:
            logger.info(f"🚀 Starting SDK bulk update operation {operation_id} for {len(updates)} deals")
            
            # Validate SDK initialization
            if not self.sdk_manager.is_initialized():
                raise Exception("SDK not initialized")
            
            # Validate updates have required fields
            validated_updates = self._validate_update_data(updates)
            
            # Transform data to Zoho format
            zoho_updates = []
            for update in validated_updates:
                zoho_update = self.transformer.transform_outbound_data(update)
                zoho_updates.append(zoho_update)
            
            # Split into batches
            batches = [zoho_updates[i:i + self.max_batch_size] 
                      for i in range(0, len(zoho_updates), self.max_batch_size)]
            
            logger.info(f"📦 Split {len(zoho_updates)} updates into {len(batches)} batches")
            
            # Process batches with concurrency control
            successful_count = 0
            failed_count = 0
            semaphore = asyncio.Semaphore(self.concurrent_batches)
            
            async def process_batch(batch_index: int, batch_data: List[Dict[str, Any]]):
                async with semaphore:
                    try:
                        async with AsyncZohoWrapper() as wrapper:
                            response = await wrapper.update_records("Deals", batch_data)
                            
                            if response.get("status") == "success":
                                # Parse individual results
                                data = response.get("data", [])
                                batch_success = 0
                                batch_failed = 0
                                
                                for item in data:
                                    if item.get("status") == "success":
                                        batch_success += 1
                                    else:
                                        batch_failed += 1
                                        result.errors.append({
                                            "batch": batch_index,
                                            "error": item.get("message", "Unknown error"),
                                            "details": item.get("details", {})
                                        })
                                
                                return batch_success, batch_failed
                            else:
                                # Entire batch failed
                                result.errors.append({
                                    "batch": batch_index,
                                    "error": response.get("message", "Batch failed"),
                                    "records_affected": len(batch_data)
                                })
                                return 0, len(batch_data)
                                
                    except Exception as e:
                        logger.error(f"Batch {batch_index} failed: {e}")
                        result.errors.append({
                            "batch": batch_index,
                            "error": str(e),
                            "records_affected": len(batch_data)
                        })
                        return 0, len(batch_data)
            
            # Execute all batches
            batch_tasks = [process_batch(i, batch) for i, batch in enumerate(batches)]
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Aggregate results
            for i, batch_result in enumerate(batch_results):
                if isinstance(batch_result, Exception):
                    logger.error(f"Batch {i} exception: {batch_result}")
                    failed_count += len(batches[i])
                    result.errors.append({
                        "batch": i,
                        "error": str(batch_result),
                        "records_affected": len(batches[i])
                    })
                else:
                    batch_success, batch_failed = batch_result
                    successful_count += batch_success
                    failed_count += batch_failed
                
                # Update progress
                completed_batches = i + 1
                progress = (completed_batches / len(batches)) * 100
                result.progress_percentage = progress
                
                if progress_callback:
                    await progress_callback(result)
            
            # Update final result
            result.successful_records = successful_count
            result.failed_records = failed_count
            result.progress_percentage = 100.0
            result.end_time = datetime.now()
            
            if failed_count == 0:
                result.status = "completed"
            elif successful_count > 0:
                result.status = "partial"
            else:
                result.status = "failed"
            
            logger.info(f"✅ SDK bulk update {operation_id} completed: {successful_count} success, {failed_count} failed")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ SDK bulk update {operation_id} failed: {e}")
            result.status = "failed"
            result.end_time = datetime.now()
            result.errors.append({"error": str(e), "type": "operation_failure"})
            return result
        
        finally:
            # Clean up operation tracking
            if operation_id in self.active_operations:
                self.active_operations[operation_id] = result
    
    async def bulk_create_deals(
        self, 
        deals: List[Dict[str, Any]], 
        progress_callback: Optional[callable] = None
    ) -> BulkOperationResult:
        """
        Perform bulk creation of deals using SDK
        
        Args:
            deals: List of deal data
            progress_callback: Optional callback for progress updates
            
        Returns:
            BulkOperationResult with operation status
        """
        operation_id = self._generate_operation_id()
        start_time = datetime.now()
        
        result = BulkOperationResult(
            operation_id=operation_id,
            operation_type=BulkOperationType.CREATE,
            total_records=len(deals),
            successful_records=0,
            failed_records=0,
            progress_percentage=0.0,
            status="running",
            start_time=start_time,
            errors=[]
        )
        
        self.active_operations[operation_id] = result
        
        try:
            logger.info(f"🚀 Starting SDK bulk create operation {operation_id} for {len(deals)} deals")
            
            if not self.sdk_manager.is_initialized():
                raise Exception("SDK not initialized")
            
            # Transform data to Zoho format
            zoho_deals = []
            for deal in deals:
                zoho_deal = self.transformer.transform_outbound_data(deal)
                zoho_deals.append(zoho_deal)
            
            # Split into batches
            batches = [zoho_deals[i:i + self.max_batch_size] 
                      for i in range(0, len(zoho_deals), self.max_batch_size)]
            
            # Process batches
            successful_count = 0
            failed_count = 0
            semaphore = asyncio.Semaphore(self.concurrent_batches)
            
            async def process_create_batch(batch_index: int, batch_data: List[Dict[str, Any]]):
                async with semaphore:
                    try:
                        async with AsyncZohoWrapper() as wrapper:
                            response = await wrapper.create_records("Deals", batch_data)
                            
                            if response.get("status") == "success":
                                data = response.get("data", [])
                                batch_success = sum(1 for item in data if item.get("status") == "success")
                                batch_failed = len(data) - batch_success
                                
                                for item in data:
                                    if item.get("status") != "success":
                                        result.errors.append({
                                            "batch": batch_index,
                                            "error": item.get("message", "Creation failed"),
                                            "details": item.get("details", {})
                                        })
                                
                                return batch_success, batch_failed
                            else:
                                result.errors.append({
                                    "batch": batch_index,
                                    "error": response.get("message", "Batch creation failed"),
                                    "records_affected": len(batch_data)
                                })
                                return 0, len(batch_data)
                                
                    except Exception as e:
                        logger.error(f"Create batch {batch_index} failed: {e}")
                        result.errors.append({
                            "batch": batch_index,
                            "error": str(e),
                            "records_affected": len(batch_data)
                        })
                        return 0, len(batch_data)
            
            # Execute batches
            batch_tasks = [process_create_batch(i, batch) for i, batch in enumerate(batches)]
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Aggregate results
            for i, batch_result in enumerate(batch_results):
                if isinstance(batch_result, Exception):
                    failed_count += len(batches[i])
                else:
                    batch_success, batch_failed = batch_result
                    successful_count += batch_success
                    failed_count += batch_failed
                
                result.progress_percentage = ((i + 1) / len(batches)) * 100
                if progress_callback:
                    await progress_callback(result)
            
            # Finalize result
            result.successful_records = successful_count
            result.failed_records = failed_count
            result.progress_percentage = 100.0
            result.end_time = datetime.now()
            result.status = "completed" if failed_count == 0 else ("partial" if successful_count > 0 else "failed")
            
            logger.info(f"✅ SDK bulk create {operation_id} completed: {successful_count} success, {failed_count} failed")
            return result
            
        except Exception as e:
            logger.error(f"❌ SDK bulk create {operation_id} failed: {e}")
            result.status = "failed"
            result.end_time = datetime.now()
            result.errors.append({"error": str(e), "type": "operation_failure"})
            return result
    
    def _validate_update_data(self, updates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate update data has required fields"""
        validated = []
        for update in updates:
            if not update.get("id"):
                logger.warning("Update missing ID field, skipping")
                continue
            validated.append(update)
        return validated
    
    def get_operation_status(self, operation_id: str) -> Optional[BulkOperationResult]:
        """Get status of a bulk operation"""
        return self.active_operations.get(operation_id)
    
    def list_active_operations(self) -> List[BulkOperationResult]:
        """List all active operations"""
        return list(self.active_operations.values())
    
    def cleanup_completed_operations(self, max_age_hours: int = 24):
        """Clean up old completed operations"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        to_remove = []
        for op_id, result in self.active_operations.items():
            if result.end_time and result.end_time < cutoff_time:
                to_remove.append(op_id)
        
        for op_id in to_remove:
            del self.active_operations[op_id]
        
        if to_remove:
            logger.info(f"🧹 Cleaned up {len(to_remove)} old operations")


# Global instance
sdk_bulk_service = SDKBulkOperationsService()


async def bulk_update_deals_sdk(
    updates: List[Dict[str, Any]], 
    progress_callback: Optional[callable] = None
) -> BulkOperationResult:
    """Convenience function for bulk deal updates"""
    return await sdk_bulk_service.bulk_update_deals(updates, progress_callback)


async def bulk_create_deals_sdk(
    deals: List[Dict[str, Any]], 
    progress_callback: Optional[callable] = None
) -> BulkOperationResult:
    """Convenience function for bulk deal creation"""
    return await sdk_bulk_service.bulk_create_deals(deals, progress_callback)


def get_bulk_operation_status(operation_id: str) -> Optional[BulkOperationResult]:
    """Get status of a bulk operation"""
    return sdk_bulk_service.get_operation_status(operation_id)