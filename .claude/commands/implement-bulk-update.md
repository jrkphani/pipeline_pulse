# Implement Bulk Update System

Implement comprehensive bulk update system for Pipeline Pulse: $ARGUMENTS

## 🎯 Bulk Update Feature Overview

The Bulk Update system enables users to select multiple CRM records and update specific field values across all selected records in a single operation, with full validation, progress tracking, and bidirectional CRM synchronization.

## 📊 System Architecture

### User Workflow
1. **List Records**: Display all available CRM records in selectable table
2. **Select Field**: Choose field to update with Zoho CRM validation
3. **Field Validation**: Fetch field constraints (picklist values, data types)
4. **Value Input**: Provide appropriate input with validation
5. **Record Selection**: Multi-select records from filtered list
6. **Local Update**: Update local database with confirmation dialog
7. **CRM Sync**: Push updates to Zoho CRM with progress tracking

## 🔧 Backend Implementation

### Database Models

```python
# app/models/bulk_update.py
from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid
from datetime import datetime

class BulkUpdateBatch(Base):
    __tablename__ = "bulk_update_batches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(String(255), unique=True, nullable=False)
    field_name = Column(String(255), nullable=False)
    field_value = Column(Text, nullable=False)
    total_records = Column(Integer, nullable=False)
    successful_updates = Column(Integer, default=0)
    failed_updates = Column(Integer, default=0)
    status = Column(String(50), default='pending')  # pending, in_progress, completed, failed
    sync_status = Column(String(50), default='not_synced')  # not_synced, syncing, synced, sync_failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255), nullable=False)
    error_details = Column(JSON)

class BulkUpdateRecord(Base):
    __tablename__ = "bulk_update_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(String(255), nullable=False)
    record_id = Column(String(255), nullable=False)
    zoho_id = Column(String(255))
    old_value = Column(Text)
    new_value = Column(Text)
    status = Column(String(50), default='pending')  # pending, success, failed
    sync_status = Column(String(50), default='not_synced')
    error_message = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow)
```

### Zoho Field Service

```python
# app/services/zoho_field_service.py
from typing import List, Dict, Any, Optional
import requests
from app.services.zoho_auth_service import ZohoAuthService
from app.core.config import settings

class ZohoFieldService:
    def __init__(self):
        self.auth_service = ZohoAuthService()
        self.base_url = settings.ZOHO_BASE_URL
    
    async def get_module_fields(self, module_name: str = "Deals") -> List[Dict[str, Any]]:
        """Get all fields for a Zoho CRM module with their properties"""
        access_token = await self.auth_service.get_access_token()
        
        url = f"{self.base_url}/settings/fields"
        params = {"module": module_name}
        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        return self._process_field_metadata(data.get("fields", []))
    
    async def get_field_picklist_values(
        self, 
        field_name: str, 
        module_name: str = "Deals"
    ) -> List[Dict[str, str]]:
        """Get picklist values for a specific field"""
        fields = await self.get_module_fields(module_name)
        
        field_info = next((f for f in fields if f["api_name"] == field_name), None)
        if not field_info or not field_info.get("has_picklist"):
            return []
        
        return field_info.get("picklist_values", [])
    
    def _process_field_metadata(self, fields: List[Dict]) -> List[Dict[str, Any]]:
        """Process raw Zoho field metadata into our format"""
        processed_fields = []
        
        for field in fields:
            # Skip system fields that shouldn't be bulk updated
            if field.get("read_only") or field.get("api_name") in self._get_system_fields():
                continue
            
            processed_field = {
                "api_name": field.get("api_name"),
                "display_label": field.get("display_label"),
                "data_type": field.get("data_type"),
                "is_custom": field.get("custom_field", False),
                "is_read_only": field.get("read_only", False),
                "is_required": field.get("required", False),
                "has_picklist": field.get("data_type") == "picklist",
                "max_length": field.get("length"),
                "picklist_values": field.get("pick_list_values", []) if field.get("data_type") == "picklist" else None
            }
            
            processed_fields.append(processed_field)
        
        return processed_fields
    
    def _get_system_fields(self) -> List[str]:
        """System fields that should not be bulk updated"""
        return [
            "id", "Created_Time", "Modified_Time", "Created_By", "Modified_By",
            "Record_Image", "Locked__s", "Tag", "$converted", "$approved",
            "Exchange_Rate", "Currency", "Owner"
        ]

class ZohoBulkUpdateService:
    def __init__(self):
        self.auth_service = ZohoAuthService()
        self.base_url = settings.ZOHO_BASE_URL
    
    async def bulk_update_records(
        self, 
        records: List[Dict[str, Any]], 
        module_name: str = "Deals"
    ) -> Dict[str, Any]:
        """Send bulk update to Zoho CRM"""
        access_token = await self.auth_service.get_access_token()
        
        url = f"{self.base_url}/{module_name}"
        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }
        
        # Zoho allows max 100 records per API call
        batch_size = 100
        results = []
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            payload = {"data": batch}
            
            response = requests.put(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                batch_result = response.json()
                results.extend(batch_result.get("data", []))
            else:
                # Handle API errors
                error_detail = {
                    "batch_start": i,
                    "batch_size": len(batch),
                    "error": response.text,
                    "status_code": response.status_code
                }
                results.append({"status": "error", "details": error_detail})
        
        return {
            "total_records": len(records),
            "results": results,
            "success_count": len([r for r in results if r.get("status") == "success"]),
            "error_count": len([r for r in results if r.get("status") == "error"])
        }
```

