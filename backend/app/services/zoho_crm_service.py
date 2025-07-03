"""
Enhanced Zoho CRM Service with comprehensive API coverage for Pipeline Pulse
Implements all 14 required APIs for live CRM integration
"""

import asyncio
import httpx
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timedelta
from urllib.parse import urlencode
import json
import time
from dataclasses import dataclass
from enum import Enum

from app.services.zoho_service import ZohoService
from app.models.crm_sync_sessions import (
    CRMSyncSession, SyncStatusLog, RecordSyncStatus, SyncConfiguration,
    SyncSessionStatus, SyncOperationType, RecordSyncAction, ConflictResolutionStrategy
)
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class ZohoAPIError(Exception):
    """Custom exception for Zoho API errors"""
    def __init__(self, message: str, error_code: str = None, status_code: int = None):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(self.message)


class RateLimitError(ZohoAPIError):
    """Exception for rate limit errors"""
    pass


class BatchOperationStatus(Enum):
    """Status of batch operations"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class PaginationInfo:
    """Pagination information for API responses"""
    page: int
    per_page: int
    total_count: int
    has_more: bool
    next_page_token: Optional[str] = None


@dataclass
class SyncResult:
    """Result of a sync operation"""
    session_id: str
    status: SyncSessionStatus
    total_records: int
    successful_records: int
    failed_records: int
    skipped_records: int
    conflicts: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    duration_seconds: float


class EnhancedZohoCRMService(ZohoService):
    """
    Enhanced Zoho CRM Service extending the base ZohoService
    Implements all 14 APIs required for comprehensive CRM integration
    """
    
    # Required fields for Pipeline Pulse as specified in the plan
    REQUIRED_FIELDS = [
        "Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name",
        "Contact_Name", "Territory", "Service_Line", "Strategic_Account",
        "AWS_Funded", "Alliance_Motion", "Proposal_Date", "SOW_Date",
        "PO_Date", "Kickoff_Date", "Invoice_Date", "Payment_Date", "Revenue_Date"
    ]
    
    def __init__(self, client_id: str = None, client_secret: str = None, 
                 redirect_uri: str = None, access_token: str = None):
        """Initialize the enhanced service with OAuth credentials"""
        super().__init__()
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.access_token = access_token
        self.refresh_token = None
        
        # Rate limiting
        self.rate_limit_calls_per_minute = 150  # Zoho's standard limit
        self.rate_limit_buffer = 10  # 10% buffer
        self.last_api_calls = []
        
        # Batch operation tracking
        self.active_batch_operations = {}
        
        # Retry configuration
        self.max_retries = 3
        self.retry_delay_base = 1  # seconds
        
        logger.info("Enhanced Zoho CRM Service initialized")
    
    # ==================== API 1: Module Metadata ====================
    
    async def get_module_metadata(self, module_name: str = "Deals") -> Dict[str, Any]:
        """
        API 1: Get module metadata including capabilities and permissions
        
        Args:
            module_name: Zoho CRM module name (default: Deals)
            
        Returns:
            Dictionary containing module metadata and capabilities
        """
        try:
            url = f"{self.base_url}/settings/modules/{module_name}"
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "GET", url)
                
                if response.get("modules"):
                    module_data = response["modules"][0]
                    
                    # Extract key capabilities
                    capabilities = {
                        "creatable": module_data.get("creatable", False),
                        "updatable": module_data.get("updatable", False),
                        "deletable": module_data.get("deletable", False),
                        "viewable": module_data.get("viewable", False),
                        "convertable": module_data.get("convertable", False),
                        "editable": module_data.get("editable", False)
                    }
                    
                    # Check for bulk operation support
                    bulk_capabilities = {
                        "bulk_read": True,  # Generally available
                        "bulk_create": capabilities.get("creatable", False),
                        "bulk_update": capabilities.get("updatable", False),
                        "bulk_delete": capabilities.get("deletable", False)
                    }
                    
                    return {
                        "module_name": module_name,
                        "api_name": module_data.get("api_name"),
                        "display_label": module_data.get("display_label"),
                        "capabilities": capabilities,
                        "bulk_capabilities": bulk_capabilities,
                        "fields_supported": len(module_data.get("fields", [])),
                        "custom_fields_allowed": module_data.get("custom_fields_allowed", False),
                        "max_records_per_call": module_data.get("per_page", 200),
                        "generated_type": module_data.get("generated_type"),
                        "module_sequence": module_data.get("sequence_number")
                    }
                else:
                    raise ZohoAPIError(f"Module {module_name} not found or no access")
                    
        except Exception as e:
            logger.error(f"Failed to get module metadata for {module_name}: {str(e)}")
            raise ZohoAPIError(f"Module metadata retrieval failed: {str(e)}")
    
    # ==================== API 2: Field Metadata ====================
    
    async def get_field_metadata(self, module_name: str = "Deals", 
                               include_custom: bool = True) -> Dict[str, Any]:
        """
        API 2: Get field metadata including properties, validation rules, and picklist values
        
        Args:
            module_name: Zoho CRM module name
            include_custom: Whether to include custom fields
            
        Returns:
            Dictionary containing field definitions and validation rules
        """
        try:
            url = f"{self.base_url}/settings/fields"
            params = {"module": module_name}
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "GET", url, params=params)
                
                fields_data = response.get("fields", [])
                
                # Process field metadata
                fields_metadata = {}
                custom_fields = {}
                required_fields = []
                picklist_fields = {}
                
                for field in fields_data:
                    field_name = field.get("api_name")
                    is_custom = field.get("custom_field", False)
                    
                    # Skip custom fields if not requested
                    if is_custom and not include_custom:
                        continue
                    
                    field_info = {
                        "display_label": field.get("display_label"),
                        "data_type": field.get("data_type"),
                        "max_length": field.get("length"),
                        "required": field.get("system_mandatory", False) or field.get("field_read_only", False),
                        "read_only": field.get("read_only", False),
                        "custom_field": is_custom,
                        "visible": field.get("visible", True),
                        "editable": not field.get("read_only", False),
                        "searchable": field.get("searchable", False),
                        "created_source": field.get("created_source"),
                        "field_label": field.get("field_label"),
                        "tooltip": field.get("tooltip"),
                        "default_value": field.get("default_value")
                    }
                    
                    # Handle picklist fields
                    if field.get("data_type") == "picklist" and field.get("pick_list_values"):
                        picklist_values = []
                        for option in field["pick_list_values"]:
                            picklist_values.append({
                                "display_value": option.get("display_value"),
                                "actual_value": option.get("actual_value"),
                                "sequence_number": option.get("sequence_number"),
                                "maps": option.get("maps", [])
                            })
                        
                        field_info["picklist_values"] = picklist_values
                        picklist_fields[field_name] = picklist_values
                    
                    # Handle lookup fields
                    if field.get("data_type") == "lookup":
                        field_info["lookup_module"] = field.get("lookup", {}).get("module")
                        field_info["lookup_display_label"] = field.get("lookup", {}).get("display_label")
                    
                    fields_metadata[field_name] = field_info
                    
                    # Track required fields
                    if field_info["required"]:
                        required_fields.append(field_name)
                    
                    # Track custom fields separately
                    if is_custom:
                        custom_fields[field_name] = field_info
                
                # Check which Pipeline Pulse required fields are available
                available_required_fields = []
                missing_required_fields = []
                
                for req_field in self.REQUIRED_FIELDS:
                    if req_field in fields_metadata:
                        available_required_fields.append(req_field)
                    else:
                        missing_required_fields.append(req_field)
                
                return {
                    "module_name": module_name,
                    "total_fields": len(fields_metadata),
                    "custom_fields_count": len(custom_fields),
                    "required_fields_count": len(required_fields),
                    "picklist_fields_count": len(picklist_fields),
                    "fields": fields_metadata,
                    "custom_fields": custom_fields,
                    "required_fields": required_fields,
                    "picklist_fields": picklist_fields,
                    "pipeline_pulse_fields": {
                        "available": available_required_fields,
                        "missing": missing_required_fields,
                        "coverage_percentage": (len(available_required_fields) / len(self.REQUIRED_FIELDS)) * 100
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to get field metadata for {module_name}: {str(e)}")
            raise ZohoAPIError(f"Field metadata retrieval failed: {str(e)}")
    
    # ==================== API 3: Full Sync ====================
    
    async def perform_full_sync(self, module_name: str = "Deals", 
                              fields: List[str] = None,
                              sync_session: CRMSyncSession = None) -> SyncResult:
        """
        API 3: Perform full synchronization with pagination handling
        
        Args:
            module_name: Zoho CRM module to sync
            fields: Specific fields to retrieve (default: all required fields)
            sync_session: Existing sync session to update
            
        Returns:
            SyncResult with comprehensive sync information
        """
        start_time = time.time()
        
        if not fields:
            fields = self.REQUIRED_FIELDS
            
        session_id = sync_session.id if sync_session else None
        
        try:
            # Create sync session if not provided
            if not sync_session:
                db = next(get_db())
                sync_session = CRMSyncSession(
                    session_type=SyncOperationType.FULL_SYNC,
                    module_name=module_name,
                    initiated_by="system"
                )
                db.add(sync_session)
                db.commit()
                session_id = sync_session.id
            
            await self._log_sync_status(sync_session.id, "INFO", "SYNC", 
                                      f"Starting full sync for {module_name}")
            
            # Update session status
            sync_session.status = SyncSessionStatus.IN_PROGRESS
            
            # Fetch all records with pagination
            all_records = []
            total_records = 0
            page = 1
            
            while True:
                page_records, pagination_info = await self.fetch_all_pages(
                    module_name=module_name,
                    fields=fields,
                    page=page,
                    per_page=200
                )
                
                all_records.extend(page_records)
                total_records = pagination_info.total_count
                
                # Update progress
                sync_session.total_records = total_records
                sync_session.processed_records = len(all_records)
                
                await self._log_sync_status(sync_session.id, "INFO", "SYNC",
                                          f"Fetched page {page}, {len(page_records)} records")
                
                if not pagination_info.has_more:
                    break
                    
                page += 1
            
            # Process records
            successful_records = 0
            failed_records = 0
            skipped_records = 0
            conflicts = []
            errors = []
            
            for record in all_records:
                try:
                    # Process individual record
                    result = await self._process_sync_record(
                        record, sync_session.id, RecordSyncAction.UPDATED
                    )
                    
                    if result["status"] == "success":
                        successful_records += 1
                    elif result["status"] == "skipped":
                        skipped_records += 1
                    else:
                        failed_records += 1
                        errors.append(result)
                        
                    if result.get("conflicts"):
                        conflicts.extend(result["conflicts"])
                        
                except Exception as e:
                    failed_records += 1
                    error_detail = {
                        "record_id": record.get("id"),
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    errors.append(error_detail)
                    
                    await self._log_sync_status(sync_session.id, "ERROR", "RECORD",
                                              f"Failed to process record {record.get('id')}: {str(e)}")
            
            # Complete session
            sync_session.status = SyncSessionStatus.COMPLETED
            sync_session.successful_records = successful_records
            sync_session.failed_records = failed_records
            sync_session.skipped_records = skipped_records
            sync_session.completed_at = datetime.utcnow()
            
            duration = time.time() - start_time
            
            await self._log_sync_status(sync_session.id, "INFO", "SYNC",
                                      f"Full sync completed. Success: {successful_records}, "
                                      f"Failed: {failed_records}, Duration: {duration:.2f}s")
            
            return SyncResult(
                session_id=session_id,
                status=SyncSessionStatus.COMPLETED,
                total_records=total_records,
                successful_records=successful_records,
                failed_records=failed_records,
                skipped_records=skipped_records,
                conflicts=conflicts,
                errors=errors,
                duration_seconds=duration
            )
            
        except Exception as e:
            # Mark session as failed
            if sync_session:
                sync_session.status = SyncSessionStatus.FAILED
                sync_session.error_message = str(e)
                
            duration = time.time() - start_time
            
            logger.error(f"Full sync failed for {module_name}: {str(e)}")
            raise ZohoAPIError(f"Full sync failed: {str(e)}")
    
    # ==================== API 4: Incremental Sync ====================
    
    async def perform_incremental_sync(self, module_name: str = "Deals",
                                     since_datetime: datetime = None,
                                     fields: List[str] = None,
                                     sync_session: CRMSyncSession = None) -> SyncResult:
        """
        API 4: Perform incremental sync for records modified since a specific time
        
        Args:
            module_name: Zoho CRM module to sync
            since_datetime: Only fetch records modified after this time
            fields: Specific fields to retrieve
            sync_session: Existing sync session to update
            
        Returns:
            SyncResult with incremental sync information
        """
        start_time = time.time()
        
        if not since_datetime:
            # Default to last 24 hours
            since_datetime = datetime.utcnow() - timedelta(hours=24)
            
        if not fields:
            fields = self.REQUIRED_FIELDS
            
        session_id = sync_session.id if sync_session else None
        
        try:
            # Create sync session if not provided
            if not sync_session:
                db = next(get_db())
                sync_session = CRMSyncSession(
                    session_type=SyncOperationType.INCREMENTAL_SYNC,
                    module_name=module_name,
                    from_timestamp=since_datetime,
                    initiated_by="system"
                )
                db.add(sync_session)
                db.commit()
                session_id = sync_session.id
            
            await self._log_sync_status(sync_session.id, "INFO", "SYNC",
                                      f"Starting incremental sync for {module_name} since {since_datetime}")
            
            # Update session status
            sync_session.status = SyncSessionStatus.IN_PROGRESS
            
            # Build search criteria for modified records
            since_str = since_datetime.strftime("%Y-%m-%dT%H:%M:%S%z") or since_datetime.strftime("%Y-%m-%dT%H:%M:%S+00:00")
            
            search_criteria = f"(Modified_Time:greater_than:{since_str})"
            
            # Search for modified records
            modified_records = await self.search_records(
                module_name=module_name,
                criteria=search_criteria,
                fields=fields
            )
            
            total_records = len(modified_records.get("data", []))
            sync_session.total_records = total_records
            
            # Process modified records
            successful_records = 0
            failed_records = 0
            skipped_records = 0
            conflicts = []
            errors = []
            
            for record in modified_records.get("data", []):
                try:
                    # Determine action based on record status
                    action = RecordSyncAction.UPDATED
                    if record.get("Created_Time") == record.get("Modified_Time"):
                        action = RecordSyncAction.CREATED
                    
                    result = await self._process_sync_record(
                        record, sync_session.id, action
                    )
                    
                    if result["status"] == "success":
                        successful_records += 1
                    elif result["status"] == "skipped":
                        skipped_records += 1
                    else:
                        failed_records += 1
                        errors.append(result)
                        
                    if result.get("conflicts"):
                        conflicts.extend(result["conflicts"])
                        
                    sync_session.processed_records = successful_records + failed_records + skipped_records
                    
                except Exception as e:
                    failed_records += 1
                    error_detail = {
                        "record_id": record.get("id"),
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    errors.append(error_detail)
            
            # Complete session
            sync_session.status = SyncSessionStatus.COMPLETED
            sync_session.successful_records = successful_records
            sync_session.failed_records = failed_records
            sync_session.skipped_records = skipped_records
            sync_session.completed_at = datetime.utcnow()
            sync_session.last_modified_time = datetime.utcnow()
            
            duration = time.time() - start_time
            
            await self._log_sync_status(sync_session.id, "INFO", "SYNC",
                                      f"Incremental sync completed. Total: {total_records}, "
                                      f"Success: {successful_records}, Duration: {duration:.2f}s")
            
            return SyncResult(
                session_id=session_id,
                status=SyncSessionStatus.COMPLETED,
                total_records=total_records,
                successful_records=successful_records,
                failed_records=failed_records,
                skipped_records=skipped_records,
                conflicts=conflicts,
                errors=errors,
                duration_seconds=duration
            )
            
        except Exception as e:
            if sync_session:
                sync_session.status = SyncSessionStatus.FAILED
                sync_session.error_message = str(e)
                
            duration = time.time() - start_time
            logger.error(f"Incremental sync failed for {module_name}: {str(e)}")
            raise ZohoAPIError(f"Incremental sync failed: {str(e)}")
    
    # ==================== API 5: Pagination Handler ====================
    
    async def fetch_all_pages(self, module_name: str = "Deals",
                            fields: List[str] = None,
                            page: int = 1,
                            per_page: int = 200) -> Tuple[List[Dict[str, Any]], PaginationInfo]:
        """
        API 5: Fetch records with pagination handling
        
        Args:
            module_name: Zoho CRM module name
            fields: Fields to retrieve
            page: Page number to fetch
            per_page: Records per page (max 200)
            
        Returns:
            Tuple of (records_list, pagination_info)
        """
        try:
            url = f"{self.base_url}/{module_name}"
            
            params = {
                "page": page,
                "per_page": min(per_page, 200)  # Zoho max is 200
            }
            
            if fields:
                params["fields"] = ",".join(fields)
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "GET", url, params=params)
                
                records = response.get("data", [])
                info = response.get("info", {})
                
                pagination_info = PaginationInfo(
                    page=info.get("page", page),
                    per_page=info.get("per_page", per_page),
                    total_count=info.get("count", len(records)),
                    has_more=info.get("more_records", False),
                    next_page_token=info.get("next_page_token")
                )
                
                return records, pagination_info
                
        except Exception as e:
            logger.error(f"Failed to fetch page {page} for {module_name}: {str(e)}")
            raise ZohoAPIError(f"Page fetch failed: {str(e)}")
    
    # ==================== API 6: Create Custom Field ====================
    
    async def create_custom_field(self, module_name: str, field_definition: Dict[str, Any]) -> Dict[str, Any]:
        """
        API 6: Create a custom field in Zoho CRM for Pipeline Pulse tracking
        
        Args:
            module_name: Target module (e.g., "Deals")
            field_definition: Field properties and configuration
            
        Returns:
            Dictionary with creation result and field details
        """
        try:
            url = f"{self.base_url}/settings/fields"
            
            # Validate field definition
            required_keys = ["api_name", "display_label", "data_type"]
            for key in required_keys:
                if key not in field_definition:
                    raise ValueError(f"Missing required field definition key: {key}")
            
            # Prepare field data
            field_data = {
                "fields": [{
                    "module": module_name,
                    **field_definition
                }]
            }
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "POST", url, json_data=field_data)
                
                if response.get("fields"):
                    field_result = response["fields"][0]
                    
                    return {
                        "status": "success",
                        "field_id": field_result.get("id"),
                        "api_name": field_result.get("api_name"),
                        "display_label": field_result.get("display_label"),
                        "data_type": field_result.get("data_type"),
                        "message": field_result.get("message", "Field created successfully")
                    }
                else:
                    raise ZohoAPIError("Field creation response missing field data")
                    
        except Exception as e:
            logger.error(f"Failed to create custom field in {module_name}: {str(e)}")
            raise ZohoAPIError(f"Custom field creation failed: {str(e)}")
    
    # ==================== API 7: Update Custom Field ====================
    
    async def update_custom_field(self, module_name: str, field_id: str, 
                                field_updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        API 7: Update properties of an existing custom field
        
        Args:
            module_name: Target module name
            field_id: ID of the field to update
            field_updates: Properties to update
            
        Returns:
            Dictionary with update result
        """
        try:
            url = f"{self.base_url}/settings/fields/{field_id}"
            
            # Prepare update data
            field_data = {
                "fields": [{
                    "module": module_name,
                    **field_updates
                }]
            }
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "PUT", url, json_data=field_data)
                
                if response.get("fields"):
                    field_result = response["fields"][0]
                    
                    return {
                        "status": "success",
                        "field_id": field_result.get("id"),
                        "updated_properties": list(field_updates.keys()),
                        "message": field_result.get("message", "Field updated successfully")
                    }
                else:
                    raise ZohoAPIError("Field update response missing field data")
                    
        except Exception as e:
            logger.error(f"Failed to update field {field_id} in {module_name}: {str(e)}")
            raise ZohoAPIError(f"Field update failed: {str(e)}")
    
    # ==================== API 8: Small Batch Update ====================
    
    async def small_batch_update(self, module_name: str, records: List[Dict[str, Any]], 
                               duplicate_check_fields: List[str] = None) -> Dict[str, Any]:
        """
        API 8: Update ≤100 records in a single batch operation
        
        Args:
            module_name: Target module name
            records: List of records to update (max 100)
            duplicate_check_fields: Fields to check for duplicates
            
        Returns:
            Dictionary with batch update results
        """
        if len(records) > 100:
            raise ValueError("Small batch update limited to 100 records maximum")
        
        try:
            url = f"{self.base_url}/{module_name}"
            
            # Prepare batch data
            batch_data = {"data": records}
            
            if duplicate_check_fields:
                batch_data["duplicate_check_fields"] = duplicate_check_fields
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "PUT", url, json_data=batch_data)
                
                return self._process_batch_response(response, "small_batch_update")
                
        except Exception as e:
            logger.error(f"Small batch update failed for {module_name}: {str(e)}")
            raise ZohoAPIError(f"Small batch update failed: {str(e)}")
    
    # ==================== API 9: Mass Update Records ====================
    
    async def mass_update_records(self, module_name: str, record_ids: List[str],
                                field_updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        API 9: Mass update ≤50,000 records with same field values
        
        Args:
            module_name: Target module name
            record_ids: List of record IDs to update (max 50,000)
            field_updates: Fields and values to update across all records
            
        Returns:
            Dictionary with mass update job details
        """
        if len(record_ids) > 50000:
            raise ValueError("Mass update limited to 50,000 records maximum")
        
        try:
            url = f"{self.base_url}/{module_name}/actions/mass_update"
            
            # Prepare mass update data
            mass_update_data = {
                "data": field_updates,
                "ids": record_ids
            }
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "POST", url, json_data=mass_update_data)
                
                job_id = response.get("details", {}).get("job_id")
                
                if job_id:
                    # Track the job
                    self.active_batch_operations[job_id] = {
                        "type": "mass_update",
                        "module": module_name,
                        "record_count": len(record_ids),
                        "started_at": datetime.utcnow(),
                        "status": BatchOperationStatus.IN_PROGRESS
                    }
                
                return {
                    "status": "initiated",
                    "job_id": job_id,
                    "record_count": len(record_ids),
                    "estimated_time": len(record_ids) // 1000,  # Rough estimate
                    "fields_updated": list(field_updates.keys())
                }
                
        except Exception as e:
            logger.error(f"Mass update failed for {module_name}: {str(e)}")
            raise ZohoAPIError(f"Mass update failed: {str(e)}")
    
    # ==================== API 10: Bulk Write Operation ====================
    
    async def bulk_write_operation(self, operations: List[Dict[str, Any]], 
                                 callback_url: str = None) -> Dict[str, Any]:
        """
        API 10: Complex bulk operations for ≤25,000 records with mixed operations
        
        Args:
            operations: List of operations (insert, update, upsert)
            callback_url: Optional webhook URL for completion notification
            
        Returns:
            Dictionary with bulk write job details
        """
        total_records = sum(len(op.get("data", [])) for op in operations)
        
        if total_records > 25000:
            raise ValueError("Bulk write limited to 25,000 records maximum")
        
        try:
            url = f"{self.base_url}/bulk/write"
            
            # Prepare bulk write data
            bulk_data = {
                "operations": operations,
                "callback": {
                    "method": "post"
                }
            }
            
            if callback_url:
                bulk_data["callback"]["url"] = callback_url
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "POST", url, json_data=bulk_data)
                
                job_id = response.get("details", {}).get("job_id")
                
                if job_id:
                    # Track the job
                    self.active_batch_operations[job_id] = {
                        "type": "bulk_write",
                        "operations": len(operations),
                        "record_count": total_records,
                        "started_at": datetime.utcnow(),
                        "status": BatchOperationStatus.IN_PROGRESS
                    }
                
                return {
                    "status": "initiated",
                    "job_id": job_id,
                    "operation_count": len(operations),
                    "record_count": total_records,
                    "estimated_time": total_records // 2000  # Rough estimate
                }
                
        except Exception as e:
            logger.error(f"Bulk write operation failed: {str(e)}")
            raise ZohoAPIError(f"Bulk write operation failed: {str(e)}")
    
    # ==================== API 11: Search Records ====================
    
    async def search_records(self, module_name: str = "Deals", criteria: str = None,
                           fields: List[str] = None, page: int = 1) -> Dict[str, Any]:
        """
        API 11: Search records using criteria-based queries
        
        Args:
            module_name: Target module name
            criteria: Search criteria string
            fields: Fields to retrieve
            page: Page number for results
            
        Returns:
            Dictionary with search results
        """
        try:
            url = f"{self.base_url}/{module_name}/search"
            
            params = {"page": page}
            
            if criteria:
                params["criteria"] = criteria
            
            if fields:
                params["fields"] = ",".join(fields)
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "GET", url, params=params)
                
                return {
                    "data": response.get("data", []),
                    "info": response.get("info", {}),
                    "search_criteria": criteria,
                    "total_count": response.get("info", {}).get("count", 0)
                }
                
        except Exception as e:
            logger.error(f"Search failed for {module_name} with criteria {criteria}: {str(e)}")
            raise ZohoAPIError(f"Search operation failed: {str(e)}")
    
    # ==================== API 12: Get Single Record ====================
    
    async def get_single_record(self, module_name: str, record_id: str, 
                              fields: List[str] = None) -> Dict[str, Any]:
        """
        API 12: Fetch a single record by ID with optional field selection
        
        Args:
            module_name: Target module name
            record_id: Specific record ID to fetch
            fields: Optional list of fields to retrieve
            
        Returns:
            Dictionary with record data
        """
        try:
            url = f"{self.base_url}/{module_name}/{record_id}"
            
            params = {}
            if fields:
                params["fields"] = ",".join(fields)
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "GET", url, params=params)
                
                records = response.get("data", [])
                if records:
                    return {
                        "status": "found",
                        "record": records[0],
                        "record_id": record_id
                    }
                else:
                    return {
                        "status": "not_found",
                        "record": None,
                        "record_id": record_id
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get record {record_id} from {module_name}: {str(e)}")
            raise ZohoAPIError(f"Single record fetch failed: {str(e)}")
    
    # ==================== API 13: Check Mass Update Status ====================
    
    async def check_mass_update_status(self, job_id: str) -> Dict[str, Any]:
        """
        API 13: Check status of mass update operations
        
        Args:
            job_id: Job ID returned from mass update operation
            
        Returns:
            Dictionary with job status and progress
        """
        try:
            url = f"{self.base_url}/bulk/write/{job_id}"
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "GET", url)
                
                job_status = response.get("status")
                job_details = response.get("job", {})
                
                # Update our tracking
                if job_id in self.active_batch_operations:
                    if job_status in ["COMPLETED", "FAILED"]:
                        self.active_batch_operations[job_id]["status"] = BatchOperationStatus.COMPLETED if job_status == "COMPLETED" else BatchOperationStatus.FAILED
                
                return {
                    "job_id": job_id,
                    "status": job_status,
                    "progress": job_details.get("progress", 0),
                    "total_count": job_details.get("total_count", 0),
                    "processed_count": job_details.get("processed_count", 0),
                    "failed_count": job_details.get("failed_count", 0),
                    "created_time": job_details.get("created_time"),
                    "completed_time": job_details.get("completed_time")
                }
                
        except Exception as e:
            logger.error(f"Failed to check mass update status for job {job_id}: {str(e)}")
            raise ZohoAPIError(f"Mass update status check failed: {str(e)}")
    
    # ==================== API 14: Check Bulk Write Status ====================
    
    async def check_bulk_write_status(self, job_id: str) -> Dict[str, Any]:
        """
        API 14: Check status of bulk write operations
        
        Args:
            job_id: Job ID returned from bulk write operation
            
        Returns:
            Dictionary with detailed job status and results
        """
        try:
            url = f"{self.base_url}/bulk/write/{job_id}"
            
            async with httpx.AsyncClient() as client:
                response = await self._make_api_call(client, "GET", url)
                
                # Parse the response
                job_status = response.get("status")
                result = response.get("result", {})
                
                # Update our tracking
                if job_id in self.active_batch_operations:
                    if job_status in ["COMPLETED", "FAILED", "PARTIAL"]:
                        status_map = {
                            "COMPLETED": BatchOperationStatus.COMPLETED,
                            "FAILED": BatchOperationStatus.FAILED,
                            "PARTIAL": BatchOperationStatus.PARTIAL
                        }
                        self.active_batch_operations[job_id]["status"] = status_map[job_status]
                
                # Download and parse result file if available
                download_url = result.get("download_url")
                detailed_results = None
                
                if download_url and job_status in ["COMPLETED", "PARTIAL"]:
                    try:
                        detailed_results = await self._download_bulk_results(download_url)
                    except Exception as e:
                        logger.warning(f"Failed to download bulk results: {str(e)}")
                
                return {
                    "job_id": job_id,
                    "status": job_status,
                    "created_time": result.get("created_time"),
                    "completed_time": result.get("completed_time"),
                    "total_count": result.get("total_count", 0),
                    "processed_count": result.get("processed_count", 0),
                    "success_count": result.get("success_count", 0),
                    "failed_count": result.get("failed_count", 0),
                    "download_url": download_url,
                    "detailed_results": detailed_results
                }
                
        except Exception as e:
            logger.error(f"Failed to check bulk write status for job {job_id}: {str(e)}")
            raise ZohoAPIError(f"Bulk write status check failed: {str(e)}")
    
    # ==================== Helper Methods ====================
    
    async def _make_api_call(self, client: httpx.AsyncClient, method: str, 
                           url: str, params: Dict = None, json_data: Dict = None,
                           retry_count: int = 0) -> Dict[str, Any]:
        """Make authenticated API call with rate limiting and retry logic"""
        
        # Rate limiting check
        await self._check_rate_limit()
        
        headers = {
            "Authorization": f"Zoho-oauthtoken {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = await client.request(method, url, headers=headers, 
                                          params=params, json=json_data)
            
            # Track API call
            self.last_api_calls.append(time.time())
            
            response_data = response.json()
            
            # Handle rate limit
            if response.status_code == 429:
                if retry_count < self.max_retries:
                    wait_time = self.retry_delay_base * (2 ** retry_count)
                    logger.warning(f"Rate limited, waiting {wait_time}s before retry")
                    await asyncio.sleep(wait_time)
                    return await self._make_api_call(client, method, url, params, 
                                                   json_data, retry_count + 1)
                else:
                    raise RateLimitError("Rate limit exceeded and max retries reached")
                
            # Handle authentication errors
            if response.status_code == 401:
                # Try to refresh token
                if self.refresh_token and retry_count == 0:
                    await self._refresh_access_token()
                    return await self._make_api_call(client, method, url, params,
                                                   json_data, retry_count + 1)
                else:
                    raise ZohoAPIError("Authentication failed", "INVALID_TOKEN", 401)
            
            # Handle other HTTP errors
            if response.status_code >= 400:
                error_msg = response_data.get("message", f"HTTP {response.status_code}")
                error_code = response_data.get("code", str(response.status_code))
                raise ZohoAPIError(error_msg, error_code, response.status_code)
            
            return response_data
                
        except httpx.RequestError as e:
            if retry_count < self.max_retries:
                wait_time = self.retry_delay_base * (2 ** retry_count)
                logger.warning(f"Network error, retrying in {wait_time}s: {str(e)}")
                await asyncio.sleep(wait_time)
                return await self._make_api_call(client, method, url, params,
                                               json_data, retry_count + 1)
            else:
                raise ZohoAPIError(f"Network error: {str(e)}")
    
    async def _check_rate_limit(self):
        """Check and enforce rate limiting"""
        current_time = time.time()
        
        # Remove calls older than 1 minute
        self.last_api_calls = [call_time for call_time in self.last_api_calls 
                              if current_time - call_time < 60]
        
        # Check if we're approaching the limit
        calls_in_last_minute = len(self.last_api_calls)
        limit_with_buffer = self.rate_limit_calls_per_minute - self.rate_limit_buffer
        
        if calls_in_last_minute >= limit_with_buffer:
            # Calculate wait time
            oldest_call = min(self.last_api_calls)
            wait_time = 60 - (current_time - oldest_call)
            
            if wait_time > 0:
                logger.info(f"Rate limit approached, waiting {wait_time:.2f}s")
                await asyncio.sleep(wait_time)
    
    async def _refresh_access_token(self):
        """Refresh the access token using refresh token"""
        if not self.refresh_token:
            raise ZohoAPIError("No refresh token available")
        
        # Implementation would depend on your OAuth setup
        # This is a placeholder for the refresh logic
        logger.info("Refreshing access token...")
        # TODO: Implement actual token refresh
    
    async def _log_sync_status(self, session_id: str, level: str, component: str, 
                             message: str, record_id: str = None):
        """Log sync status to database"""
        try:
            db = next(get_db())
            log_entry = SyncStatusLog(
                session_id=session_id,
                log_level=level,
                component=component,
                message=message,
                record_id=record_id
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log sync status: {str(e)}")
    
    async def _process_sync_record(self, record: Dict[str, Any], session_id: str,
                                 action: RecordSyncAction) -> Dict[str, Any]:
        """Process individual record during sync"""
        try:
            # Create record sync status
            db = next(get_db())
            record_status = RecordSyncStatus(
                session_id=session_id,
                crm_record_id=record.get("id"),
                action_taken=action,
                sync_direction="from_crm",
                after_data=record
            )
            
            # TODO: Implement actual record processing logic
            # This would include conflict detection, data transformation, etc.
            
            db.add(record_status)
            db.commit()
            
            return {
                "status": "success",
                "record_id": record.get("id"),
                "action": action.value,
                "conflicts": []
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "record_id": record.get("id"),
                "error": str(e),
                "conflicts": []
            }
    
    def _process_batch_response(self, response: Dict[str, Any], operation_type: str) -> Dict[str, Any]:
        """Process batch operation response"""
        data = response.get("data", [])
        
        successful_records = []
        failed_records = []
        
        for item in data:
            if item.get("status") == "success":
                successful_records.append(item)
            else:
                failed_records.append(item)
        
        return {
            "operation_type": operation_type,
            "total_records": len(data),
            "successful_records": len(successful_records),
            "failed_records": len(failed_records),
            "success_rate": (len(successful_records) / len(data) * 100) if data else 0,
            "successful_ids": [item.get("details", {}).get("id") for item in successful_records],
            "failed_items": failed_records
        }
    
    async def _download_bulk_results(self, download_url: str) -> Dict[str, Any]:
        """Download and parse bulk operation results"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(download_url)
                if response.status_code == 200:
                    content = response.text
                    # Parse CSV content
                    # TODO: Implement CSV parsing logic
                    return {"raw_content": content[:1000]}  # First 1000 chars for now
                else:
                    raise ZohoAPIError(f"Failed to download results: HTTP {response.status_code}")
        except Exception as e:
            raise ZohoAPIError(f"Results download failed: {str(e)}")