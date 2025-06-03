"""
File upload endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd
import uuid
import os
from typing import Dict, Any, List

from app.core.database import get_db
from app.services.analysis_service import AnalysisService
from app.services.file_service import FileService
from app.models.analysis import Analysis
from app.core.config import settings

router = APIRouter()


@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Upload and process CSV file for analysis
    """

    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    # Check file size
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        # Read CSV content
        content = await file.read()

        # Initialize services
        file_service = FileService()
        analysis_service = AnalysisService()

        # Check for duplicate file
        file_hash = file_service.calculate_file_hash(content)
        existing_analysis = file_service.check_duplicate_file(file_hash, db)

        if existing_analysis:
            # File already exists, mark it as latest and return
            file_service.mark_as_latest(existing_analysis.id, db)
            return {
                "analysis_id": existing_analysis.id,
                "filename": existing_analysis.original_filename,
                "total_deals": existing_analysis.total_deals,
                "processed_deals": existing_analysis.processed_deals,
                "is_duplicate": True,
                "message": "File already exists. Using existing analysis as the latest."
            }

        # Save file to disk
        file_info = await file_service.save_file(file, content)

        # Parse CSV with pandas
        df = pd.read_csv(pd.io.common.StringIO(content.decode('utf-8')))

        # Generate analysis ID
        analysis_id = str(uuid.uuid4())

        # Process the data with dynamic currency conversion
        processed_data = analysis_service.process_csv_data(df, db)

        # Mark all existing analyses as not latest
        db.query(Analysis).update({Analysis.is_latest: False})

        # Save analysis to database
        analysis = Analysis(
            id=analysis_id,
            filename=file_info["filename"],
            original_filename=file_info["original_filename"],
            file_path=file_info["file_path"],
            s3_key=file_info.get("s3_key"),
            s3_bucket=file_info.get("s3_bucket"),
            file_size=file_info["file_size"],
            file_hash=file_info["file_hash"],
            total_deals=len(df),
            processed_deals=len(processed_data),
            total_value=processed_data['Amount'].sum() if 'Amount' in processed_data.columns else 0,
            data=processed_data.to_json(orient='records'),
            is_latest=True
        )

        db.add(analysis)
        db.commit()

        return {
            "analysis_id": analysis_id,
            "filename": file_info["original_filename"],
            "total_deals": len(df),
            "processed_deals": len(processed_data),
            "is_duplicate": False,
            "message": "File uploaded and processed successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/status/{analysis_id}")
async def get_upload_status(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get upload and processing status
    """

    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "analysis_id": analysis_id,
        "status": "completed",
        "filename": analysis.original_filename,
        "total_deals": analysis.total_deals,
        "processed_deals": analysis.processed_deals,
        "total_value": analysis.total_value,
        "is_latest": analysis.is_latest,
        "created_at": analysis.created_at
    }


@router.get("/files")
async def list_files(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    List all uploaded files with metadata
    """

    file_service = FileService()
    files = file_service.list_files(db, limit, offset)
    stats = file_service.get_file_stats(db)

    return {
        "files": files,
        "stats": stats,
        "limit": limit,
        "offset": offset
    }


@router.get("/latest")
async def get_latest_analysis(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get the latest analysis
    """

    file_service = FileService()
    latest = file_service.get_latest_analysis(db)

    if not latest:
        raise HTTPException(status_code=404, detail="No analysis found")

    return {
        "analysis_id": latest.id,
        "filename": latest.original_filename,
        "total_deals": latest.total_deals,
        "processed_deals": latest.processed_deals,
        "total_value": latest.total_value,
        "created_at": latest.created_at
    }


@router.get("/download/{analysis_id}")
async def download_file(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get presigned download URL for the original uploaded CSV file
    """

    file_service = FileService()
    download_url = await file_service.get_download_url(analysis_id, db)

    if not download_url:
        raise HTTPException(status_code=404, detail="File not found")

    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "download_url": download_url,
        "filename": getattr(analysis, 'original_filename', 'unknown.csv'),
        "expires_in": 3600  # 1 hour
    }


@router.delete("/files/{analysis_id}")
async def delete_file(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete an uploaded file and its analysis
    """

    file_service = FileService()
    success = await file_service.delete_file(analysis_id, db)

    if not success:
        raise HTTPException(status_code=404, detail="File not found")

    return {
        "analysis_id": analysis_id,
        "message": "File deleted successfully"
    }


@router.post("/set-latest/{analysis_id}")
async def set_latest_analysis(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Set a specific analysis as the latest
    """

    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    file_service = FileService()
    file_service.mark_as_latest(analysis_id, db)

    return {
        "analysis_id": analysis_id,
        "filename": analysis.original_filename,
        "message": "Analysis set as latest successfully"
    }


@router.get("/analysis/{analysis_id}")
async def get_analysis_data(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed analysis data including processed CSV data
    """

    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Parse the JSON data
    import json
    try:
        processed_data = json.loads(analysis.data) if analysis.data else []
    except json.JSONDecodeError:
        processed_data = []

    return {
        "analysis_id": analysis.id,
        "filename": analysis.original_filename,
        "total_deals": analysis.total_deals,
        "processed_deals": analysis.processed_deals,
        "total_value": analysis.total_value,
        "is_latest": analysis.is_latest,
        "created_at": analysis.created_at,
        "data": processed_data
    }