### Bulk Update Service

```python
# app/services/bulk_update_service.py
import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.bulk_update import BulkUpdateBatch, BulkUpdateRecord
from app.models.analysis import Analysis  # Your existing record model
from app.services.zoho_bulk_update_service import ZohoBulkUpdateService
from datetime import datetime

class BulkUpdateService:
    def __init__(self, db: Session):
        self.db = db
        self.zoho_service = ZohoBulkUpdateService()
    
    async def execute_bulk_update(
        self, 
        field_name: str,
        field_value: Any,
        record_ids: List[str],
        updated_by: str
    ) -> Dict[str, Any]:
        """Execute bulk update in local database"""
        try:
            # Generate batch ID
            batch_id = str(uuid.uuid4())
            
            # Get records to update
            records_to_update = self._get_records_by_ids(record_ids)
            
            if not records_to_update:
                raise ValueError("No valid records found for update")
            
            # Create batch record
            batch = BulkUpdateBatch(
                batch_id=batch_id,
                field_name=field_name,
                field_value=str(field_value),
                total_records=len(records_to_update),
                created_by=updated_by
            )
            self.db.add(batch)
            
            # Update records in local database
            successful_updates = 0
            failed_updates = 0
            
            for record in records_to_update:
                try:
                    old_value = self._get_field_value(record, field_name)
                    
                    # Update the record
                    self._update_record_field(record, field_name, field_value)
                    
                    # Track individual update
                    update_record = BulkUpdateRecord(
                        batch_id=batch_id,
                        record_id=record.id,
                        zoho_id=getattr(record, 'zoho_id', None),
                        old_value=str(old_value) if old_value else None,
                        new_value=str(field_value),
                        status="success"
                    )
                    self.db.add(update_record)
                    
                    successful_updates += 1
                    
                except Exception as e:
                    # Track failed update
                    update_record = BulkUpdateRecord(
                        batch_id=batch_id,
                        record_id=record.id,
                        zoho_id=getattr(record, 'zoho_id', None),
                        old_value=None,
                        new_value=str(field_value),
                        status="failed",
                        error_message=str(e)
                    )
                    self.db.add(update_record)
                    
                    failed_updates += 1
            
            # Update batch status
            batch.successful_updates = successful_updates
            batch.failed_updates = failed_updates
            batch.status = "completed" if failed_updates == 0 else "partial_success"
            
            self.db.commit()
            
            return {
                "batch_id": batch_id,
                "total_records": len(records_to_update),
                "successful_updates": successful_updates,
                "failed_updates": failed_updates,
                "status": batch.status
            }
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    async def sync_to_crm(self, batch_id: str) -> Dict[str, Any]:
        """Sync updates to Zoho CRM"""
        try:
            # Get batch and successful records
            batch = self.db.query(BulkUpdateBatch).filter_by(batch_id=batch_id).first()
            if not batch:
                raise ValueError(f"Batch {batch_id} not found")
            
            successful_records = self.db.query(BulkUpdateRecord).filter_by(
                batch_id=batch_id,
                status="success"
            ).all()
            
            if not successful_records:
                return {
                    "batch_id": batch_id,
                    "message": "No successful records to sync",
                    "synced_count": 0
                }
            
            # Prepare records for Zoho API
            zoho_update_data = []
            for record in successful_records:
                if record.zoho_id:
                    zoho_update_data.append({
                        "id": record.zoho_id,
                        batch.field_name: record.new_value
                    })
            
            if not zoho_update_data:
                raise ValueError("No records with Zoho IDs found for sync")
            
            # Update batch sync status
            batch.sync_status = "syncing"
            self.db.commit()
            
            # Send to Zoho CRM
            zoho_result = await self.zoho_service.bulk_update_records(zoho_update_data)
            
            # Process results and update sync status
            synced_count = zoho_result.get("success_count", 0)
            
            if zoho_result.get("error_count", 0) > 0:
                batch.sync_status = "sync_partial"
                batch.error_details = zoho_result.get("results")
            else:
                batch.sync_status = "synced"
            
            self.db.commit()
            
            return {
                "batch_id": batch_id,
                "synced_count": synced_count,
                "total_attempted": len(zoho_update_data),
                "errors": zoho_result.get("error_count", 0),
                "status": batch.sync_status
            }
            
        except Exception as e:
            batch = self.db.query(BulkUpdateBatch).filter_by(batch_id=batch_id).first()
            if batch:
                batch.sync_status = "sync_failed"
                batch.error_details = [{"error": str(e)}]
                self.db.commit()
            raise e
    
    def _get_records_by_ids(self, record_ids: List[str]):
        """Get records from database by IDs"""
        return self.db.query(Analysis).filter(Analysis.id.in_(record_ids)).all()
    
    def _get_field_value(self, record, field_name: str):
        """Get current field value from record"""
        return getattr(record, field_name, None)
    
    def _update_record_field(self, record, field_name: str, field_value: Any):
        """Update specific field in record"""
        setattr(record, field_name, field_value)
        record.updated_at = datetime.utcnow()
```

