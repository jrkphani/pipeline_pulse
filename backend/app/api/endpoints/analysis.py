"""
Live pipeline analysis endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json

from app.core.database import get_db
from app.models.crm_record import CrmRecord
from app.services.analysis_service import AnalysisService

router = APIRouter()


@router.get("/")
async def get_live_pipeline_data(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get live pipeline data from CRM records
    """

    crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()

    # Process records for analysis
    deals = []
    total_value = 0
    for record in crm_records:
        if record.processed_data:
            deal_data = record.processed_data
            deals.append(deal_data)
            total_value += deal_data.get("sgd_amount", 0)

    return {
        "pipeline_data": deals,
        "total_deals": len(deals),
        "total_value_sgd": total_value,
        "last_sync": max([r.updated_at for r in crm_records]) if crm_records else None,
        "data_source": "live_crm"
    }


@router.get("/summary")
async def get_pipeline_summary(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get pipeline summary statistics
    """
    
    crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()
    
    if not crm_records:
        return {
            "message": "No CRM data available",
            "total_deals": 0,
            "total_value_sgd": 0
        }
    
    # Extract deal data
    deals = []
    for record in crm_records:
        if record.processed_data:
            deals.append(record.processed_data)
    
    # Generate summary statistics
    analysis_service = AnalysisService()
    summary = analysis_service.generate_summary(deals)
    
    return {
        "summary": summary,
        "data_source": "live_crm",
        "last_sync": max([r.updated_at for r in crm_records]) if crm_records else None
    }


@router.post("/filter")
async def filter_pipeline_data(
    filters: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Apply filters to live pipeline data
    """
    
    crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()
    
    # Extract deal data
    deals = []
    for record in crm_records:
        if record.processed_data:
            deals.append(record.processed_data)

    # Apply filters
    analysis_service = AnalysisService()
    filtered_data = analysis_service.apply_filters(deals, filters)
    
    # Generate summary for filtered data
    summary = analysis_service.generate_summary(filtered_data)
    
    return {
        "filters_applied": filters,
        "summary": summary,
        "data": filtered_data,
        "data_source": "live_crm"
    }


@router.get("/countries")
async def get_country_breakdown(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get country-wise breakdown of deals from live data
    """
    
    crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()
    
    # Extract deal data
    deals = []
    for record in crm_records:
        if record.processed_data:
            deals.append(record.processed_data)

    # Generate country breakdown
    analysis_service = AnalysisService()
    country_breakdown = analysis_service.get_country_breakdown(deals)
    
    return {
        "country_breakdown": country_breakdown,
        "data_source": "live_crm"
    }