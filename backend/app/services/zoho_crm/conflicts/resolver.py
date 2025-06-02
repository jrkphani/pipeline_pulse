"""
Advanced Conflict Resolution Engine
Always prioritizes Zoho CRM as source of truth while preserving local analytical extensions
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from ..core.exceptions import ZohoConflictError
import logging

logger = logging.getLogger(__name__)


class ConflictResolutionEngine:
    """
    Advanced conflict resolution that always prioritizes Zoho CRM data
    while preserving local analytical extensions
    """
    
    # Fields that are local analytical extensions (never overwritten by Zoho)
    LOCAL_ANALYTICAL_FIELDS = {
        'health_signal',
        'health_reason',
        'current_phase',
        'action_items',
        'requires_attention',
        'updated_this_week',
        'last_health_check',
        'pipeline_analysis_id',
        'local_notes',
        'custom_tags',
        'risk_factors',
        'next_steps'
    }
    
    # Fields that should always come from Zoho CRM (source of truth)
    ZOHO_AUTHORITATIVE_FIELDS = {
        'deal_name',
        'account_name',
        'amount',
        'currency',
        'stage',
        'probability',
        'closing_date',
        'owner',
        'territory',
        'service_type',
        'created_date',
        'modified_date',
        'deal_id',
        'record_id'
    }
    
    def __init__(self):
        self.conflict_log = []
    
    def resolve_record_conflicts(
        self, 
        local_record: Dict[str, Any], 
        zoho_record: Dict[str, Any],
        record_id: str
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Resolve conflicts between local and Zoho records
        Returns: (resolved_record, conflict_details)
        """
        
        resolved_record = {}
        conflicts = []
        
        # Start with Zoho data as base (source of truth)
        for field, zoho_value in zoho_record.items():
            if field in self.ZOHO_AUTHORITATIVE_FIELDS:
                local_value = local_record.get(field)
                
                if local_value != zoho_value and local_value is not None:
                    # Log conflict but use Zoho value
                    conflict = {
                        'record_id': record_id,
                        'field': field,
                        'local_value': local_value,
                        'zoho_value': zoho_value,
                        'resolution': 'zoho_wins',
                        'timestamp': datetime.now().isoformat(),
                        'reason': 'Zoho CRM is authoritative source'
                    }
                    conflicts.append(conflict)
                    logger.info(f"Conflict resolved for {record_id}.{field}: {local_value} -> {zoho_value}")
                
                resolved_record[field] = zoho_value
            else:
                resolved_record[field] = zoho_value
        
        # Preserve local analytical extensions
        for field, local_value in local_record.items():
            if field in self.LOCAL_ANALYTICAL_FIELDS:
                resolved_record[field] = local_value
                logger.debug(f"Preserved local analytical field {field} for {record_id}")
        
        # Add any missing local analytical fields with defaults
        self._add_default_analytical_fields(resolved_record)
        
        return resolved_record, conflicts
    
    def _add_default_analytical_fields(self, record: Dict[str, Any]):
        """Add default values for missing analytical fields"""
        defaults = {
            'health_signal': 'YELLOW',
            'health_reason': 'Needs assessment',
            'requires_attention': False,
            'updated_this_week': False,
            'action_items': [],
            'last_health_check': datetime.now().isoformat()
        }
        
        for field, default_value in defaults.items():
            if field not in record:
                record[field] = default_value
    
    def resolve_bulk_conflicts(
        self, 
        local_records: List[Dict[str, Any]], 
        zoho_records: List[Dict[str, Any]],
        id_field: str = 'deal_id'
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Resolve conflicts for bulk operations
        Returns: (resolved_records, all_conflicts)
        """
        
        # Create lookup maps
        local_map = {str(record.get(id_field)): record for record in local_records if record.get(id_field)}
        zoho_map = {str(record.get(id_field)): record for record in zoho_records if record.get(id_field)}
        
        resolved_records = []
        all_conflicts = []
        
        # Process records that exist in both systems
        for record_id in set(local_map.keys()) & set(zoho_map.keys()):
            local_record = local_map[record_id]
            zoho_record = zoho_map[record_id]
            
            resolved_record, conflicts = self.resolve_record_conflicts(
                local_record, zoho_record, record_id
            )
            
            resolved_records.append(resolved_record)
            all_conflicts.extend(conflicts)
        
        # Add records that only exist in Zoho (new records)
        for record_id, zoho_record in zoho_map.items():
            if record_id not in local_map:
                # New record from Zoho, add with default analytical fields
                self._add_default_analytical_fields(zoho_record)
                resolved_records.append(zoho_record)
                logger.info(f"Added new record from Zoho: {record_id}")
        
        # Handle records that only exist locally (deleted in Zoho)
        for record_id, local_record in local_map.items():
            if record_id not in zoho_map:
                conflict = {
                    'record_id': record_id,
                    'field': 'record_existence',
                    'local_value': 'exists',
                    'zoho_value': 'deleted',
                    'resolution': 'mark_as_deleted',
                    'timestamp': datetime.now().isoformat(),
                    'reason': 'Record deleted in Zoho CRM'
                }
                all_conflicts.append(conflict)
                logger.warning(f"Record {record_id} exists locally but deleted in Zoho")
        
        return resolved_records, all_conflicts
    
    def validate_field_update(
        self, 
        field_name: str, 
        new_value: Any, 
        current_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate if a field update is allowed based on conflict resolution rules
        """
        
        if field_name in self.ZOHO_AUTHORITATIVE_FIELDS:
            return {
                'allowed': False,
                'reason': f'Field {field_name} is managed by Zoho CRM and cannot be updated locally',
                'suggestion': 'Update this field in Zoho CRM instead'
            }
        
        if field_name in self.LOCAL_ANALYTICAL_FIELDS:
            return {
                'allowed': True,
                'reason': f'Field {field_name} is a local analytical extension',
                'note': 'This update will not be synced to Zoho CRM'
            }
        
        # Unknown field - allow but warn
        return {
            'allowed': True,
            'reason': f'Field {field_name} is not in known field categories',
            'warning': 'Please verify if this field should be synced to Zoho CRM'
        }
    
    def generate_conflict_report(self, conflicts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a comprehensive conflict resolution report"""
        
        if not conflicts:
            return {
                'total_conflicts': 0,
                'message': 'No conflicts detected'
            }
        
        # Analyze conflicts
        field_conflicts = {}
        resolution_types = {}
        
        for conflict in conflicts:
            field = conflict['field']
            resolution = conflict['resolution']
            
            field_conflicts[field] = field_conflicts.get(field, 0) + 1
            resolution_types[resolution] = resolution_types.get(resolution, 0) + 1
        
        return {
            'total_conflicts': len(conflicts),
            'conflicts_by_field': field_conflicts,
            'resolutions_applied': resolution_types,
            'most_conflicted_field': max(field_conflicts.items(), key=lambda x: x[1])[0] if field_conflicts else None,
            'conflicts': conflicts,
            'generated_at': datetime.now().isoformat()
        }
