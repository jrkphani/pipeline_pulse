"""
Incremental Update Service for CRM data processing
Handles smart detection and record-level change tracking
"""

import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, date
import json
import uuid

from app.models.analysis import Analysis
from app.models.crm_record import CrmRecord, CrmRecordHistory, DataQualityAlert
from app.services.data_quality_service import DataQualityService


class IncrementalUpdateService:
    """Service for handling incremental CRM data updates"""
    
    def __init__(self):
        self.data_quality_service = DataQualityService()
        
        # Business-critical fields to track for changes
        self.tracked_fields = [
            'Amount', 'Stage', 'Probability (%)', 'Closing Date',
            'Next Step', 'Account Name', 'Opportunity Owner',
            'Modified Time', 'Created Time'
        ]
    
    def detect_import_type(self, df: pd.DataFrame, db: Session) -> Tuple[str, float, Dict[str, Any]]:
        """
        Smart detection of import type based on Record ID overlap
        Returns: (import_type, overlap_percentage, analysis_info)
        """
        
        if 'Record Id' not in df.columns:
            return 'new_dataset', 0.0, {'reason': 'No Record Id column found'}
        
        # Get unique record IDs from upload
        new_record_ids = set(df['Record Id'].dropna().unique())
        
        if not new_record_ids:
            return 'new_dataset', 0.0, {'reason': 'No valid Record IDs found'}
        
        # Check overlap with existing records
        existing_records = db.query(CrmRecord.record_id).filter(CrmRecord.is_active == True).all()
        existing_record_ids = set([r.record_id for r in existing_records])
        
        if not existing_record_ids:
            return 'new_dataset', 0.0, {'reason': 'No existing records in database'}
        
        # Calculate overlap
        overlap_ids = new_record_ids.intersection(existing_record_ids)
        overlap_percentage = len(overlap_ids) / len(new_record_ids) * 100
        
        analysis_info = {
            'total_new_records': len(new_record_ids),
            'total_existing_records': len(existing_record_ids),
            'overlapping_records': len(overlap_ids),
            'overlap_percentage': overlap_percentage,
            'new_records': len(new_record_ids - existing_record_ids),
            'missing_records': len(existing_record_ids - new_record_ids)
        }
        
        # Apply smart detection thresholds
        if overlap_percentage >= 70:
            return 'incremental_update', overlap_percentage, analysis_info
        elif overlap_percentage <= 30:
            return 'new_dataset', overlap_percentage, analysis_info
        else:
            return 'user_decision_required', overlap_percentage, analysis_info
    
    def process_incremental_update(
        self, 
        df: pd.DataFrame, 
        analysis_id: str,
        export_date: Optional[date],
        db: Session
    ) -> Dict[str, Any]:
        """
        Process incremental update with change tracking
        """
        
        if 'Record Id' not in df.columns:
            raise ValueError("Record Id column is required for incremental updates")
        
        # Initialize counters
        records_added = 0
        records_updated = 0
        records_removed = 0
        anomalies = []
        
        # Convert DataFrame to records dictionary for easier processing
        new_records = {}
        for _, row in df.iterrows():
            record_id = row['Record Id']
            if pd.notna(record_id):
                new_records[record_id] = row.to_dict()
        
        # Get all existing active records
        existing_records = db.query(CrmRecord).filter(CrmRecord.is_active == True).all()
        existing_record_ids = set([r.record_id for r in existing_records])
        new_record_ids = set(new_records.keys())
        
        # Process updates and additions
        for record_id, record_data in new_records.items():
            if record_id in existing_record_ids:
                # Update existing record
                changes = self._update_existing_record(
                    record_id, record_data, analysis_id, export_date, db
                )
                if changes:
                    records_updated += 1
                    # Check for anomalies
                    record_anomalies = self.data_quality_service.detect_anomalies(
                        record_id, changes, analysis_id, db
                    )
                    anomalies.extend(record_anomalies)
            else:
                # Add new record
                self._add_new_record(record_id, record_data, analysis_id, export_date, db)
                records_added += 1
        
        # Mark removed records as inactive
        removed_record_ids = existing_record_ids - new_record_ids
        for record_id in removed_record_ids:
            self._mark_record_removed(record_id, export_date, db)
            records_removed += 1
        
        return {
            'records_added': records_added,
            'records_updated': records_updated,
            'records_removed': records_removed,
            'anomalies': anomalies,
            'total_records': len(new_records)
        }
    
    def _update_existing_record(
        self, 
        record_id: str, 
        new_data: Dict[str, Any], 
        analysis_id: str,
        export_date: Optional[date],
        db: Session
    ) -> List[Dict[str, Any]]:
        """Update existing record and track changes"""
        
        record = db.query(CrmRecord).filter(CrmRecord.record_id == record_id).first()
        if not record:
            return []
        
        old_data = record.current_data or {}
        changes = []
        
        # Check for changes in tracked fields
        for field in self.tracked_fields:
            if field in new_data:
                old_value = old_data.get(field)
                new_value = new_data[field]
                
                # Convert to string for comparison
                old_str = str(old_value) if old_value is not None else None
                new_str = str(new_value) if new_value is not None else None
                
                if old_str != new_str:
                    # Record the change
                    change_record = CrmRecordHistory(
                        record_id=record_id,
                        analysis_id=analysis_id,
                        field_name=field,
                        old_value=old_str,
                        new_value=new_str,
                        change_date=export_date or date.today()
                    )
                    db.add(change_record)
                    
                    changes.append({
                        'field': field,
                        'old_value': old_value,
                        'new_value': new_value
                    })
        
        # Update record data
        record.current_data = new_data
        record.last_seen_date = export_date or date.today()
        record.analysis_id = analysis_id
        
        return changes
    
    def _add_new_record(
        self, 
        record_id: str, 
        record_data: Dict[str, Any], 
        analysis_id: str,
        export_date: Optional[date],
        db: Session
    ):
        """Add new CRM record"""
        
        new_record = CrmRecord(
            record_id=record_id,
            analysis_id=analysis_id,
            current_data=record_data,
            is_active=True,
            first_seen_date=export_date or date.today(),
            last_seen_date=export_date or date.today()
        )
        db.add(new_record)
    
    def _mark_record_removed(
        self, 
        record_id: str, 
        export_date: Optional[date],
        db: Session
    ):
        """Mark record as removed from CRM"""
        
        record = db.query(CrmRecord).filter(CrmRecord.record_id == record_id).first()
        if record:
            record.is_active = False
            record.last_seen_date = export_date or date.today()
    
    def get_change_summary(self, analysis_id: str, db: Session) -> Dict[str, Any]:
        """Get summary of changes for an analysis"""
        
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return {}
        
        # Get recent changes
        recent_changes = db.query(CrmRecordHistory).filter(
            CrmRecordHistory.analysis_id == analysis_id
        ).all()
        
        # Get alerts
        alerts = db.query(DataQualityAlert).filter(
            DataQualityAlert.analysis_id == analysis_id,
            DataQualityAlert.is_resolved == False
        ).all()
        
        return {
            'analysis_id': analysis_id,
            'import_type': analysis.import_type,
            'export_date': analysis.export_date,
            'records_added': analysis.records_added,
            'records_updated': analysis.records_updated,
            'records_removed': analysis.records_removed,
            'total_changes': len(recent_changes),
            'unresolved_alerts': len(alerts),
            'change_details': [
                {
                    'record_id': change.record_id,
                    'field': change.field_name,
                    'old_value': change.old_value,
                    'new_value': change.new_value,
                    'change_date': change.change_date
                }
                for change in recent_changes[:10]  # Limit to recent 10
            ],
            'alerts': [
                {
                    'record_id': alert.record_id,
                    'type': alert.alert_type,
                    'description': alert.description,
                    'severity': alert.severity
                }
                for alert in alerts[:5]  # Limit to top 5
            ]
        }
