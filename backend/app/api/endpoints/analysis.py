"""
Analysis endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json

from app.core.database import get_db
from app.models.analysis import Analysis
from app.services.analysis_service import AnalysisService

router = APIRouter()


@router.get("/")
async def list_analyses(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    List all analyses with summary information
    """

    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).all()

    analysis_list = []
    for analysis in analyses:
        analysis_list.append({
            "id": analysis.id,
            "filename": analysis.filename,
            "original_filename": analysis.original_filename,
            "total_deals": analysis.total_deals,
            "processed_deals": analysis.processed_deals,
            "total_value": analysis.total_value,
            "is_latest": analysis.is_latest,
            "created_at": analysis.created_at,
            "updated_at": analysis.updated_at
        })

    return {
        "analyses": analysis_list,
        "total": len(analysis_list)
    }


@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get analysis results by ID
    """
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Parse the stored data
    try:
        data_str = getattr(analysis, 'data', None)
        data = json.loads(data_str) if data_str else []
    except (json.JSONDecodeError, TypeError):
        data = []
    
    # Generate summary statistics
    analysis_service = AnalysisService()
    summary = analysis_service.generate_summary(data)
    
    return {
        "analysis_id": analysis_id,
        "filename": analysis.filename,
        "summary": summary,
        "data": data,
        "created_at": analysis.created_at
    }


@router.post("/{analysis_id}/filter")
async def filter_analysis(
    analysis_id: str,
    filters: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Apply filters to analysis data
    """
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Parse the stored data
    try:
        data_str = getattr(analysis, 'data', None)
        data = json.loads(data_str) if data_str else []
    except (json.JSONDecodeError, TypeError):
        data = []

    # Apply filters
    analysis_service = AnalysisService()
    filtered_data = analysis_service.apply_filters(data, filters)
    
    # Generate summary for filtered data
    summary = analysis_service.generate_summary(filtered_data)
    
    return {
        "analysis_id": analysis_id,
        "filters_applied": filters,
        "summary": summary,
        "data": filtered_data
    }


@router.get("/{analysis_id}/countries")
async def get_country_breakdown(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get country-wise breakdown of deals
    """
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Parse the stored data
    try:
        data_str = getattr(analysis, 'data', None)
        data = json.loads(data_str) if data_str else []
    except (json.JSONDecodeError, TypeError):
        data = []

    # Generate country breakdown
    analysis_service = AnalysisService()
    country_breakdown = analysis_service.get_country_breakdown(data)
    
    return {
        "analysis_id": analysis_id,
        "country_breakdown": country_breakdown
    }
