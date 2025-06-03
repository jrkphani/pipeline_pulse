"""
File management service for handling CSV uploads and storage
"""

import hashlib
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.services.s3_service import S3Service


class FileService:
    """Service for managing file uploads and storage"""

    def __init__(self):
        self.s3_service = S3Service()
        # S3 bucket is created and configured externally

    def _extract_s3_key(self, analysis: Analysis) -> Optional[str]:
        """Extract S3 key from analysis record"""
        # Check if analysis has s3_key attribute
        if hasattr(analysis, 's3_key') and getattr(analysis, 's3_key'):
            return getattr(analysis, 's3_key')

        # Extract from file_path if it's an S3 URL
        file_path = getattr(analysis, 'file_path', '')
        if file_path and file_path.startswith('s3://'):
            # Extract key from s3://bucket/key format
            parts = file_path.split('/')
            if len(parts) > 3:
                return '/'.join(parts[3:])

        return None
    
    def calculate_file_hash(self, content: bytes) -> str:
        """Calculate SHA256 hash of file content"""
        return hashlib.sha256(content).hexdigest()
    
    def generate_s3_key(self, original_filename: str, file_hash: str) -> str:
        """Generate a unique S3 key for storage"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(original_filename or "unknown")
        # Use first 8 characters of hash for uniqueness
        return f"uploads/{timestamp}_{file_hash[:8]}_{name}{ext}"
    
    async def save_file(self, file: UploadFile, content: bytes) -> Dict[str, Any]:
        """Save uploaded file to S3 and return file info"""
        file_hash = self.calculate_file_hash(content)
        s3_key = self.generate_s3_key(file.filename or "unknown", file_hash)

        # Prepare metadata
        metadata = {
            'original_filename': file.filename or 'unknown',
            'file_hash': file_hash,
            'upload_timestamp': datetime.now().isoformat()
        }

        # Upload to S3
        upload_result = await self.s3_service.upload_file(
            file_content=content,
            s3_key=s3_key,
            content_type=file.content_type or 'text/csv',
            metadata=metadata
        )

        return {
            "original_filename": file.filename,
            "filename": s3_key.split('/')[-1],  # Extract filename from S3 key
            "file_path": upload_result['s3_url'],  # S3 URL instead of local path
            "s3_key": s3_key,
            "s3_bucket": upload_result['bucket'],
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
    
    async def delete_file(self, analysis_id: str, db: Session) -> bool:
        """Delete a file from S3 and its analysis record"""
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return False

        # Delete file from S3
        try:
            s3_key = self._extract_s3_key(analysis)
            if s3_key:
                await self.s3_service.delete_file(s3_key)
        except Exception:
            pass  # Continue even if file deletion fails

        # Delete database record
        db.delete(analysis)
        db.commit()

        return True
    
    async def get_file_content(self, analysis_id: str, db: Session) -> Optional[bytes]:
        """Get file content from S3 for an analysis"""
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return None

        try:
            s3_key = self._extract_s3_key(analysis)
            if not s3_key:
                return None

            return await self.s3_service.download_file(s3_key)
        except Exception:
            return None

    async def get_download_url(self, analysis_id: str, db: Session) -> Optional[str]:
        """Get presigned download URL for an analysis file"""
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return None

        try:
            s3_key = self._extract_s3_key(analysis)
            if not s3_key:
                return None

            return await self.s3_service.generate_presigned_url(s3_key, expiration=3600)
        except Exception:
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
