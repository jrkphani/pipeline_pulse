import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RecordSelectionTable } from '@/components/bulk-update/RecordSelectionTable';
import { FieldSelector } from '@/components/bulk-update/FieldSelector';
import { ValueInput } from '@/components/bulk-update/ValueInput';
import { UpdateConfirmation } from '@/components/bulk-update/UpdateConfirmation';
import { SyncStatus } from '@/components/bulk-update/SyncStatus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkUpdateApi } from '@/services/bulkUpdateApi';
import { AlertCircle, CheckCircle, Clock, Upload } from 'lucide-react';

export default function BulkUpdate() {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [updateBatchId, setUpdateBatchId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all records with pagination
  const { data: recordsData, isLoading: recordsLoading, error: recordsError } = useQuery({
    queryKey: ['bulk-update-records'],
    queryFn: () => bulkUpdateApi.getAllRecords(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch available fields from Zoho CRM
  const { data: fieldsData, isLoading: fieldsLoading, error: fieldsError } = useQuery({
    queryKey: ['zoho-fields'],
    queryFn: () => bulkUpdateApi.getZohoFields(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateApi.bulkUpdateRecords,
    onSuccess: (data) => {
      setUpdateBatchId(data.batch_id);
      queryClient.invalidateQueries({ queryKey: ['bulk-update-records'] });
      toast({
        title: "✅ Update Successful",
        description: `Updated ${data.successful_updates} records successfully. ${data.failed_updates > 0 ? `${data.failed_updates} records failed.` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update Failed",
        description: error.response?.data?.detail || error.message,
        variant: "destructive"
      });
    }
  });

  // Sync to CRM mutation
  const syncToCRMMutation = useMutation({
    mutationFn: (batchId: string) => bulkUpdateApi.syncToCRM(batchId),
    onSuccess: (data) => {
      toast({
        title: "🔄 Sync Started",
        description: `Started syncing ${data.total_attempted || 'records'} to Zoho CRM`,
      });
      // Start polling for sync status
      const pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['batch-status', updateBatchId] });
      }, 3000);
      
      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Sync Failed",
        description: error.response?.data?.detail || error.message,
        variant: "destructive"
      });
    }
  });

  const handleBulkUpdate = () => {
    if (!selectedField || fieldValue === null || selectedRecords.length === 0) {
      toast({
        title: "⚠️ Invalid Selection",
        description: "Please select a field, enter a value, and choose records to update",
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
      updated_by: 'current_user' // TODO: Get from auth context
    });
    setShowConfirmation(false);
  };

  const handleSyncToCRM = () => {
    if (updateBatchId) {
      syncToCRMMutation.mutate(updateBatchId);
    }
  };

  const resetForm = () => {
    setSelectedRecords([]);
    setSelectedField(null);
    setFieldValue(null);
    setUpdateBatchId(null);
  };

  // Progress indicator component
  const ProgressStep = ({ step, title, description, isActive, isCompleted }: any) => (
    <Card className={`transition-all ${isCompleted ? "border-green-500 bg-green-50" : isActive ? "border-blue-500 bg-blue-50" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {isCompleted ? <CheckCircle className="w-4 h-4 text-green-600" /> : 
           isActive ? <Clock className="w-4 h-4 text-blue-600" /> : 
           <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
          {step}. {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Update Records</h1>
        <p className="text-muted-foreground">
          Select multiple CRM records and update a field value across all of them
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ProgressStep
          step={1}
          title="Select Field"
          description={selectedField ? `Selected: ${fieldsData?.fields?.find((f: any) => f.api_name === selectedField)?.display_label}` : "Choose field to update"}
          isActive={!selectedField}
          isCompleted={!!selectedField}
        />
        <ProgressStep
          step={2}
          title="Set Value"
          description={fieldValue !== null ? `Value: ${fieldValue}` : "Enter new value"}
          isActive={!!selectedField && fieldValue === null}
          isCompleted={fieldValue !== null}
        />
        <ProgressStep
          step={3}
          title="Select Records"
          description={`${selectedRecords.length} records selected`}
          isActive={fieldValue !== null && selectedRecords.length === 0}
          isCompleted={selectedRecords.length > 0}
        />
        <ProgressStep
          step={4}
          title="Update & Sync"
          description={updateBatchId ? "Ready to sync to CRM" : "Pending update"}
          isActive={selectedRecords.length > 0 && !updateBatchId}
          isCompleted={!!updateBatchId}
        />
      </div>

      {/* Error States */}
      {(recordsError || fieldsError) && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {recordsError ? "Failed to load records. " : ""}
              {fieldsError ? "Failed to load fields from Zoho CRM. " : ""}
              Please check your connection and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Field to Update</CardTitle>
          <CardDescription>
            Choose which field you want to update across multiple records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSelector
            fields={fieldsData?.fields || []}
            selectedField={selectedField}
            onFieldSelect={(field) => {
              setSelectedField(field);
              setFieldValue(null); // Reset value when field changes
            }}
            isLoading={fieldsLoading}
          />
        </CardContent>
      </Card>

      {/* Value Input */}
      {selectedField && (
        <Card>
          <CardHeader>
            <CardTitle>2. Set New Value</CardTitle>
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
          <CardTitle>3. Select Records to Update</CardTitle>
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
            fieldToUpdate={selectedField}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleBulkUpdate}
          disabled={!selectedField || fieldValue === null || selectedRecords.length === 0 || bulkUpdateMutation.isPending}
          className="min-w-[200px]"
          size="lg"
        >
          {bulkUpdateMutation.isPending ? (
            <><Clock className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
          ) : (
            `Update ${selectedRecords.length} Records`
          )}
        </Button>

        {updateBatchId && (
          <Button
            variant="outline"
            onClick={handleSyncToCRM}
            disabled={syncToCRMMutation.isPending}
            className="min-w-[200px]"
            size="lg"
          >
            {syncToCRMMutation.isPending ? (
              <><Upload className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Sync to CRM</>
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={resetForm}
          disabled={bulkUpdateMutation.isPending || syncToCRMMutation.isPending}
        >
          Reset Form
        </Button>
      </div>

      {/* Update Status */}
      {updateBatchId && (
        <SyncStatus
          batchId={updateBatchId}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['batch-status', updateBatchId] });
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
        fieldLabel={fieldsData?.fields?.find((f: any) => f.api_name === selectedField)?.display_label}
      />
    </div>
  );
}
