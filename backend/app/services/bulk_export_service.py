"""
Bulk Export Service for Zoho CRM using Bulk Read API
"""

import json
import uuid
import asyncio
import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.models.bulk_export import BulkExportJob, BulkExportRecord, BulkExportJobStatus
from app.models.system_settings import SystemSetting
from app.models.crm_record import CrmRecord
from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
import logging

logger = logging.getLogger(__name__)


class BulkExportService:
    """Service for managing Zoho bulk export operations"""

    def __init__(self):
        self.auth_manager = ZohoAuthManager()
        self.callback_url = settings.ZOHO_BULK_EXPORT_CALLBACK_URL
        self.poll_interval = 60  # 1 minute polling interval
        # Bulk API uses different base URL - remove /v8 from CRM base URL
        self.bulk_base_url = self.auth_manager.base_url.replace('/crm/v8', '/crm')

    async def start_bulk_export(self, db: Session, criteria: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Start a bulk export job for Deals module
        Returns job details and estimated record counts

        Args:
            db: Database session
            criteria: Optional custom criteria for filtering records
        """
        try:
            # For now, return a simple success response without authentication check
            # TODO: Re-enable authentication check when rate limiting is resolved
            # TODO: Implement full bulk export functionality
            job_id = str(uuid.uuid4())

            return {
                "success": True,
                "job_id": job_id,
                "zoho_job_id": f"zoho_{job_id}",
                "estimated_records": 100,
                "last_sync": None,
                "status": "started",
                "message": "Bulk export started successfully. This is a development placeholder response."
            }
            
        except Exception as e:
            logger.error(f"Failed to start bulk export: {str(e)}")
            raise Exception(f"Failed to start bulk export: {str(e)}")

    def _get_last_sync_timestamp(self, db: Session) -> Optional[datetime]:
        """Get the last successful sync timestamp"""
        setting = db.query(SystemSetting).filter(
            SystemSetting.key == "last_bulk_export_sync"
        ).first()
        
        if setting and setting.value:
            try:
                return datetime.fromisoformat(setting.value)
            except ValueError:
                logger.warning(f"Invalid last sync timestamp: {setting.value}")
        
        # If no last sync, get the most recent record from local database
        latest_analysis = db.query(Analysis).order_by(Analysis.created_at.desc()).first()
        if latest_analysis:
            return latest_analysis.created_at
        
        # Default to 30 days ago if no data exists
        return datetime.utcnow() - timedelta(days=30)

    def _build_sync_criteria(self, last_sync: Optional[datetime]) -> Optional[Dict[str, Any]]:
        """Build criteria to fetch only new/modified records"""
        if not last_sync:
            return None  # Fetch all records
        
        # Format timestamp for Zoho API (ISO 8601)
        sync_timestamp = last_sync.strftime("%Y-%m-%dT%H:%M:%S%z")
        if not sync_timestamp.endswith('+00:00'):
            sync_timestamp += "+00:00"
        
        return {
            "group_operator": "or",
            "group": [
                {
                    "field": {"api_name": "Created_Time"},
                    "comparator": "greater_than",
                    "value": sync_timestamp
                },
                {
                    "field": {"api_name": "Modified_Time"},
                    "comparator": "greater_than", 
                    "value": sync_timestamp
                }
            ]
        }

    async def _estimate_record_count(self, criteria: Optional[Dict[str, Any]]) -> int:
        """Estimate the number of records that will be exported"""
        try:
            # Use regular API to get a count estimate
            deals = await self.zoho_service.get_deals(limit=1, offset=0)
            # This is a rough estimate - in production you might want to use search API
            return len(deals) if deals else 0
        except Exception as e:
            logger.warning(f"Failed to estimate record count: {e}")
            return 0

    async def _create_zoho_export_job(self, criteria: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Create the actual Zoho bulk export job"""
        
        # Build the export request payload
        payload: Dict[str, Any] = {
            "query": {
                "module": {
                    "api_name": "Deals"
                }
            }
        }

        # Add criteria if we have any
        if criteria:
            payload["query"]["criteria"] = criteria

        # Add callback URL if configured
        if self.callback_url:
            payload["callback"] = {
                "url": self.callback_url,
                "method": "post"
            }
        
        # Make the API call to create bulk export job
        if not self.zoho_service.access_token:
            await self.zoho_service.get_access_token()

        headers = {
            "Authorization": f"Zoho-oauthtoken {self.zoho_service.access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.bulk_base_url}/bulk/v8/read",
                headers=headers,
                json=payload,
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("data") and len(result["data"]) > 0:
                    job_data = result["data"][0]
                    if job_data.get("status") == "success":
                        return job_data.get("details", {})
                    else:
                        raise Exception(f"Zoho job creation failed: {job_data.get('message', 'Unknown error')}")
                else:
                    raise Exception("Invalid response from Zoho bulk export API")
            else:
                raise Exception(f"Zoho API error: {response.status_code} - {response.text}")

    async def _poll_job_status(self, job_id: str, db: Session):
        """Poll job status until completion (background task)"""
        max_polls = 60  # Maximum 60 polls (1 hour with 1-minute intervals)
        poll_count = 0
        
        while poll_count < max_polls:
            try:
                await asyncio.sleep(self.poll_interval)
                poll_count += 1
                
                # Get job from database
                job = db.query(BulkExportJob).filter(BulkExportJob.id == job_id).first()
                if not job or job.status in [BulkExportJobStatus.COMPLETED, BulkExportJobStatus.FAILED]:
                    break
                
                # Check job status with Zoho
                if job.zoho_job_id:
                    status_result = await self._check_zoho_job_status(job.zoho_job_id)
                    await self._update_job_status(job, status_result, db)
                
            except Exception as e:
                logger.error(f"Error polling job {job_id}: {str(e)}")
                
        logger.info(f"Polling completed for job {job_id} after {poll_count} polls")

    async def _check_zoho_job_status(self, zoho_job_id: str) -> Dict[str, Any]:
        """Check the status of a Zoho bulk export job"""
        if not self.zoho_service.access_token:
            await self.zoho_service.get_access_token()

        headers = {
            "Authorization": f"Zoho-oauthtoken {self.zoho_service.access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.bulk_base_url}/bulk/v8/read/{zoho_job_id}",
                headers=headers,
                timeout=30.0
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to check job status: {response.status_code} - {response.text}")

    async def _update_job_status(self, job: BulkExportJob, status_result: Dict[str, Any], db: Session):
        """Update job status based on Zoho response"""
        try:
            data = status_result.get("data", [])
            if not data:
                return
            
            job_data = data[0]
            zoho_state = job_data.get("state", "").upper()
            
            # Update job status
            if zoho_state == "COMPLETED":
                job.status = BulkExportJobStatus.COMPLETED
                job.completed_at = datetime.utcnow()
                
                # Process the completed job
                result = job_data.get("result", {})
                job.total_records = result.get("count", 0)
                job.download_url = result.get("download_url")
                
                # Download and process the data
                await self._process_completed_job(job, db)
                
            elif zoho_state == "FAILURE":
                job.status = BulkExportJobStatus.FAILED
                job.completed_at = datetime.utcnow()
                error_result = job_data.get("result", {})
                job.error_message = str(error_result.get("error_message", "Unknown error"))
                
            elif zoho_state == "IN PROGRESS":
                job.status = BulkExportJobStatus.IN_PROGRESS
            
            job.last_polled_at = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            logger.error(f"Error updating job status: {str(e)}")

    async def _process_completed_job(self, job: BulkExportJob, db: Session):
        """Process completed export job - download and import data"""
        try:
            if not job.zoho_job_id:
                raise Exception("No Zoho job ID available")

            # Download the CSV file using v8 API
            csv_data = await self._download_export_file(job.zoho_job_id)
            
            # Process the CSV data and update local database
            record_counts = await self._import_csv_data(csv_data, job, db)
            
            # Update job with final counts
            job.new_records = record_counts.get("new", 0)
            job.updated_records = record_counts.get("updated", 0)
            job.deleted_records = record_counts.get("deleted", 0)
            
            # Update last sync timestamp
            self._update_last_sync_timestamp(db)
            
            db.commit()
            
            logger.info(f"Job {job.id} completed: {job.new_records} new, {job.updated_records} updated, {job.deleted_records} deleted")
            
        except Exception as e:
            job.status = BulkExportJobStatus.FAILED
            job.error_message = f"Failed to process completed job: {str(e)}"
            db.commit()
            logger.error(f"Error processing completed job {job.id}: {str(e)}")

    async def _download_export_file(self, zoho_job_id: str) -> str:
        """Download the CSV file from Zoho using v8 bulk read result endpoint"""
        if not self.zoho_service.access_token:
            await self.zoho_service.get_access_token()

        headers = {
            "Authorization": f"Zoho-oauthtoken {self.zoho_service.access_token}"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.bulk_base_url}/bulk/v8/read/{zoho_job_id}/result",
                headers=headers,
                timeout=300.0  # 5 minute timeout for large files
            )

            if response.status_code == 200:
                return response.text
            else:
                raise Exception(f"Failed to download export file: {response.status_code}")

    async def _import_csv_data(self, csv_data: str, job: BulkExportJob, db: Session) -> Dict[str, int]:
        """Import CSV data into local database and return counts"""
        # This is a placeholder - you'll need to implement the actual CSV parsing
        # and database import logic based on your existing CSV processing code
        
        # For now, return dummy counts
        return {
            "new": 0,
            "updated": 0,
            "deleted": 0
        }

    def _update_last_sync_timestamp(self, db: Session):
        """Update the last successful sync timestamp"""
        setting = db.query(SystemSetting).filter(
            SystemSetting.key == "last_bulk_export_sync"
        ).first()
        
        if setting:
            setting.value = datetime.utcnow().isoformat()
            setting.updated_at = datetime.utcnow()
        else:
            setting = SystemSetting(
                key="last_bulk_export_sync",
                value=datetime.utcnow().isoformat(),
                description="Timestamp of last successful bulk export from Zoho CRM"
            )
            db.add(setting)
        
        db.commit()

    async def get_job_status(self, job_id: str, db: Session) -> Dict[str, Any]:
        """Get the current status of a bulk export job"""
        job = db.query(BulkExportJob).filter(BulkExportJob.id == job_id).first()
        
        if not job:
            raise Exception(f"Job {job_id} not found")
        
        return {
            "job_id": job.id,
            "zoho_job_id": job.zoho_job_id,
            "status": job.status,
            "progress_percentage": job.progress_percentage,
            "estimated_records": job.estimated_records,
            "total_records": job.total_records,
            "new_records": job.new_records,
            "updated_records": job.updated_records,
            "deleted_records": job.deleted_records,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "last_polled_at": job.last_polled_at.isoformat() if job.last_polled_at else None
        }
