"""
Export endpoints for generating reports from live CRM data
"""

from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
import pandas as pd
from io import BytesIO
from datetime import datetime

from app.core.database import get_db
from app.models.crm_record import CrmRecord
from app.services.export_service import ExportService

router = APIRouter()


@router.get("/pipeline/csv")
async def export_pipeline_csv(
    db: Session = Depends(get_db),
    filters: Optional[str] = None
) -> Response:
    """
    Export live pipeline data as CSV
    """
    
    # Get CRM records
    crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()
    
    if not crm_records:
        raise HTTPException(status_code=404, detail="No pipeline data available")
    
    try:
        # Extract deal data
        deals = []
        for record in crm_records:
            if record.processed_data:
                deals.append(record.processed_data)
        
        # Apply filters if provided
        if filters:
            filter_dict = json.loads(filters)
            # TODO: Apply filters to deals data
        
        # Convert to DataFrame and CSV
        df = pd.DataFrame(deals)
        csv_content = df.to_csv(index=False)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"pipeline_data_{timestamp}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")


@router.get("/pipeline/excel")
async def export_pipeline_excel(
    db: Session = Depends(get_db),
    filters: Optional[str] = None
) -> Response:
    """
    Export live pipeline data as Excel
    """
    
    # Get CRM records
    crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()
    
    if not crm_records:
        raise HTTPException(status_code=404, detail="No pipeline data available")
    
    try:
        # Extract deal data
        deals = []
        for record in crm_records:
            if record.processed_data:
                deals.append(record.processed_data)
        
        # Apply filters if provided
        if filters:
            filter_dict = json.loads(filters)
            # TODO: Apply filters to deals data
        
        export_service = ExportService()
        excel_content = export_service.create_excel_report_from_data(deals)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"pipeline_data_{timestamp}.xlsx"
        
        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting Excel: {str(e)}")


@router.get("/pipeline/pdf")
async def export_pipeline_pdf(
    db: Session = Depends(get_db),
    filters: Optional[str] = None
) -> Response:
    """
    Export live pipeline data as PDF report
    """
    
    # Get CRM records
    crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()
    
    if not crm_records:
        raise HTTPException(status_code=404, detail="No pipeline data available")
    
    try:
        # Extract deal data
        deals = []
        for record in crm_records:
            if record.processed_data:
                deals.append(record.processed_data)
        
        # Apply filters if provided
        if filters:
            filter_dict = json.loads(filters)
            # TODO: Apply filters to deals data
        
        export_service = ExportService()
        pdf_content = export_service.create_pdf_report_from_data(deals)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"pipeline_report_{timestamp}.pdf"
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")


@router.get("/summary/csv")
async def export_summary_csv(
    db: Session = Depends(get_db)
) -> Response:
    """
    Export pipeline summary statistics as CSV
    """
    
    try:
        from app.services.analysis_service import AnalysisService
        
        # Get CRM records
        crm_records = db.query(CrmRecord).filter(CrmRecord.record_type == "Deal").all()
        
        # Extract deal data
        deals = []
        for record in crm_records:
            if record.processed_data:
                deals.append(record.processed_data)
        
        if not deals:
            raise HTTPException(status_code=404, detail="No data available for summary")
        
        # Generate summary statistics
        analysis_service = AnalysisService()
        summary = analysis_service.generate_summary(deals)
        
        # Convert summary to DataFrame
        summary_data = []
        for key, value in summary.items():
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    summary_data.append({
                        "category": key,
                        "metric": sub_key,
                        "value": sub_value
                    })
            else:
                summary_data.append({
                    "category": "general",
                    "metric": key,
                    "value": value
                })
        
        df = pd.DataFrame(summary_data)
        csv_content = df.to_csv(index=False)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"pipeline_summary_{timestamp}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting summary: {str(e)}")