### API Endpoints

```python
# app/api/endpoints/bulk_update.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.deps import get_db
from app.services.bulk_update_service import BulkUpdateService
from app.services.zoho_field_service import ZohoFieldService
from app.schemas.bulk_update import BulkUpdateRequest, BulkUpdateResponse

router = APIRouter()

@router.get("/records")
async def get_all_records(
    page: int = 1,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get paginated list of all CRM records"""
    try:
        offset = (page - 1) * limit
        
        query = db.query(Analysis)
        if search:
            query = query.filter(Analysis.original_filename.contains(search))
        
        total = query.count()
        records = query.offset(offset).limit(limit).all()
        
        return {
            "records": records,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/zoho/fields")
async def get_zoho_fields(
    module: str = "Deals",
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get available fields and their validation rules from Zoho CRM"""
    try:
        field_service = ZohoFieldService()
        fields = await field_service.get_module_fields(module)
        
        return {
            "fields": fields,
            "module": module
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/zoho/field/{field_name}/values")
async def get_field_values(
    field_name: str,
    module: str = "Deals",
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get available values for a picklist field"""
    try:
        field_service = ZohoFieldService()
        values = await field_service.get_field_picklist_values(field_name, module)
        
        return {
            "field_name": field_name,
            "values": values
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-update")
async def bulk_update_records(
    request: BulkUpdateRequest,
    db: Session = Depends(get_db)
) -> BulkUpdateResponse:
    """Update multiple records in local database"""
    try:
        service = BulkUpdateService(db)
        result = await service.execute_bulk_update(
            field_name=request.field_name,
            field_value=request.field_value,
            record_ids=request.record_ids,
            updated_by=request.updated_by
        )
        
        return BulkUpdateResponse(
            status="success",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-to-crm")
async def sync_updates_to_crm(
    batch_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Push updates to Zoho CRM"""
    try:
        service = BulkUpdateService(db)
        
        # Run sync in background
        background_tasks.add_task(service.sync_to_crm, batch_id)
        
        return {
            "status": "success",
            "message": "CRM sync started in background",
            "batch_id": batch_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batch/{batch_id}/status")
async def get_batch_status(
    batch_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get bulk update batch status"""
    try:
        batch = db.query(BulkUpdateBatch).filter_by(batch_id=batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        return {
            "batch_id": batch_id,
            "status": batch.status,
            "sync_status": batch.sync_status,
            "total_records": batch.total_records,
            "successful_updates": batch.successful_updates,
            "failed_updates": batch.failed_updates,
            "created_at": batch.created_at,
            "updated_at": batch.updated_at,
            "error_details": batch.error_details
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 🎨 Frontend Implementation

### Main Bulk Update Page

```tsx
// src/pages/BulkUpdate.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { RecordSelectionTable } from '@/components/bulk-update/RecordSelectionTable';
import { FieldSelector } from '@/components/bulk-update/FieldSelector';
import { ValueInput } from '@/components/bulk-update/ValueInput';
import { UpdateConfirmation } from '@/components/bulk-update/UpdateConfirmation';
import { SyncStatus } from '@/components/bulk-update/SyncStatus';
import { bulkUpdateApi } from '@/services/bulkUpdateApi';

