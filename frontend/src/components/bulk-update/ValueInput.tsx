import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { bulkUpdateApi } from '@/services/bulkUpdateApi';
import { Loader2, AlertCircle } from 'lucide-react';

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
  const { data: picklistValues, isLoading: picklistLoading, error: picklistError } = useQuery({
    queryKey: ['field-values', fieldName],
    queryFn: () => bulkUpdateApi.getFieldValues(fieldName),
    enabled: field?.has_picklist,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (!field) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please select a field first</AlertDescription>
      </Alert>
    );
  }

  // Handle picklist fields
  if (field.has_picklist) {
    if (picklistLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading field options...</span>
        </div>
      );
    }

    if (picklistError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load field options. Please try again or contact support.
          </AlertDescription>
        </Alert>
      );
    }

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
        <p className="text-xs text-muted-foreground">
          {picklistValues?.values?.length || 0} options available
        </p>
      </div>
    );
  }

  // Handle different data types
  switch (field.data_type) {
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
      return (
        <div className="space-y-2">
          <Label>Value</Label>
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.display_label.toLowerCase()}`}
            maxLength={field.max_length}
            rows={4}
          />
          {field.max_length && (
            <p className="text-xs text-muted-foreground">
              {(value || '').length} / {field.max_length} characters
            </p>
          )}
        </div>
      );

    case 'number':
    case 'currency':
    case 'integer':
      return (
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => {
              const newValue = field.data_type === 'integer' 
                ? parseInt(e.target.value) || 0
                : parseFloat(e.target.value) || 0;
              onChange(newValue);
            }}
            placeholder={`Enter ${field.display_label.toLowerCase()}`}
            step={field.data_type === 'integer' ? 1 : 0.01}
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
          {field.max_length && (
            <p className="text-xs text-muted-foreground">
              Max {field.max_length} characters
            </p>
          )}
        </div>
      );
  }
};
