"""
Unified Sync Operation Tracking and Monitoring
Replaces raw SQL implementation with proper SQLAlchemy models

REFACTORING CHANGES:
- Replaces: sync_tracker.py (with raw SQL)
- Uses: SQLAlchemy models from app.models.sync_operations
- Eliminates: All raw SQL CREATE TABLE statements
- Provides: Same interface with better database integration
"""

import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.sync_operations import ZohoSyncOperation, ZohoSyncConflict
import logging

logger = logging.getLogger(__name__)


class UnifiedSyncTracker:
    """
    Unified sync operation tracker using proper SQLAlchemy models
    Replaces the raw SQL implementation with database-integrated tracking
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def start_operation(self, operation_type: str, created_by: str = None, metadata: Dict[str, Any] = None) -> str:
        """
        Start tracking a new sync operation
        Returns the operation ID for subsequent tracking
        """
        try:
            operation_id = str(uuid.uuid4())
            
            operation = ZohoSyncOperation(
                id=operation_id,
                operation_type=operation_type,
                status='started',
                started_at=datetime.utcnow(),
                created_by=created_by,
                metadata=metadata
            )
            
            self.db.add(operation)
            self.db.commit()
            
            logger.info(f"Started sync operation {operation_id}: {operation_type}")
            return operation_id
            
        except Exception as e:
            logger.error(f"Error starting sync operation: {e}")
            self.db.rollback()
            raise
    
    def update_operation_progress(self, operation_id: str, 
                                total_records: int = None,
                                successful_records: int = None,
                                failed_records: int = None,
                                conflicts_resolved: int = None) -> None:
        """Update operation progress counters"""
        try:
            operation = self.db.query(ZohoSyncOperation).filter(
                ZohoSyncOperation.id == operation_id
            ).first()
            
            if not operation:
                logger.warning(f"Operation {operation_id} not found for progress update")
                return
            
            if total_records is not None:
                operation.total_records = total_records
            if successful_records is not None:
                operation.successful_records = successful_records
            if failed_records is not None:
                operation.failed_records = failed_records
            if conflicts_resolved is not None:
                operation.conflicts_resolved = conflicts_resolved
                
            operation.updated_at = datetime.utcnow()
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error updating operation progress: {e}")
            self.db.rollback()
            raise
    
    def complete_operation(self, operation_id: str, status: str = 'completed', 
                         error_message: str = None) -> None:
        """Mark operation as completed with final status"""
        try:
            operation = self.db.query(ZohoSyncOperation).filter(
                ZohoSyncOperation.id == operation_id
            ).first()
            
            if not operation:
                logger.warning(f"Operation {operation_id} not found for completion")
                return
            
            operation.status = status
            operation.completed_at = datetime.utcnow()
            operation.updated_at = datetime.utcnow()
            
            if error_message:
                operation.error_message = error_message
            
            self.db.commit()
            
            logger.info(f"Completed sync operation {operation_id} with status: {status}")
            
        except Exception as e:
            logger.error(f"Error completing operation: {e}")
            self.db.rollback()
            raise
    
    def record_conflict(self, operation_id: str, record_id: str, record_type: str,
                       conflict_type: str, local_data: Dict[str, Any] = None,
                       remote_data: Dict[str, Any] = None) -> str:
        """Record a sync conflict for resolution"""
        try:
            conflict_id = str(uuid.uuid4())
            
            conflict = ZohoSyncConflict(
                id=conflict_id,
                operation_id=operation_id,
                record_id=record_id,
                record_type=record_type,
                conflict_type=conflict_type,
                local_data=local_data,
                remote_data=remote_data,
                status='pending'
            )
            
            self.db.add(conflict)
            self.db.commit()
            
            logger.info(f"Recorded conflict {conflict_id} for operation {operation_id}")
            return conflict_id
            
        except Exception as e:
            logger.error(f"Error recording conflict: {e}")
            self.db.rollback()
            raise
    
    def resolve_conflict(self, conflict_id: str, resolution_strategy: str,
                        resolved_data: Dict[str, Any] = None,
                        resolved_by: str = None, notes: str = None) -> None:
        """Mark conflict as resolved with resolution details"""
        try:
            conflict = self.db.query(ZohoSyncConflict).filter(
                ZohoSyncConflict.id == conflict_id
            ).first()
            
            if not conflict:
                logger.warning(f"Conflict {conflict_id} not found for resolution")
                return
            
            conflict.resolution_strategy = resolution_strategy
            conflict.resolved_data = resolved_data
            conflict.status = 'resolved'
            conflict.resolved_at = datetime.utcnow()
            conflict.resolved_by = resolved_by
            conflict.resolution_notes = notes
            
            self.db.commit()
            
            logger.info(f"Resolved conflict {conflict_id} with strategy: {resolution_strategy}")
            
        except Exception as e:
            logger.error(f"Error resolving conflict: {e}")
            self.db.rollback()
            raise
    
    def get_operation_status(self, operation_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a sync operation"""
        try:
            operation = self.db.query(ZohoSyncOperation).filter(
                ZohoSyncOperation.id == operation_id
            ).first()
            
            if not operation:
                return None
            
            return {
                "id": operation.id,
                "operation_type": operation.operation_type,
                "status": operation.status,
                "started_at": operation.started_at.isoformat() if operation.started_at else None,
                "completed_at": operation.completed_at.isoformat() if operation.completed_at else None,
                "total_records": operation.total_records,
                "successful_records": operation.successful_records,
                "failed_records": operation.failed_records,
                "conflicts_resolved": operation.conflicts_resolved,
                "error_message": operation.error_message,
                "metadata": operation.metadata,
                "created_by": operation.created_by
            }
            
        except Exception as e:
            logger.error(f"Error getting operation status: {e}")
            return None
    
    def get_recent_operations(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent sync operations"""
        try:
            operations = self.db.query(ZohoSyncOperation).order_by(
                desc(ZohoSyncOperation.started_at)
            ).limit(limit).all()
            
            return [
                {
                    "id": op.id,
                    "operation_type": op.operation_type,
                    "status": op.status,
                    "started_at": op.started_at.isoformat() if op.started_at else None,
                    "completed_at": op.completed_at.isoformat() if op.completed_at else None,
                    "total_records": op.total_records,
                    "successful_records": op.successful_records,
                    "failed_records": op.failed_records,
                    "conflicts_resolved": op.conflicts_resolved,
                    "created_by": op.created_by
                }
                for op in operations
            ]
            
        except Exception as e:
            logger.error(f"Error getting recent operations: {e}")
            return []
    
    def get_pending_conflicts(self, operation_id: str = None) -> List[Dict[str, Any]]:
        """Get pending conflicts, optionally filtered by operation"""
        try:
            query = self.db.query(ZohoSyncConflict).filter(
                ZohoSyncConflict.status == 'pending'
            )
            
            if operation_id:
                query = query.filter(ZohoSyncConflict.operation_id == operation_id)
            
            conflicts = query.order_by(desc(ZohoSyncConflict.created_at)).all()
            
            return [
                {
                    "id": conflict.id,
                    "operation_id": conflict.operation_id,
                    "record_id": conflict.record_id,
                    "record_type": conflict.record_type,
                    "conflict_type": conflict.conflict_type,
                    "local_data": conflict.local_data,
                    "remote_data": conflict.remote_data,
                    "created_at": conflict.created_at.isoformat() if conflict.created_at else None
                }
                for conflict in conflicts
            ]
            
        except Exception as e:
            logger.error(f"Error getting pending conflicts: {e}")
            return []
    
    def get_operation_summary(self, days: int = 7) -> Dict[str, Any]:
        """Get summary statistics for recent operations"""
        try:
            from datetime import timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            operations = self.db.query(ZohoSyncOperation).filter(
                ZohoSyncOperation.started_at >= cutoff_date
            ).all()
            
            total_operations = len(operations)
            completed_operations = len([op for op in operations if op.status == 'completed'])
            failed_operations = len([op for op in operations if op.status == 'failed'])
            
            total_records = sum(op.total_records or 0 for op in operations)
            successful_records = sum(op.successful_records or 0 for op in operations)
            failed_records = sum(op.failed_records or 0 for op in operations)
            
            return {
                "period_days": days,
                "total_operations": total_operations,
                "completed_operations": completed_operations,
                "failed_operations": failed_operations,
                "success_rate": (completed_operations / total_operations * 100) if total_operations > 0 else 0,
                "total_records_processed": total_records,
                "successful_records": successful_records,
                "failed_records": failed_records,
                "record_success_rate": (successful_records / total_records * 100) if total_records > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting operation summary: {e}")
            return {
                "period_days": days,
                "total_operations": 0,
                "completed_operations": 0,
                "failed_operations": 0,
                "success_rate": 0,
                "total_records_processed": 0,
                "successful_records": 0,
                "failed_records": 0,
                "record_success_rate": 0
            }