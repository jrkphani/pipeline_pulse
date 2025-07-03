"""
Sync Status Service for monitoring and managing CRM synchronization operations
Handles sync session tracking, progress monitoring, conflict detection, and health analytics
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
import json
import statistics

from app.core.database import get_db
from app.models.crm_sync_sessions import (
    CRMSyncSession, SyncStatusLog, RecordSyncStatus, SyncConfiguration,
    SyncHealthMetrics, SyncSessionStatus, SyncOperationType, RecordSyncAction,
    ConflictResolutionStrategy
)

logger = logging.getLogger(__name__)


class SyncStatusService:
    """Service for managing sync session status and health monitoring"""
    
    def __init__(self, db: Session = None):
        """Initialize the sync status service"""
        self.db = db or next(get_db())
        # Initialize SDK manager with proper error handling
        try:
            from app.services.zoho_sdk_manager import get_sdk_manager
            self.sdk_manager = get_sdk_manager()
        except Exception as e:
            logger.warning(f"SDK manager initialization failed: {e}")
            self.sdk_manager = None
        logger.info("Sync Status Service initialized")
    
    # ==================== Session Management ====================
    
    async def create_sync_session(self, 
                                session_type: SyncOperationType,
                                module_name: str = "Deals",
                                initiated_by: str = "system",
                                sync_config: Dict[str, Any] = None) -> CRMSyncSession:
        """
        Create a new sync session
        
        Args:
            session_type: Type of sync operation
            module_name: Target CRM module
            initiated_by: User or system that initiated the sync
            sync_config: Additional configuration for the sync
            
        Returns:
            Created CRMSyncSession instance
        """
        try:
            # Create the sync session with SDK metadata
            sdk_config = {}
            if self.sdk_manager:
                try:
                    sdk_config = self.sdk_manager.get_config() or {}
                except Exception as e:
                    logger.warning(f"Failed to get SDK config: {e}")
            
            enhanced_sync_config = {
                **(sync_config or {}),
                "sdk_enabled": self.sdk_manager is not None,
                "sdk_version": "8.0",
                "sdk_data_center": sdk_config.get("data_center", "unknown"),
                "sdk_environment": sdk_config.get("environment", "unknown")
            }
            
            session = CRMSyncSession(
                session_type=session_type,
                module_name=module_name,
                initiated_by=initiated_by,
                sync_config=enhanced_sync_config
            )
            
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
            
            logger.info(f"🆔 Created SDK sync session {session.id} for {module_name}")
            
            return session
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create sync session: {str(e)}")
            raise
    
    async def update_session_progress(self, 
                                    session_id: str,
                                    processed_records: int = None,
                                    successful_records: int = None,
                                    failed_records: int = None,
                                    skipped_records: int = None,
                                    total_records: int = None) -> bool:
        """
        Update sync session progress
        
        Args:
            session_id: Session ID to update
            processed_records: Number of processed records
            successful_records: Number of successful records
            failed_records: Number of failed records
            skipped_records: Number of skipped records
            total_records: Total number of records to process
            
        Returns:
            Boolean indicating success
        """
        try:
            session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.id == session_id
            ).first()
            
            if not session:
                logger.error(f"Sync session {session_id} not found")
                return False
            
            # Update provided fields
            if processed_records is not None:
                session.processed_records = processed_records
            if successful_records is not None:
                session.successful_records = successful_records
            if failed_records is not None:
                session.failed_records = failed_records
            if skipped_records is not None:
                session.skipped_records = skipped_records
            if total_records is not None:
                session.total_records = total_records
            
            # Update last activity timestamp
            session.last_activity_at = datetime.utcnow()
            
            self.db.commit()
            
            logger.debug(f"Updated progress for session {session_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update session progress: {str(e)}")
            return False
    
    async def complete_sync_session(self, 
                                  session_id: str,
                                  status: SyncSessionStatus,
                                  error_message: str = None) -> bool:
        """
        Mark a sync session as completed
        
        Args:
            session_id: Session ID to complete
            status: Final status of the session
            error_message: Optional error message if failed
            
        Returns:
            Boolean indicating success
        """
        try:
            session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.id == session_id
            ).first()
            
            if not session:
                logger.error(f"Sync session {session_id} not found")
                return False
            
            session.status = status
            session.completed_at = datetime.utcnow()
            
            if error_message:
                session.error_message = error_message
            
            self.db.commit()
            
            logger.info(f"Completed sync session {session_id} with status {status.value}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to complete sync session: {str(e)}")
            return False
    
    # ==================== Status Logging ====================
    
    async def log_sync_event(self,
                           session_id: str,
                           level: str,
                           component: str,
                           message: str,
                           record_id: str = None,
                           api_endpoint: str = None,
                           execution_time_ms: int = None,
                           data_payload: Dict[str, Any] = None,
                           error_code: str = None,
                           error_details: Dict[str, Any] = None) -> bool:
        """
        Log a sync event to the status log
        
        Args:
            session_id: Associated sync session ID
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            component: Component that generated the log
            message: Log message
            record_id: Optional record ID if applicable
            api_endpoint: API endpoint used
            execution_time_ms: Execution time in milliseconds
            data_payload: Request/response data for debugging
            error_code: Error code if applicable
            error_details: Detailed error information
            
        Returns:
            Boolean indicating success
        """
        try:
            log_entry = SyncStatusLog(
                session_id=session_id,
                log_level=level,
                component=component,
                message=message,
                record_id=record_id,
                api_endpoint=api_endpoint,
                execution_time_ms=execution_time_ms,
                data_payload=data_payload,
                error_code=error_code,
                error_details=error_details
            )
            
            self.db.add(log_entry)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to log sync event: {str(e)}")
            return False
    
    async def get_session_logs(self, 
                             session_id: str,
                             level_filter: str = None,
                             component_filter: str = None,
                             limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get logs for a specific sync session
        
        Args:
            session_id: Session ID to get logs for
            level_filter: Optional log level filter
            component_filter: Optional component filter
            limit: Maximum number of logs to return
            
        Returns:
            List of log entries
        """
        try:
            query = self.db.query(SyncStatusLog).filter(
                SyncStatusLog.session_id == session_id
            )
            
            if level_filter:
                query = query.filter(SyncStatusLog.log_level == level_filter)
            
            if component_filter:
                query = query.filter(SyncStatusLog.component == component_filter)
            
            logs = query.order_by(desc(SyncStatusLog.timestamp)).limit(limit).all()
            
            return [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat(),
                    "level": log.log_level,
                    "component": log.component,
                    "message": log.message,
                    "record_id": log.record_id,
                    "api_endpoint": log.api_endpoint,
                    "execution_time_ms": log.execution_time_ms,
                    "error_code": log.error_code
                }
                for log in logs
            ]
            
        except Exception as e:
            logger.error(f"Failed to get session logs: {str(e)}")
            return []
    
    # ==================== Record Status Tracking ====================
    
    async def track_record_sync(self,
                              session_id: str,
                              crm_record_id: str,
                              action_taken: RecordSyncAction,
                              sync_direction: str = "from_crm",
                              fields_updated: List[str] = None,
                              before_data: Dict[str, Any] = None,
                              after_data: Dict[str, Any] = None,
                              conflicts: Dict[str, Any] = None,
                              error_message: str = None,
                              processing_time_ms: int = None) -> bool:
        """
        Track the sync status of an individual record
        
        Args:
            session_id: Associated sync session ID
            crm_record_id: CRM record ID
            action_taken: Action performed on the record
            sync_direction: Direction of sync (from_crm, to_crm)
            fields_updated: List of fields that were updated
            before_data: Data before sync
            after_data: Data after sync
            conflicts: Conflict details if any
            error_message: Error message if failed
            processing_time_ms: Processing time in milliseconds
            
        Returns:
            Boolean indicating success
        """
        try:
            record_status = RecordSyncStatus(
                session_id=session_id,
                crm_record_id=crm_record_id,
                action_taken=action_taken,
                sync_direction=sync_direction,
                fields_updated=fields_updated,
                before_data=before_data,
                after_data=after_data,
                has_conflicts=bool(conflicts),
                conflict_details=conflicts,
                error_message=error_message,
                processing_time_ms=processing_time_ms
            )
            
            self.db.add(record_status)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to track record sync: {str(e)}")
            return False
    
    # ==================== Conflict Detection and Resolution ====================
    
    async def detect_conflicts(self, 
                             crm_record_id: str,
                             crm_data: Dict[str, Any],
                             local_data: Dict[str, Any],
                             field_mappings: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Detect conflicts between CRM and local data
        
        Args:
            crm_record_id: CRM record ID
            crm_data: Data from CRM
            local_data: Local data
            field_mappings: Optional field mapping configuration
            
        Returns:
            Dictionary containing conflict details
        """
        conflicts = {}
        
        try:
            # Get the last known state of this record
            last_sync = self.db.query(RecordSyncStatus).filter(
                RecordSyncStatus.crm_record_id == crm_record_id
            ).order_by(desc(RecordSyncStatus.processed_at)).first()
            
            if not last_sync or not last_sync.after_data:
                # No previous sync data, no conflicts
                return {"has_conflicts": False, "conflicts": {}}
            
            last_known_data = last_sync.after_data
            
            # Compare important fields for conflicts
            important_fields = [
                "Amount", "Stage", "Closing_Date", "Deal_Name",
                "Proposal_Date", "PO_Date", "Kickoff_Date", "Invoice_Date"
            ]
            
            for field in important_fields:
                crm_value = crm_data.get(field)
                local_value = local_data.get(field)
                last_known_value = last_known_data.get(field)
                
                # Check if both CRM and local have changed since last sync
                if (crm_value != last_known_value and 
                    local_value != last_known_value and 
                    crm_value != local_value):
                    
                    conflicts[field] = {
                        "crm_value": crm_value,
                        "local_value": local_value,
                        "last_known_value": last_known_value,
                        "conflict_type": "both_modified",
                        "detected_at": datetime.utcnow().isoformat()
                    }
            
            return {
                "has_conflicts": len(conflicts) > 0,
                "conflict_count": len(conflicts),
                "conflicts": conflicts
            }
            
        except Exception as e:
            logger.error(f"Failed to detect conflicts for record {crm_record_id}: {str(e)}")
            return {"has_conflicts": False, "conflicts": {}, "error": str(e)}
    
    async def resolve_conflict(self,
                             record_sync_id: str,
                             resolution_strategy: ConflictResolutionStrategy,
                             resolved_by: str,
                             manual_resolutions: Dict[str, Any] = None) -> bool:
        """
        Resolve conflicts for a record
        
        Args:
            record_sync_id: Record sync status ID
            resolution_strategy: Strategy to use for resolution
            resolved_by: User who resolved the conflict
            manual_resolutions: Manual field resolutions if strategy is manual
            
        Returns:
            Boolean indicating success
        """
        try:
            record_status = self.db.query(RecordSyncStatus).filter(
                RecordSyncStatus.id == record_sync_id
            ).first()
            
            if not record_status:
                logger.error(f"Record sync status {record_sync_id} not found")
                return False
            
            record_status.resolution_strategy = resolution_strategy
            record_status.resolved_by = resolved_by
            record_status.resolved_at = datetime.utcnow()
            
            # Apply resolution based on strategy
            if resolution_strategy == ConflictResolutionStrategy.MANUAL_REVIEW and manual_resolutions:
                # Update conflict details with manual resolutions
                conflicts = record_status.conflict_details or {}
                for field, resolution in manual_resolutions.items():
                    if field in conflicts:
                        conflicts[field]["resolution"] = resolution
                        conflicts[field]["resolved_at"] = datetime.utcnow().isoformat()
                
                record_status.conflict_details = conflicts
                record_status.has_conflicts = False
            
            self.db.commit()
            
            logger.info(f"Resolved conflicts for record sync {record_sync_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to resolve conflict: {str(e)}")
            return False
    
    # ==================== Health Analytics ====================
    
    async def calculate_sync_health_metrics(self, 
                                          days_back: int = 7,
                                          module_name: str = "Deals") -> Dict[str, Any]:
        """
        Calculate comprehensive sync health metrics
        
        Args:
            days_back: Number of days to analyze
            module_name: Target module for analysis
            
        Returns:
            Dictionary containing health metrics
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Get sessions in the time period
            sessions = self.db.query(CRMSyncSession).filter(
                and_(
                    CRMSyncSession.module_name == module_name,
                    CRMSyncSession.started_at >= start_date
                )
            ).all()
            
            if not sessions:
                return {"health_score": 0.0, "message": "No sync sessions found"}
            
            # Calculate session metrics
            total_sessions = len(sessions)
            successful_sessions = len([s for s in sessions if s.status == SyncSessionStatus.COMPLETED])
            failed_sessions = len([s for s in sessions if s.status == SyncSessionStatus.FAILED])
            
            session_success_rate = (successful_sessions / total_sessions) * 100 if total_sessions > 0 else 0
            
            # Calculate record metrics
            total_records = sum(s.total_records or 0 for s in sessions)
            successful_records = sum(s.successful_records or 0 for s in sessions)
            failed_records = sum(s.failed_records or 0 for s in sessions)
            
            record_success_rate = (successful_records / total_records) * 100 if total_records > 0 else 0
            
            # Calculate performance metrics
            completed_sessions = [s for s in sessions if s.completed_at]
            if completed_sessions:
                durations = [
                    (s.completed_at - s.started_at).total_seconds() 
                    for s in completed_sessions
                ]
                avg_duration = statistics.mean(durations)
                median_duration = statistics.median(durations)
            else:
                avg_duration = 0
                median_duration = 0
            
            # Calculate conflict metrics
            conflict_count = self.db.query(RecordSyncStatus).filter(
                and_(
                    RecordSyncStatus.session_id.in_([s.id for s in sessions]),
                    RecordSyncStatus.has_conflicts == True
                )
            ).count()
            
            conflict_rate = (conflict_count / total_records) * 100 if total_records > 0 else 0
            
            # Calculate API performance
            total_api_calls = sum(s.api_calls_made or 0 for s in sessions)
            total_rate_limit_hits = sum(s.rate_limit_hits or 0 for s in sessions)
            
            rate_limit_hit_rate = (total_rate_limit_hits / total_api_calls) * 100 if total_api_calls > 0 else 0
            
            # Calculate overall health score (0.0 to 1.0)
            health_factors = {
                "session_success_rate": min(session_success_rate / 100, 1.0) * 0.3,
                "record_success_rate": min(record_success_rate / 100, 1.0) * 0.4,
                "low_conflict_rate": max(1.0 - (conflict_rate / 10), 0.0) * 0.2,  # Penalize high conflict rates
                "api_performance": max(1.0 - (rate_limit_hit_rate / 100), 0.0) * 0.1
            }
            
            overall_health_score = sum(health_factors.values())
            
            # Determine health status
            if overall_health_score >= 0.9:
                health_status = "excellent"
            elif overall_health_score >= 0.7:
                health_status = "good"
            elif overall_health_score >= 0.5:
                health_status = "fair"
            else:
                health_status = "poor"
            
            return {
                "period_days": days_back,
                "module_name": module_name,
                "health_score": round(overall_health_score, 3),
                "health_status": health_status,
                "session_metrics": {
                    "total_sessions": total_sessions,
                    "successful_sessions": successful_sessions,
                    "failed_sessions": failed_sessions,
                    "success_rate_percentage": round(session_success_rate, 2)
                },
                "record_metrics": {
                    "total_records": total_records,
                    "successful_records": successful_records,
                    "failed_records": failed_records,
                    "success_rate_percentage": round(record_success_rate, 2)
                },
                "performance_metrics": {
                    "avg_duration_seconds": round(avg_duration, 2),
                    "median_duration_seconds": round(median_duration, 2),
                    "total_api_calls": total_api_calls,
                    "rate_limit_hits": total_rate_limit_hits,
                    "rate_limit_hit_rate_percentage": round(rate_limit_hit_rate, 2)
                },
                "conflict_metrics": {
                    "total_conflicts": conflict_count,
                    "conflict_rate_percentage": round(conflict_rate, 2)
                },
                "health_factors": {
                    "session_reliability": round(health_factors["session_success_rate"], 3),
                    "data_integrity": round(health_factors["record_success_rate"], 3),
                    "conflict_management": round(health_factors["low_conflict_rate"], 3),
                    "api_efficiency": round(health_factors["api_performance"], 3)
                },
                "calculated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate sync health metrics: {str(e)}")
            return {"health_score": 0.0, "error": str(e)}
    
    async def store_health_metrics(self, metrics: Dict[str, Any]) -> bool:
        """
        Store health metrics in the database for historical tracking
        
        Args:
            metrics: Health metrics to store
            
        Returns:
            Boolean indicating success
        """
        try:
            health_record = SyncHealthMetrics(
                metric_date=datetime.utcnow(),
                module_name=metrics.get("module_name", "Deals"),
                total_sessions=metrics.get("session_metrics", {}).get("total_sessions", 0),
                successful_sessions=metrics.get("session_metrics", {}).get("successful_sessions", 0),
                failed_sessions=metrics.get("session_metrics", {}).get("failed_sessions", 0),
                avg_session_duration_seconds=metrics.get("performance_metrics", {}).get("avg_duration_seconds", 0),
                total_records_processed=metrics.get("record_metrics", {}).get("total_records", 0),
                total_records_successful=metrics.get("record_metrics", {}).get("successful_records", 0),
                total_records_failed=metrics.get("record_metrics", {}).get("failed_records", 0),
                total_conflicts_detected=metrics.get("conflict_metrics", {}).get("total_conflicts", 0),
                total_api_calls=metrics.get("performance_metrics", {}).get("total_api_calls", 0),
                total_rate_limit_hits=metrics.get("performance_metrics", {}).get("rate_limit_hits", 0),
                system_health_score=metrics.get("health_score", 0.0)
            )
            
            self.db.add(health_record)
            self.db.commit()
            
            logger.info(f"Stored health metrics for {metrics.get('module_name', 'Deals')}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to store health metrics: {str(e)}")
            return False
    
    # ==================== Status Queries ====================
    
    async def get_active_sessions(self, module_name: str = None) -> List[Dict[str, Any]]:
        """
        Get currently active sync sessions
        
        Args:
            module_name: Optional module filter
            
        Returns:
            List of active session information
        """
        try:
            query = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.status.in_([
                    SyncSessionStatus.INITIATED,
                    SyncSessionStatus.IN_PROGRESS
                ])
            )
            
            if module_name:
                query = query.filter(CRMSyncSession.module_name == module_name)
            
            sessions = query.order_by(desc(CRMSyncSession.started_at)).all()
            
            return [
                {
                    "id": session.id,
                    "type": session.session_type.value,
                    "module": session.module_name,
                    "status": session.status.value,
                    "started_at": session.started_at.isoformat(),
                    "progress_percentage": session.progress_percentage,
                    "processed_records": session.processed_records,
                    "total_records": session.total_records,
                    "initiated_by": session.initiated_by
                }
                for session in sessions
            ]
            
        except Exception as e:
            logger.error(f"Failed to get active sessions: {str(e)}")
            return []
    
    async def get_recent_sessions(self, 
                                limit: int = 10, 
                                module_name: str = None) -> List[Dict[str, Any]]:
        """
        Get recent sync sessions
        
        Args:
            limit: Maximum number of sessions to return
            module_name: Optional module filter
            
        Returns:
            List of recent session information
        """
        try:
            query = self.db.query(CRMSyncSession)
            
            if module_name:
                query = query.filter(CRMSyncSession.module_name == module_name)
            
            sessions = query.order_by(desc(CRMSyncSession.started_at)).limit(limit).all()
            
            return [
                {
                    "id": session.id,
                    "type": session.session_type.value,
                    "module": session.module_name,
                    "status": session.status.value,
                    "started_at": session.started_at.isoformat(),
                    "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                    "duration_seconds": session.duration_seconds if hasattr(session, 'duration_seconds') else None,
                    "total_records": session.total_records,
                    "successful_records": session.successful_records,
                    "failed_records": session.failed_records,
                    "success_rate": session.success_rate,
                    "initiated_by": session.initiated_by,
                    "error_message": session.error_message
                }
                for session in sessions
            ]
            
        except Exception as e:
            logger.error(f"Failed to get recent sessions: {str(e)}")
            return []
    
    async def get_records_with_conflicts(self, 
                                       session_id: str = None,
                                       unresolved_only: bool = True) -> List[Dict[str, Any]]:
        """
        Get records that have sync conflicts
        
        Args:
            session_id: Optional session filter
            unresolved_only: Whether to return only unresolved conflicts
            
        Returns:
            List of records with conflicts
        """
        try:
            query = self.db.query(RecordSyncStatus).filter(
                RecordSyncStatus.has_conflicts == True
            )
            
            if session_id:
                query = query.filter(RecordSyncStatus.session_id == session_id)
            
            if unresolved_only:
                query = query.filter(RecordSyncStatus.resolved_at.is_(None))
            
            records = query.order_by(desc(RecordSyncStatus.processed_at)).all()
            
            return [
                {
                    "id": record.id,
                    "session_id": record.session_id,
                    "crm_record_id": record.crm_record_id,
                    "conflicts": record.conflict_details,
                    "processed_at": record.processed_at.isoformat(),
                    "resolved_at": record.resolved_at.isoformat() if record.resolved_at else None,
                    "resolved_by": record.resolved_by,
                    "resolution_strategy": record.resolution_strategy.value if record.resolution_strategy else None
                }
                for record in records
            ]
            
        except Exception as e:
            logger.error(f"Failed to get records with conflicts: {str(e)}")
            return []
    
    # ==================== Bulk Operations Support ====================
    
    async def initialize_bulk_operation(self,
                                      session_id: str,
                                      operation_type: str,
                                      module: str = "Deals",
                                      total_records: int = 0,
                                      batch_size: int = 100,
                                      validate_before_update: bool = False) -> bool:
        """
        Initialize a bulk operation session for tracking
        """
        try:
            # Map operation type to enum
            sync_type_mapping = {
                "mass_create": SyncOperationType.BULK_CREATE,
                "mass_update": SyncOperationType.BULK_UPDATE,
                "mass_upsert": SyncOperationType.BULK_UPSERT,
                "bulk_create": SyncOperationType.BULK_CREATE,
                "bulk_update": SyncOperationType.BULK_UPDATE,
                "bulk_upsert": SyncOperationType.BULK_UPSERT
            }
            
            sync_type = sync_type_mapping.get(operation_type, SyncOperationType.BULK_UPDATE)
            
            session = CRMSyncSession(
                id=session_id,
                session_type=sync_type,
                module_name=module,
                total_records=total_records,
                status=SyncSessionStatus.INITIATED,
                initiated_by="bulk_api",
                sync_config={
                    "batch_size": batch_size,
                    "validate_before_update": validate_before_update,
                    "operation_type": operation_type
                }
            )
            
            self.db.add(session)
            self.db.commit()
            
            logger.info(f"Initialized bulk operation {session_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to initialize bulk operation: {str(e)}")
            return False
    
    async def get_bulk_operation_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a bulk operation
        """
        try:
            session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.id == session_id
            ).first()
            
            if not session:
                return None
            
            duration_seconds = None
            if session.completed_at and session.started_at:
                duration_seconds = (session.completed_at - session.started_at).total_seconds()
            
            progress = {}
            if session.total_records and session.total_records > 0:
                processed = (session.successful_records or 0) + (session.failed_records or 0)
                progress = {
                    "processed_records": processed,
                    "total_records": session.total_records,
                    "percentage": round((processed / session.total_records) * 100, 2)
                }
            
            metrics = {
                "successful_records": session.successful_records or 0,
                "failed_records": session.failed_records or 0,
                "skipped_records": session.skipped_records or 0,
                "api_calls_made": session.api_calls_made or 0,
                "rate_limit_hits": session.rate_limit_hits or 0
            }
            
            return {
                "status": session.status.value,
                "operation_type": session.session_type.value,
                "module": session.module_name,
                "progress": progress,
                "metrics": metrics,
                "started_at": session.started_at.isoformat(),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "duration_seconds": duration_seconds,
                "last_updated": session.last_activity_at.isoformat() if session.last_activity_at else None,
                "errors": [session.error_message] if session.error_message else []
            }
            
        except Exception as e:
            logger.error(f"Failed to get bulk operation status: {str(e)}")
            return None
    
    async def cancel_bulk_operation(self, session_id: str) -> bool:
        """
        Cancel a bulk operation
        """
        try:
            session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.id == session_id
            ).first()
            
            if not session:
                return False
            
            if session.status not in [SyncSessionStatus.INITIATED, SyncSessionStatus.IN_PROGRESS]:
                return False
            
            session.status = SyncSessionStatus.CANCELLED
            session.completed_at = datetime.utcnow()
            session.error_message = "Operation cancelled by user"
            
            self.db.commit()
            
            logger.info(f"Cancelled bulk operation {session_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to cancel bulk operation: {str(e)}")
            return False
    
    async def get_bulk_operation_results(self,
                                       session_id: str,
                                       include_successful: bool = False,
                                       include_failed: bool = True,
                                       limit: int = 100,
                                       offset: int = 0) -> Optional[Dict[str, Any]]:
        """
        Get detailed results of a bulk operation
        """
        try:
            query = self.db.query(RecordSyncStatus).filter(
                RecordSyncStatus.session_id == session_id
            )
            
            # Filter based on success/failure
            if include_successful and not include_failed:
                query = query.filter(RecordSyncStatus.error_message.is_(None))
            elif include_failed and not include_successful:
                query = query.filter(RecordSyncStatus.error_message.isnot(None))
            # If both are True or both are False, include all results
            
            total_results = query.count()
            results = query.offset(offset).limit(limit).all()
            
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "record_id": result.crm_record_id,
                    "action": result.action_taken.value if result.action_taken else None,
                    "success": result.error_message is None,
                    "error_message": result.error_message,
                    "fields_updated": result.fields_updated,
                    "processing_time_ms": result.processing_time_ms,
                    "processed_at": result.processed_at.isoformat(),
                    "has_conflicts": result.has_conflicts
                })
            
            # Get summary statistics
            session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.id == session_id
            ).first()
            
            summary = {}
            if session:
                summary = {
                    "total_records": session.total_records or 0,
                    "successful_records": session.successful_records or 0,
                    "failed_records": session.failed_records or 0,
                    "skipped_records": session.skipped_records or 0
                }
            
            return {
                "results": formatted_results,
                "total_results": total_results,
                "has_more": (offset + limit) < total_results,
                "summary": summary
            }
            
        except Exception as e:
            logger.error(f"Failed to get bulk operation results: {str(e)}")
            return None
    
    async def get_active_bulk_operations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get currently active bulk operations
        """
        try:
            sessions = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.status.in_([
                    SyncSessionStatus.INITIATED,
                    SyncSessionStatus.IN_PROGRESS
                ])
            ).order_by(desc(CRMSyncSession.started_at)).limit(limit).all()
            
            active_operations = []
            for session in sessions:
                progress_percentage = 0
                if session.total_records and session.total_records > 0:
                    processed = (session.successful_records or 0) + (session.failed_records or 0)
                    progress_percentage = round((processed / session.total_records) * 100, 2)
                
                active_operations.append({
                    "session_id": session.id,
                    "operation_type": session.session_type.value,
                    "module": session.module_name,
                    "status": session.status.value,
                    "started_at": session.started_at.isoformat(),
                    "progress_percentage": progress_percentage,
                    "total_records": session.total_records,
                    "processed_records": (session.successful_records or 0) + (session.failed_records or 0),
                    "initiated_by": session.initiated_by
                })
            
            return active_operations
            
        except Exception as e:
            logger.error(f"Failed to get active bulk operations: {str(e)}")
            return []
    
    async def get_recent_bulk_operations(self,
                                       limit: int = 20,
                                       include_completed: bool = True,
                                       include_failed: bool = True) -> List[Dict[str, Any]]:
        """
        Get recent bulk operations
        """
        try:
            query = self.db.query(CRMSyncSession)
            
            # Filter by status if needed
            status_filters = []
            if include_completed:
                status_filters.append(SyncSessionStatus.COMPLETED)
            if include_failed:
                status_filters.append(SyncSessionStatus.FAILED)
            
            if status_filters:
                query = query.filter(CRMSyncSession.status.in_(status_filters))
            
            sessions = query.order_by(desc(CRMSyncSession.started_at)).limit(limit).all()
            
            recent_operations = []
            for session in sessions:
                duration_seconds = None
                if session.completed_at and session.started_at:
                    duration_seconds = (session.completed_at - session.started_at).total_seconds()
                
                recent_operations.append({
                    "session_id": session.id,
                    "operation_type": session.session_type.value,
                    "module": session.module_name,
                    "status": session.status.value,
                    "started_at": session.started_at.isoformat(),
                    "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                    "duration_seconds": duration_seconds,
                    "total_records": session.total_records,
                    "successful_records": session.successful_records,
                    "failed_records": session.failed_records,
                    "initiated_by": session.initiated_by,
                    "error_message": session.error_message
                })
            
            return recent_operations
            
        except Exception as e:
            logger.error(f"Failed to get recent bulk operations: {str(e)}")
            return []
    
    async def get_bulk_operations_health(self) -> Dict[str, Any]:
        """
        Get health status of bulk operations system
        """
        try:
            # Get metrics from the last 24 hours
            since_time = datetime.utcnow() - timedelta(hours=24)
            
            # Count operations by status
            total_operations = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.started_at >= since_time
            ).count()
            
            successful_operations = self.db.query(CRMSyncSession).filter(
                and_(
                    CRMSyncSession.started_at >= since_time,
                    CRMSyncSession.status == SyncSessionStatus.COMPLETED
                )
            ).count()
            
            failed_operations = self.db.query(CRMSyncSession).filter(
                and_(
                    CRMSyncSession.started_at >= since_time,
                    CRMSyncSession.status == SyncSessionStatus.FAILED
                )
            ).count()
            
            active_operations = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.status.in_([
                    SyncSessionStatus.INITIATED,
                    SyncSessionStatus.IN_PROGRESS
                ])
            ).count()
            
            # Calculate success rate
            success_rate = 0.0
            if total_operations > 0:
                success_rate = (successful_operations / total_operations) * 100
            
            # Get average processing time
            completed_sessions = self.db.query(CRMSyncSession).filter(
                and_(
                    CRMSyncSession.started_at >= since_time,
                    CRMSyncSession.completed_at.isnot(None)
                )
            ).all()
            
            avg_processing_time = 0.0
            if completed_sessions:
                processing_times = [
                    (session.completed_at - session.started_at).total_seconds()
                    for session in completed_sessions
                ]
                avg_processing_time = sum(processing_times) / len(processing_times)
            
            return {
                "last_24_hours": {
                    "total_operations": total_operations,
                    "successful_operations": successful_operations,
                    "failed_operations": failed_operations,
                    "success_rate_percentage": round(success_rate, 2),
                    "avg_processing_time_seconds": round(avg_processing_time, 2)
                },
                "current_status": {
                    "active_operations": active_operations
                },
                "system_health": "healthy" if success_rate >= 80 else "degraded" if success_rate >= 50 else "unhealthy"
            }
            
        except Exception as e:
            logger.error(f"Failed to get bulk operations health: {str(e)}")
            return {"error": str(e)}
    
    # ==================== API Endpoint Support Methods ====================
    
    async def get_current_sync_status(self) -> Optional[Dict[str, Any]]:
        """
        Get current synchronization status
        
        Returns information about any active sync or the last completed sync
        """
        try:
            # Get active sync session
            active_session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.status.in_([
                    SyncSessionStatus.INITIATED,
                    SyncSessionStatus.IN_PROGRESS
                ])
            ).order_by(desc(CRMSyncSession.started_at)).first()
            
            if active_session:
                return {
                    "session_id": active_session.id,
                    "status": "in_progress",
                    "sync_type": active_session.session_type.value,
                    "module": active_session.module_name,
                    "started_at": active_session.started_at.isoformat(),
                    "progress_percentage": active_session.progress_percentage or 0,
                    "processed_records": active_session.processed_records or 0,
                    "total_records": active_session.total_records or 0
                }
            
            # Get most recent completed session
            recent_session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.status.in_([
                    SyncSessionStatus.COMPLETED,
                    SyncSessionStatus.FAILED,
                    SyncSessionStatus.CANCELLED
                ])
            ).order_by(desc(CRMSyncSession.completed_at)).first()
            
            if recent_session:
                return {
                    "session_id": recent_session.id,
                    "status": recent_session.status.value,
                    "sync_type": recent_session.session_type.value,
                    "module": recent_session.module_name,
                    "started_at": recent_session.started_at.isoformat(),
                    "completed_at": recent_session.completed_at.isoformat() if recent_session.completed_at else None,
                    "successful_records": recent_session.successful_records or 0,
                    "failed_records": recent_session.failed_records or 0,
                    "total_records": recent_session.total_records or 0
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get current sync status: {str(e)}")
            return None
    
    async def get_sync_health_status(self) -> Dict[str, Any]:
        """
        Get sync health status for health endpoint
        """
        try:
            # Get health metrics for the last 7 days
            health_metrics = await self.calculate_sync_health_metrics(days_back=7)
            
            # Get last successful sync
            last_successful_sync = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.status == SyncSessionStatus.COMPLETED
            ).order_by(desc(CRMSyncSession.completed_at)).first()
            
            last_sync_time = None
            if last_successful_sync and last_successful_sync.completed_at:
                last_sync_time = last_successful_sync.completed_at.isoformat()
            
            # Calculate error rate
            error_rate = 0.0
            if health_metrics.get("session_metrics"):
                total_sessions = health_metrics["session_metrics"].get("total_sessions", 0)
                failed_sessions = health_metrics["session_metrics"].get("failed_sessions", 0)
                if total_sessions > 0:
                    error_rate = (failed_sessions / total_sessions) * 100
            
            return {
                "status": health_metrics.get("health_status", "unknown"),
                "health_score": health_metrics.get("health_score", 0.0),
                "last_successful_sync": last_sync_time,
                "error_rate": round(error_rate, 2),
                "performance_metrics": health_metrics.get("performance_metrics", {}),
                "session_metrics": health_metrics.get("session_metrics", {}),
                "record_metrics": health_metrics.get("record_metrics", {})
            }
            
        except Exception as e:
            logger.error(f"Failed to get sync health status: {str(e)}")
            return {
                "status": "unhealthy",
                "health_score": 0.0,
                "error": str(e)
            }
    
    async def initialize_sync_session(self, 
                                    session_id: str,
                                    sync_type: str,
                                    include_metadata: bool = False,
                                    since_hours: int = None,
                                    target_records: List[str] = None,
                                    forced: bool = False) -> bool:
        """
        Initialize a sync session for API endpoints
        """
        try:
            # Map sync type to enum
            sync_type_mapping = {
                "full": SyncOperationType.FULL_SYNC,
                "incremental": SyncOperationType.INCREMENTAL_SYNC,
                "manual_full": SyncOperationType.FULL_SYNC,
                "manual_incremental": SyncOperationType.INCREMENTAL_SYNC
            }
            
            operation_type = sync_type_mapping.get(sync_type, SyncOperationType.INCREMENTAL_SYNC)
            
            config = {
                "include_metadata": include_metadata,
                "since_hours": since_hours,
                "target_records": target_records,
                "forced": forced
            }
            
            session = await self.create_sync_session(
                session_type=operation_type,
                module_name="Deals",
                initiated_by="api",
                sync_config=config
            )
            
            # Update session ID to match the provided one
            session.id = session_id
            self.db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize sync session: {str(e)}")
            return False
    
    async def get_recent_sync_sessions(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get recent sync sessions for status endpoint
        """
        try:
            return await self.get_recent_sessions(limit=limit)
        except Exception as e:
            logger.error(f"Failed to get recent sync sessions: {str(e)}")
            return []
    
    async def get_sync_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed status for a specific sync session
        """
        try:
            session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.id == session_id
            ).first()
            
            if not session:
                return None
            
            duration_seconds = None
            if session.completed_at and session.started_at:
                duration_seconds = (session.completed_at - session.started_at).total_seconds()
            
            # Get progress information
            progress = {}
            if session.total_records and session.total_records > 0:
                processed = (session.successful_records or 0) + (session.failed_records or 0)
                progress = {
                    "processed_records": processed,
                    "total_records": session.total_records,
                    "percentage": round((processed / session.total_records) * 100, 2)
                }
            
            # Get metrics
            metrics = {
                "successful_records": session.successful_records or 0,
                "failed_records": session.failed_records or 0,
                "skipped_records": session.skipped_records or 0,
                "api_calls_made": session.api_calls_made or 0,
                "rate_limit_hits": session.rate_limit_hits or 0
            }
            
            # Get recent errors
            errors = []
            if session.error_message:
                errors.append(session.error_message)
            
            return {
                "status": session.status.value,
                "sync_type": session.session_type.value,
                "progress": progress,
                "metrics": metrics,
                "errors": errors,
                "started_at": session.started_at.isoformat(),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "duration_seconds": duration_seconds,
                "last_updated": session.last_activity_at.isoformat() if session.last_activity_at else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get sync session status: {str(e)}")
            return None
    
    async def cancel_sync_session(self, session_id: str) -> bool:
        """
        Cancel a sync session
        """
        try:
            session = self.db.query(CRMSyncSession).filter(
                CRMSyncSession.id == session_id
            ).first()
            
            if not session:
                return False
            
            if session.status not in [SyncSessionStatus.INITIATED, SyncSessionStatus.IN_PROGRESS]:
                return False
            
            session.status = SyncSessionStatus.CANCELLED
            session.completed_at = datetime.utcnow()
            session.error_message = "Cancelled by user"
            
            self.db.commit()
            
            logger.info(f"Cancelled sync session {session_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to cancel sync session: {str(e)}")
            return False