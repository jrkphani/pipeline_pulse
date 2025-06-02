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
    data = json.loads(analysis.data)
    
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
    data = json.loads(analysis.data)
    
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
    data = json.loads(analysis.data)
    
    # Generate country breakdown
    analysis_service = AnalysisService()
    country_breakdown = analysis_service.get_country_breakdown(data)
    
    return {
        "analysis_id": analysis_id,
        "country_breakdown": country_breakdown
    }
