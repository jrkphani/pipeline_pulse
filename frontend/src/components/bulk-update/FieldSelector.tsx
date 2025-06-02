import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ZohoField } from '@/types/bulkUpdate';
import { AlertCircle, CheckCircle } from 'lucide-react';

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
    !field.is_read_only && !field.is_system_field
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse h-10 bg-gray-200 rounded" />
        <div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  if (updatableFields.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No updatable fields found. Please check your Zoho CRM permissions.
        </AlertDescription>
      </Alert>
    );
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
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{fields.find(f => f.api_name === selectedField)?.display_label}</strong> selected.
            Type: {fields.find(f => f.api_name === selectedField)?.data_type}
            {fields.find(f => f.api_name === selectedField)?.has_picklist && " (will show available options)"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
