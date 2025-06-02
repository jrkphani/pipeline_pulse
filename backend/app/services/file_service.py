"""
File management service for handling CSV uploads and storage
"""

import os
import hashlib
import shutil
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.analysis import Analysis


class FileService:
    """Service for managing file uploads and storage"""
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def calculate_file_hash(self, content: bytes) -> str:
        """Calculate SHA256 hash of file content"""
        return hashlib.sha256(content).hexdigest()
    
    def generate_unique_filename(self, original_filename: str, file_hash: str) -> str:
        """Generate a unique filename for storage"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(original_filename)
        # Use first 8 characters of hash for uniqueness
        return f"{timestamp}_{file_hash[:8]}_{name}{ext}"
    
    async def save_file(self, file: UploadFile, content: bytes) -> Dict[str, Any]:
        """Save uploaded file to disk and return file info"""
        file_hash = self.calculate_file_hash(content)
        unique_filename = self.generate_unique_filename(file.filename, file_hash)
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(content)
        
        return {
            "original_filename": file.filename,
            "filename": unique_filename,
            "file_path": file_path,
            "file_size": len(content),
            "file_hash": file_hash
        }
    
    def check_duplicate_file(self, file_hash: str, db: Session) -> Optional[Analysis]:
        """Check if a file with the same hash already exists"""
        return db.query(Analysis).filter(Analysis.file_hash == file_hash).first()
    
    def get_latest_analysis(self, db: Session) -> Optional[Analysis]:
        """Get the latest analysis marked as current"""
        return db.query(Analysis).filter(Analysis.is_latest == True).order_by(Analysis.created_at.desc()).first()
    
    def mark_as_latest(self, analysis_id: str, db: Session) -> None:
        """Mark an analysis as the latest and unmark others"""
        # Unmark all others
        db.query(Analysis).update({Analysis.is_latest: False})
        # Mark the specified one as latest
        db.query(Analysis).filter(Analysis.id == analysis_id).update({Analysis.is_latest: True})
        db.commit()
    
    def list_files(self, db: Session, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """List all uploaded files with metadata"""
        analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).offset(offset).limit(limit).all()
        
        return [
            {
                "id": analysis.id,
                "original_filename": analysis.original_filename,
                "filename": analysis.filename,
                "file_size": analysis.file_size,
                "total_deals": analysis.total_deals,
                "processed_deals": analysis.processed_deals,
                "total_value": analysis.total_value,
                "is_latest": analysis.is_latest,
                "created_at": analysis.created_at,
                "updated_at": analysis.updated_at
            }
            for analysis in analyses
        ]
    
    def delete_file(self, analysis_id: str, db: Session) -> bool:
        """Delete a file and its analysis record"""
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return False
        
        # Delete physical file
        try:
            if os.path.exists(analysis.file_path):
                os.remove(analysis.file_path)
        except Exception:
            pass  # Continue even if file deletion fails
        
        # Delete database record
        db.delete(analysis)
        db.commit()
        
        return True
    
    def get_file_path(self, analysis_id: str, db: Session) -> Optional[str]:
        """Get the file path for an analysis"""
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis and os.path.exists(analysis.file_path):
            return analysis.file_path
        return None
    
    def get_file_stats(self, db: Session) -> Dict[str, Any]:
        """Get statistics about uploaded files"""
        from sqlalchemy import func

        total_files = db.query(Analysis).count()
        total_size = db.query(func.sum(Analysis.file_size)).scalar() or 0
        latest_analysis = self.get_latest_analysis(db)
        
        return {
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "latest_analysis_id": latest_analysis.id if latest_analysis else None,
            "latest_filename": latest_analysis.original_filename if latest_analysis else None
        }
