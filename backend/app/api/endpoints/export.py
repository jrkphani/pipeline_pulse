"""
Export endpoints for generating reports
"""

from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from typing import Dict, Any
import json
import pandas as pd
from io import BytesIO

from app.core.database import get_db
from app.models.analysis import Analysis
from app.services.export_service import ExportService

router = APIRouter()


@router.get("/{analysis_id}/csv")
async def export_csv(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Response:
    """
    Export analysis data as CSV
    """
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        # Parse the stored data
        data = json.loads(analysis.data)
        
        # Convert to DataFrame and CSV
        df = pd.DataFrame(data)
        csv_content = df.to_csv(index=False)
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={analysis.filename}_analysis.csv"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")


@router.get("/{analysis_id}/excel")
async def export_excel(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Response:
    """
    Export analysis data as Excel
    """
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        export_service = ExportService()
        excel_content = export_service.create_excel_report(analysis)
        
        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={analysis.filename}_analysis.xlsx"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting Excel: {str(e)}")


@router.get("/{analysis_id}/pdf")
async def export_pdf(
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Response:
    """
    Export analysis data as PDF report
    """
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        export_service = ExportService()
        pdf_content = export_service.create_pdf_report(analysis)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={analysis.filename}_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")
