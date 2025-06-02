"""
Sync Operation Tracking and Monitoring
Tracks all synchronization operations between local DB and Zoho CRM
"""

import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)


class SyncOperationTracker:
    """
    Tracks and monitors all sync operations between local database and Zoho CRM
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._ensure_sync_tables()
    
    def _ensure_sync_tables(self):
        """Ensure sync tracking tables exist"""
        try:
            # Create sync operations table if it doesn't exist
            self.db.execute(text("""
                CREATE TABLE IF NOT EXISTS zoho_sync_operations (
                    id TEXT PRIMARY KEY,
                    operation_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TIMESTAMP NOT NULL,
                    completed_at TIMESTAMP,
                    total_records INTEGER DEFAULT 0,
                    successful_records INTEGER DEFAULT 0,
                    failed_records INTEGER DEFAULT 0,
                    conflicts_resolved INTEGER DEFAULT 0,
                    error_message TEXT,
                    metadata TEXT,
                    created_by TEXT
                )
            """))
            
            # Create sync conflicts table if it doesn't exist
            self.db.execute(text("""
                CREATE TABLE IF NOT EXISTS zoho_sync_conflicts (
                    id TEXT PRIMARY KEY,
                    sync_operation_id TEXT NOT NULL,
                    record_id TEXT NOT NULL,
                    field_name TEXT NOT NULL,
                    local_value TEXT,
                    zoho_value TEXT,
                    resolution TEXT NOT NULL,
                    resolved_at TIMESTAMP NOT NULL,
                    reason TEXT,
                    FOREIGN KEY (sync_operation_id) REFERENCES zoho_sync_operations (id)
                )
            """))
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error creating sync tracking tables: {str(e)}")
            self.db.rollback()
    
    def start_sync_operation(
        self, 
        operation_type: str, 
        total_records: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
        created_by: str = "system"
    ) -> str:
        """Start tracking a new sync operation"""
        
        operation_id = str(uuid.uuid4())
        
        try:
            self.db.execute(text("""
                INSERT INTO zoho_sync_operations 
                (id, operation_type, status, started_at, total_records, metadata, created_by)
                VALUES (:id, :operation_type, :status, :started_at, :total_records, :metadata, :created_by)
            """), {
                'id': operation_id,
                'operation_type': operation_type,
                'status': 'IN_PROGRESS',
                'started_at': datetime.now(),
                'total_records': total_records,
                'metadata': json.dumps(metadata or {}),
                'created_by': created_by
            })
            
            self.db.commit()
            logger.info(f"Started sync operation {operation_id}: {operation_type}")
            return operation_id
            
        except Exception as e:
            logger.error(f"Error starting sync operation: {str(e)}")
            self.db.rollback()
            raise
    
    def update_sync_progress(
        self, 
        operation_id: str, 
        successful_records: int = 0,
        failed_records: int = 0,
        conflicts_resolved: int = 0
    ):
        """Update progress of a sync operation"""
        
        try:
            self.db.execute(text("""
                UPDATE zoho_sync_operations 
                SET successful_records = :successful_records,
                    failed_records = :failed_records,
                    conflicts_resolved = :conflicts_resolved
                WHERE id = :operation_id
            """), {
                'operation_id': operation_id,
                'successful_records': successful_records,
                'failed_records': failed_records,
                'conflicts_resolved': conflicts_resolved
            })
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error updating sync progress: {str(e)}")
            self.db.rollback()
    
    def complete_sync_operation(
        self, 
        operation_id: str, 
        status: str = "COMPLETED",
        error_message: Optional[str] = None
    ):
        """Mark sync operation as completed"""
        
        try:
            self.db.execute(text("""
                UPDATE zoho_sync_operations 
                SET status = :status,
                    completed_at = :completed_at,
                    error_message = :error_message
                WHERE id = :operation_id
            """), {
                'operation_id': operation_id,
                'status': status,
                'completed_at': datetime.now(),
                'error_message': error_message
            })
            
            self.db.commit()
            logger.info(f"Completed sync operation {operation_id} with status: {status}")
            
        except Exception as e:
            logger.error(f"Error completing sync operation: {str(e)}")
            self.db.rollback()
    
    def log_conflict(
        self, 
        sync_operation_id: str, 
        record_id: str,
        field_name: str,
        local_value: Any,
        zoho_value: Any,
        resolution: str,
        reason: Optional[str] = None
    ):
        """Log a conflict resolution"""
        
        conflict_id = str(uuid.uuid4())
        
        try:
            self.db.execute(text("""
                INSERT INTO zoho_sync_conflicts 
                (id, sync_operation_id, record_id, field_name, local_value, zoho_value, 
                 resolution, resolved_at, reason)
                VALUES (:id, :sync_operation_id, :record_id, :field_name, :local_value, 
                        :zoho_value, :resolution, :resolved_at, :reason)
            """), {
                'id': conflict_id,
                'sync_operation_id': sync_operation_id,
                'record_id': record_id,
                'field_name': field_name,
                'local_value': json.dumps(local_value) if local_value is not None else None,
                'zoho_value': json.dumps(zoho_value) if zoho_value is not None else None,
                'resolution': resolution,
                'resolved_at': datetime.now(),
                'reason': reason
            })
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error logging conflict: {str(e)}")
            self.db.rollback()
    
    def get_sync_operation_status(self, operation_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a sync operation"""
        
        try:
            result = self.db.execute(text("""
                SELECT * FROM zoho_sync_operations WHERE id = :operation_id
            """), {'operation_id': operation_id}).fetchone()
            
            if result:
                return {
                    'id': result.id,
                    'operation_type': result.operation_type,
                    'status': result.status,
                    'started_at': result.started_at,
                    'completed_at': result.completed_at,
                    'total_records': result.total_records,
                    'successful_records': result.successful_records,
                    'failed_records': result.failed_records,
                    'conflicts_resolved': result.conflicts_resolved,
                    'error_message': result.error_message,
                    'metadata': json.loads(result.metadata) if result.metadata else {},
                    'created_by': result.created_by
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting sync operation status: {str(e)}")
            return None
    
    def get_recent_sync_operations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent sync operations"""
        
        try:
            results = self.db.execute(text("""
                SELECT * FROM zoho_sync_operations 
                ORDER BY started_at DESC 
                LIMIT :limit
            """), {'limit': limit}).fetchall()
            
            operations = []
            for result in results:
                operations.append({
                    'id': result.id,
                    'operation_type': result.operation_type,
                    'status': result.status,
                    'started_at': result.started_at,
                    'completed_at': result.completed_at,
                    'total_records': result.total_records,
                    'successful_records': result.successful_records,
                    'failed_records': result.failed_records,
                    'conflicts_resolved': result.conflicts_resolved,
                    'created_by': result.created_by
                })
            
            return operations
            
        except Exception as e:
            logger.error(f"Error getting recent sync operations: {str(e)}")
            return []
    
    def get_conflicts_for_operation(self, operation_id: str) -> List[Dict[str, Any]]:
        """Get all conflicts for a specific sync operation"""
        
        try:
            results = self.db.execute(text("""
                SELECT * FROM zoho_sync_conflicts 
                WHERE sync_operation_id = :operation_id
                ORDER BY resolved_at DESC
            """), {'operation_id': operation_id}).fetchall()
            
            conflicts = []
            for result in results:
                conflicts.append({
                    'id': result.id,
                    'record_id': result.record_id,
                    'field_name': result.field_name,
                    'local_value': json.loads(result.local_value) if result.local_value else None,
                    'zoho_value': json.loads(result.zoho_value) if result.zoho_value else None,
                    'resolution': result.resolution,
                    'resolved_at': result.resolved_at,
                    'reason': result.reason
                })
            
            return conflicts
            
        except Exception as e:
            logger.error(f"Error getting conflicts for operation: {str(e)}")
            return []
