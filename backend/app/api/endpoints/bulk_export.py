"""
Bulk Export API endpoints for Zoho CRM bulk data fetching
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from app.core.database import get_db
from app.services.bulk_export_service import BulkExportService
from app.models.bulk_export import BulkExportJob

router = APIRouter(prefix="/bulk-export", tags=["Bulk Export"])
logger = logging.getLogger(__name__)

# Initialize service
bulk_export_service = BulkExportService()


@router.post("/start")
async def start_bulk_export(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Start a bulk export job to fetch deals from Zoho CRM
    """
    try:
        result = await bulk_export_service.start_bulk_export(db)
        return result
        
    except Exception as e:
        logger.error(f"Failed to start bulk export: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/job/{job_id}/status")
async def get_job_status(
    job_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get the status of a bulk export job
    """
    try:
        status = await bulk_export_service.get_job_status(job_id, db)
        return status
        
    except Exception as e:
        logger.error(f"Failed to get job status for {job_id}: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/callback")
async def bulk_export_callback(
    callback_data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Webhook callback endpoint for Zoho bulk export job completion
    """
    try:
        logger.info(f"Received bulk export callback: {callback_data}")
        
        # Extract job information from callback
        data = callback_data.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Invalid callback data")
        
        job_data = data[0]
        zoho_job_id = job_data.get("id")
        
        if not zoho_job_id:
            raise HTTPException(status_code=400, detail="Missing job ID in callback")
        
        # Find the job in our database
        job = db.query(BulkExportJob).filter(
            BulkExportJob.zoho_job_id == zoho_job_id
        ).first()
        
        if not job:
            logger.warning(f"Received callback for unknown job: {zoho_job_id}")
            return {"status": "ignored", "message": "Job not found"}
        
        # Update job status based on callback
        await bulk_export_service._update_job_status(job, callback_data, db)
        
        return {
            "status": "success",
            "message": "Callback processed successfully",
            "job_id": job.id
        }
        
    except Exception as e:
        logger.error(f"Error processing bulk export callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs")
async def list_export_jobs(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    List recent bulk export jobs
    """
    try:
        jobs = db.query(BulkExportJob).order_by(
            BulkExportJob.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        job_list = []
        for job in jobs:
            job_list.append({
                "job_id": job.id,
                "zoho_job_id": job.zoho_job_id,
                "status": job.status,
                "estimated_records": job.estimated_records,
                "total_records": job.total_records,
                "new_records": job.new_records,
                "updated_records": job.updated_records,
                "deleted_records": job.deleted_records,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "error_message": job.error_message
            })
        
        total_count = db.query(BulkExportJob).count()
        
        return {
            "jobs": job_list,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to list export jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