export default function BulkUpdate() {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [updateBatchId, setUpdateBatchId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['bulk-update-records'],
    queryFn: () => bulkUpdateApi.getAllRecords()
  });

  // Fetch available fields
  const { data: fieldsData, isLoading: fieldsLoading } = useQuery({
    queryKey: ['zoho-fields'],
    queryFn: () => bulkUpdateApi.getZohoFields()
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateApi.bulkUpdateRecords,
    onSuccess: (data) => {
      setUpdateBatchId(data.batch_id);
      toast({
        title: "Update Successful",
        description: `Updated ${data.successful_updates} records successfully`
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Sync to CRM mutation
  const syncToCRMMutation = useMutation({
    mutationFn: (batchId: string) => bulkUpdateApi.syncToCRM(batchId),
    onSuccess: (data) => {
      toast({
        title: "Sync Started",
        description: "CRM sync has been initiated in the background"
      });
    }
  });

  const handleBulkUpdate = () => {
    if (!selectedField || fieldValue === null || selectedRecords.length === 0) {
      toast({
        title: "Invalid Selection",
        description: "Please select field, value, and records",
        variant: "destructive"
      });
      return;
    }

    setShowConfirmation(true);
  };

  const confirmUpdate = () => {
    bulkUpdateMutation.mutate({
      field_name: selectedField!,
      field_value: fieldValue,
      record_ids: selectedRecords,
      updated_by: 'current_user' // Get from auth context
    });
    setShowConfirmation(false);
  };

  const handleSyncToCRM = () => {
    if (updateBatchId) {
      syncToCRMMutation.mutate(updateBatchId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Update Records</h1>
        <p className="text-muted-foreground">
          Select multiple records and update a field value across all of them
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={selectedField ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">1. Select Field</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {selectedField ? `Selected: ${selectedField}` : "Choose field to update"}
            </p>
          </CardContent>
        </Card>

        <Card className={fieldValue !== null ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">2. Set Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {fieldValue !== null ? `Value: ${fieldValue}` : "Enter new value"}
            </p>
          </CardContent>
        </Card>

        <Card className={selectedRecords.length > 0 ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">3. Select Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {selectedRecords.length} records selected
            </p>
          </CardContent>
        </Card>

        <Card className={updateBatchId ? "border-green-500" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">4. Update & Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {updateBatchId ? "Ready to sync" : "Pending update"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Field to Update</CardTitle>
          <CardDescription>
            Choose which field you want to update across multiple records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSelector
            fields={fieldsData?.fields || []}
            selectedField={selectedField}
            onFieldSelect={setSelectedField}
            isLoading={fieldsLoading}
          />
        </CardContent>
      </Card>

      {/* Value Input */}
      {selectedField && (
        <Card>
          <CardHeader>
            <CardTitle>Set New Value</CardTitle>
            <CardDescription>
              Enter the new value for the selected field
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValueInput
              fieldName={selectedField}
              value={fieldValue}
              onChange={setFieldValue}
              fieldsData={fieldsData}
            />
          </CardContent>
        </Card>
      )}

      {/* Record Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Records to Update</CardTitle>
          <CardDescription>
            Choose which records you want to update with the new value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordSelectionTable
            records={recordsData?.records || []}
            selectedRecords={selectedRecords}
            onSelectionChange={setSelectedRecords}
            isLoading={recordsLoading}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleBulkUpdate}
          disabled={!selectedField || fieldValue === null || selectedRecords.length === 0 || bulkUpdateMutation.isPending}
          className="min-w-[200px]"
        >
          {bulkUpdateMutation.isPending ? "Updating..." : `Update ${selectedRecords.length} Records`}
        </Button>

        {updateBatchId && (
          <Button
            variant="outline"
            onClick={handleSyncToCRM}
            disabled={syncToCRMMutation.isPending}
            className="min-w-[200px]"
          >
            {syncToCRMMutation.isPending ? "Syncing..." : "Sync to CRM"}
          </Button>
        )}
      </div>

      {/* Update Status */}
      {updateBatchId && (
        <SyncStatus
          batchId={updateBatchId}
          onRefresh={() => {
            // Refresh status logic
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <UpdateConfirmation
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmUpdate}
        fieldName={selectedField}
        fieldValue={fieldValue}
        recordCount={selectedRecords.length}
      />
    </div>
  );
}
```

### Field Selector Component

```tsx
// src/components/bulk-update/FieldSelector.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ZohoField } from '@/types/bulkUpdate';

interface FieldSelectorProps {
  fields: ZohoField[];
  selectedField: string | null;
  onFieldSelect: (fieldName: string) => void;
  isLoading: boolean;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  fields,
  selectedField,
  onFieldSelect,
  isLoading
}) => {
  const updatableFields = fields.filter(field => 
    !field.is_read_only && 
    !field.is_system_field
  );

  if (isLoading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded" />;
  }

  return (
    <div className="space-y-4">
      <Select value={selectedField || ""} onValueChange={onFieldSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a field to update" />
        </SelectTrigger>
        <SelectContent>
          {updatableFields.map((field) => (
            <SelectItem key={field.api_name} value={field.api_name}>
              <div className="flex items-center justify-between w-full">
                <span>{field.display_label}</span>
                <div className="flex gap-1 ml-2">
                  <Badge variant="outline" className="text-xs">
                    {field.data_type}
                  </Badge>
                  {field.is_required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {field.has_picklist && (
                    <Badge variant="secondary" className="text-xs">
                      Picklist
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedField && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected field: <strong>{fields.find(f => f.api_name === selectedField)?.display_label}</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Type: {fields.find(f => f.api_name === selectedField)?.data_type}
          </p>
        </div>
      )}
    </div>
  );
};
```

### Value Input Component

```tsx
// src/components/bulk-update/ValueInput.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { bulkUpdateApi } from '@/services/bulkUpdateApi';

interface ValueInputProps {
  fieldName: string;
  value: any;
  onChange: (value: any) => void;
  fieldsData: any;
}

export const ValueInput: React.FC<ValueInputProps> = ({
  fieldName,
  value,
  onChange,
  fieldsData
}) => {
  const field = fieldsData?.fields?.find((f: any) => f.api_name === fieldName);
  
  // Fetch picklist values if needed
  const { data: picklistValues } = useQuery({
    queryKey: ['field-values', fieldName],
    queryFn: () => bulkUpdateApi.getFieldValues(fieldName),
    enabled: field?.has_picklist
  });

  if (!field) {
    return <div>Please select a field first</div>;
  }

  // Render different input types based on field data type
  switch (field.data_type) {
    case 'picklist':
      return (
        <div className="space-y-2">
          <Label>Select Value</Label>
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a value" />
            </SelectTrigger>
            <SelectContent>
              {picklistValues?.values?.map((option: any) => (
                <SelectItem key={option.actual_value} value={option.actual_value}>
                  {option.display_value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'boolean':
      return (
        <div className="space-y-2">
          <Label>Value</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label>{value ? 'True' : 'False'}</Label>
          </div>
        </div>
      );

    case 'textarea':
    case 'text':
      if (field.max_length && field.max_length > 255) {
        return (
          <div className="space-y-2">
            <Label>Value</Label>
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${field.display_label.toLowerCase()}`}
              maxLength={field.max_length}
            />
            {field.max_length && (
              <p className="text-xs text-muted-foreground">
                {(value || '').length} / {field.max_length} characters
              </p>
            )}
          </div>
        );
      }
      // Fall through to default input

    case 'number':
    case 'currency':
    case 'integer':
      return (
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            type={field.data_type === 'number' || field.data_type === 'currency' || field.data_type === 'integer' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => {
              const newValue = field.data_type === 'number' || field.data_type === 'currency' || field.data_type === 'integer' 
                ? parseFloat(e.target.value) || 0
                : e.target.value;
              onChange(newValue);
            }}
            placeholder={`Enter ${field.display_label.toLowerCase()}`}
            maxLength={field.max_length}
          />
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case 'datetime':
      return (
        <div className="space-y-2">
          <Label>Date & Time</Label>
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.display_label.toLowerCase()}`}
            maxLength={field.max_length}
          />
        </div>
      );
  }
};
```

### Record Selection Table Component

```tsx
// src/components/bulk-update/RecordSelectionTable.tsx
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecordSelectionTableProps {
  records: any[];
  selectedRecords: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  isLoading: boolean;
}

export const RecordSelectionTable: React.FC<RecordSelectionTableProps> = ({
  records,
  selectedRecords,
  onSelectionChange,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  // Filter records based on search term
  const filteredRecords = records.filter(record =>
    record.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered records
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedRecords.map(record => record.id);
      const newSelection = [...new Set([...selectedRecords, ...allIds])];
      onSelectionChange(newSelection);
    } else {
      const pageIds = paginatedRecords.map(record => record.id);
      const newSelection = selectedRecords.filter(id => !pageIds.includes(id));
      onSelectionChange(newSelection);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedRecords, recordId]);
    } else {
      onSelectionChange(selectedRecords.filter(id => id !== recordId));
    }
  };

  const isAllSelected = paginatedRecords.length > 0 && 
    paginatedRecords.every(record => selectedRecords.includes(record.id));

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded" />;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedRecords.length} of {filteredRecords.length} selected
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Value (SGD)</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={(checked) => 
                      handleSelectRecord(record.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {record.original_filename || record.name}
                </TableCell>
                <TableCell>{record.account_name}</TableCell>
                <TableCell>
                  {record.total_value ? `SGD ${(record.total_value / 1000).toFixed(0)}K` : '-'}
                </TableCell>
                <TableCell>{record.stage || '-'}</TableCell>
                <TableCell>
                  {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, filteredRecords.length)} of {filteredRecords.length} records
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🧪 Testing Implementation

### Backend Tests

```python
# tests/test_bulk_update_service.py
import pytest
from unittest.mock import Mock, patch
from app.services.bulk_update_service import BulkUpdateService
from app.models.bulk_update import BulkUpdateBatch

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def bulk_update_service(mock_db):
    return BulkUpdateService(mock_db)

@pytest.mark.asyncio
async def test_execute_bulk_update_success(bulk_update_service):
    """Test successful bulk update execution"""
    # Setup
    field_name = "stage"
    field_value = "Proposal"
    record_ids = ["1", "2", "3"]
    updated_by = "test_user"
    
    # Mock records
    mock_records = [Mock(id="1"), Mock(id="2"), Mock(id="3")]
    bulk_update_service._get_records_by_ids = Mock(return_value=mock_records)
    bulk_update_service._get_field_value = Mock(return_value="Qualification")
    bulk_update_service._update_record_field = Mock()
    
    # Execute
    result = await bulk_update_service.execute_bulk_update(
        field_name, field_value, record_ids, updated_by
    )
    
    # Assert
    assert result["successful_updates"] == 3
    assert result["failed_updates"] == 0
    assert result["status"] == "completed"

@pytest.mark.asyncio
async def test_sync_to_crm_success(bulk_update_service):
    """Test successful CRM sync"""
    batch_id = "test-batch-123"
    
    # Mock batch and records
    mock_batch = Mock()
    mock_batch.field_name = "stage"
    mock_records = [Mock(zoho_id="zoho1", new_value="Proposal")]
    
    bulk_update_service.db.query.return_value.filter_by.return_value.first.return_value = mock_batch
    bulk_update_service.db.query.return_value.filter_by.return_value.all.return_value = mock_records
    
    # Mock Zoho service
    bulk_update_service.zoho_service.bulk_update_records = Mock(return_value={
        "success_count": 1,
        "error_count": 0
    })
    
    # Execute
    result = await bulk_update_service.sync_to_crm(batch_id)
    
    # Assert
    assert result["synced_count"] == 1
    assert result["errors"] == 0
    assert result["status"] == "synced"

def test_get_system_fields(bulk_update_service):
    """Test system fields exclusion"""
    from app.services.zoho_field_service import ZohoFieldService
    
    service = ZohoFieldService()
    system_fields = service._get_system_fields()
    
    assert "id" in system_fields
    assert "Created_Time" in system_fields
    assert "Modified_Time" in system_fields
    assert "Owner" in system_fields
```

### Frontend Tests

```javascript
// tests/bulk-update.spec.js
import { test, expect } from '@playwright/test';

test.describe('Bulk Update System', () => {
  test('should complete full bulk update workflow', async ({ page }) => {
    await page.goto('/bulk-update');
    
    // Check page header
    await expect(page.locator('h1')).toContainText('Bulk Update Records');
    
    // Step 1: Select field
    await page.locator('[data-testid="field-selector"]').click();
    await page.locator('text=Stage').click();
    
    // Step 2: Set value
    await page.locator('[data-testid="value-input"]').fill('Proposal');
    
    // Step 3: Select records
    await page.locator('[data-testid="select-all-checkbox"]').check();
    
    // Step 4: Execute update
    await page.locator('button:has-text("Update")').click();
    
    // Confirm update
    await page.locator('[data-testid="confirm-update-button"]').click();
    
    // Check success message
    await expect(page.locator('.toast')).toContainText('Update Successful');
    
    // Verify sync button appears
    await expect(page.locator('button:has-text("Sync to CRM")')).toBeVisible();
  });
  
  test('should validate field selection', async ({ page }) => {
    await page.goto('/bulk-update');
    
    // Try to update without selecting field
    await page.locator('button:has-text("Update")').click();
    
    // Check error message
    await expect(page.locator('.toast')).toContainText('Please select field');
  });
  
  test('should handle picklist fields correctly', async ({ page }) => {
    await page.goto('/bulk-update');
    
    // Select picklist field
    await page.locator('[data-testid="field-selector"]').click();
    await page.locator('text=Priority').click();
    
    // Check that dropdown appears for value input
    await expect(page.locator('[data-testid="picklist-selector"]')).toBeVisible();
    
    // Select value from dropdown
    await page.locator('[data-testid="picklist-selector"]').click();
    await page.locator('text=High').click();
    
    // Verify value is selected
    await expect(page.locator('[data-testid="selected-value"]')).toContainText('High');
  });
  
  test('should sync updates to CRM', async ({ page }) => {
    await page.goto('/bulk-update');
    
    // Complete update process (assuming previous test setup)
    // ... (field selection, value input, record selection, update execution)
    
    // Click sync to CRM
    await page.locator('button:has-text("Sync to CRM")').click();
    
    // Check sync started message
    await expect(page.locator('.toast')).toContainText('Sync Started');
    
    // Verify sync status is shown
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
  });
  
  test('should handle large record sets with pagination', async ({ page }) => {
    await page.goto('/bulk-update');
    
    // Check pagination controls
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Test search functionality
    await page.locator('[data-testid="search-input"]').fill('test');
    
    // Verify records are filtered
    await expect(page.locator('[data-testid="records-table"] tbody tr')).toHaveCount(1);
    
    // Test record selection across pages
    await page.locator('[data-testid="select-all-checkbox"]').check();
    await page.locator('button:has-text("Next")').click();
    
    // Verify selection is maintained
    await expect(page.locator('[data-testid="selection-count"]')).toContainText('selected');
  });
});
```

## 📋 Implementation Checklist

### Backend Implementation ✅
- [ ] Create bulk update database models with proper indexes
- [ ] Implement Alembic migration for bulk update tables
- [ ] Build ZohoFieldService for field metadata and validation
- [ ] Create ZohoBulkUpdateService for CRM API integration
- [ ] Implement BulkUpdateService with error handling
- [ ] Create comprehensive API endpoints
- [ ] Add background task processing for CRM sync
- [ ] Write unit tests for all services
- [ ] Add proper logging and monitoring

### Frontend Implementation ✅
- [ ] Build main BulkUpdate page with step-by-step UI
- [ ] Create FieldSelector component with validation
- [ ] Implement ValueInput component with data type handling
- [ ] Build RecordSelectionTable with search and pagination
- [ ] Add UpdateConfirmation dialog
- [ ] Create SyncStatus component with real-time updates
- [ ] Implement proper error handling and user feedback
- [ ] Write E2E tests for complete workflow
- [ ] Add loading states and progress indicators

### Integration & Testing ✅
- [ ] Test Zoho CRM field metadata fetching
- [ ] Verify picklist value retrieval
- [ ] Test bulk update API with various data types
- [ ] Validate CRM sync with real Zoho account
- [ ] Test error handling for API failures
- [ ] Verify transaction rollback on failures
- [ ] Test performance with large record sets
- [ ] Validate audit trail accuracy

## 🚀 Advanced Features (Future Enhancements)

### Batch Management
- **Scheduled Updates**: Allow users to schedule bulk updates for later execution
- **Update Templates**: Save commonly used field/value combinations
- **Approval Workflow**: Require approval for large bulk updates
- **Update History**: Detailed audit trail with rollback capabilities

### Enhanced Validation
- **Cross-field Validation**: Validate field combinations and dependencies
- **Business Rules**: Apply custom business logic during updates
- **Data Quality Checks**: Validate data integrity before CRM sync
- **Preview Mode**: Show exactly what will change before execution

### Performance Optimization
- **Incremental Sync**: Only sync changed records to CRM
- **Compression**: Compress large update batches
- **Parallel Processing**: Process multiple batches simultaneously
- **Caching**: Cache field metadata and validation rules

## 🎯 Success Metrics

### Performance Metrics
- **Update Speed**: Process 1000+ records in < 30 seconds
- **CRM Sync**: Complete sync in < 2 minutes for 500 records
- **Error Rate**: < 2% failed updates under normal conditions
- **User Experience**: Complete workflow in < 3 minutes

### Business Impact
- **Time Savings**: 90% reduction in manual update time
- **Data Accuracy**: Eliminate manual data entry errors
- **Compliance**: Full audit trail for regulatory requirements
- **Productivity**: Enable bulk operations for sales team

Usage: `/implement-bulk-update [component]` where component is `backend`, `frontend`, `integration`, or `full`