import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';

interface UpdateConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fieldName: string | null;
  fieldLabel?: string;
  fieldValue: any;
  recordCount: number;
}

export const UpdateConfirmation: React.FC<UpdateConfirmationProps> = ({
  open,
  onClose,
  onConfirm,
  fieldName,
  fieldLabel,
  fieldValue,
  recordCount
}) => {
  const displayValue = () => {
    if (fieldValue === null || fieldValue === undefined) return 'No value';
    if (typeof fieldValue === 'boolean') return fieldValue ? 'True' : 'False';
    if (typeof fieldValue === 'string' && fieldValue.length > 50) {
      return fieldValue.substring(0, 50) + '...';
    }
    return String(fieldValue);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Bulk Update
          </DialogTitle>
          <DialogDescription>
            Please review the details before proceeding with the bulk update.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Update Summary */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You are about to update <strong>{recordCount}</strong> records
            </AlertDescription>
          </Alert>

          {/* Field Details */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-600">Field to Update:</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{fieldLabel || fieldName}</Badge>
                <span className="text-xs text-gray-500">({fieldName})</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">New Value:</label>
              <div className="mt-1 p-2 bg-white border rounded text-sm font-mono">
                {displayValue()}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Records Affected:</label>
              <div className="mt-1">
                <Badge variant="secondary">{recordCount} records</Badge>
              </div>
            </div>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. The current values in the selected field 
              will be replaced with the new value across all {recordCount} selected records.
            </AlertDescription>
          </Alert>

          {/* Next Steps */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              After updating the local database, you'll be able to sync these changes to Zoho CRM.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Confirm Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
