import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  GitMerge, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X,
  Copy,
  FileText,
  Clock,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConflictData {
  id: string;
  record_type: string;
  record_id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  created_at: string;
  local_data: Record<string, any>;
  remote_data: Record<string, any>;
  field_conflicts: Array<{
    field: string;
    local_value: any;
    remote_value: any;
  }>;
}

interface ConflictResolverProps {
  conflict: ConflictData;
  onResolve: (resolution: {
    resolution: 'use_local' | 'use_remote' | 'merge' | 'skip';
    merged_data?: Record<string, any>;
  }) => void;
  onClose: () => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  conflict,
  onResolve,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedResolution, setSelectedResolution] = useState<'use_local' | 'use_remote' | 'merge' | 'skip'>('use_local');
  const [mergedData, setMergedData] = useState<Record<string, any>>(conflict.local_data);
  const [customMergeField, setCustomMergeField] = useState<string>('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 border-red-200 bg-red-50';
      case 'medium':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'low':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleFieldValueSelect = (field: string, source: 'local' | 'remote') => {
    const value = source === 'local' ? conflict.local_data[field] : conflict.remote_data[field];
    setMergedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomMerge = (field: string, value: string) => {
    setMergedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const handleResolve = () => {
    const resolution = {
      resolution: selectedResolution,
      ...(selectedResolution === 'merge' && { merged_data: mergedData })
    };
    onResolve(resolution);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <GitMerge className="h-5 w-5 text-orange-500" />
                <CardTitle>Resolve Sync Conflict</CardTitle>
                <Badge variant="destructive" className={getSeverityColor(conflict.severity)}>
                  {conflict.severity.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                {conflict.record_type} • {conflict.record_id}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="compare">Compare Data</TabsTrigger>
                <TabsTrigger value="merge">Merge Fields</TabsTrigger>
                <TabsTrigger value="resolve">Resolve</TabsTrigger>
              </TabsList>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <TabsContent value="overview" className="p-6 space-y-4">
                <Alert className={getSeverityColor(conflict.severity)}>
                  {getSeverityIcon(conflict.severity)}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{conflict.description}</p>
                      <p className="text-sm">
                        Detected {formatDistanceToNow(new Date(conflict.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Local Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Last modified locally</p>
                        <p className="text-xs text-gray-500">
                          {conflict.local_data.last_modified 
                            ? formatDistanceToNow(new Date(conflict.local_data.last_modified), { addSuffix: true })
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GitMerge className="h-4 w-4 text-green-500" />
                        Remote Data (CRM)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Last modified in CRM</p>
                        <p className="text-xs text-gray-500">
                          {conflict.remote_data.last_modified 
                            ? formatDistanceToNow(new Date(conflict.remote_data.last_modified), { addSuffix: true })
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Conflicting Fields</h4>
                  <div className="space-y-2">
                    {conflict.field_conflicts.map((fieldConflict, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{fieldConflict.field}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-blue-600">Local:</span>
                          <code className="bg-white px-2 py-1 rounded border">
                            {formatValue(fieldConflict.local_value)}
                          </code>
                          <span className="text-green-600">Remote:</span>
                          <code className="bg-white px-2 py-1 rounded border">
                            {formatValue(fieldConflict.remote_value)}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="compare" className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-4">
                      <User className="h-4 w-4 text-blue-500" />
                      Local Data
                    </h4>
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded">
                          {JSON.stringify(conflict.local_data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-4">
                      <GitMerge className="h-4 w-4 text-green-500" />
                      Remote Data (CRM)
                    </h4>
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded">
                          {JSON.stringify(conflict.remote_data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="merge" className="p-6 space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Merge Conflicting Fields</h4>
                  <p className="text-sm text-gray-600">
                    Select which value to use for each conflicting field, or provide a custom value.
                  </p>

                  {conflict.field_conflicts.map((fieldConflict, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{fieldConflict.field}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant={mergedData[fieldConflict.field] === fieldConflict.local_value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFieldValueSelect(fieldConflict.field, 'local')}
                            className="justify-start"
                          >
                            <User className="h-4 w-4 mr-2" />
                            Use Local: {formatValue(fieldConflict.local_value)}
                          </Button>
                          <Button
                            variant={mergedData[fieldConflict.field] === fieldConflict.remote_value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFieldValueSelect(fieldConflict.field, 'remote')}
                            className="justify-start"
                          >
                            <GitMerge className="h-4 w-4 mr-2" />
                            Use Remote: {formatValue(fieldConflict.remote_value)}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`custom-${fieldConflict.field}`} className="text-xs text-gray-600">
                            Or provide custom value:
                          </Label>
                          <Textarea
                            id={`custom-${fieldConflict.field}`}
                            placeholder="Enter custom value..."
                            value={customMergeField === fieldConflict.field ? 
                              formatValue(mergedData[fieldConflict.field]) : ''}
                            onChange={(e) => {
                              setCustomMergeField(fieldConflict.field);
                              handleCustomMerge(fieldConflict.field, e.target.value);
                            }}
                            className="min-h-[60px]"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resolve" className="p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Choose Resolution Strategy</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedResolution === 'use_local' ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedResolution('use_local')}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          Use Local Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Keep the local version and overwrite the remote data in CRM.
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedResolution === 'use_remote' ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedResolution('use_remote')}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GitMerge className="h-4 w-4 text-green-500" />
                          Use Remote Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Accept the CRM version and update the local data.
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedResolution === 'merge' ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedResolution('merge')}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-500" />
                          Use Merged Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Use the custom merged data you configured above.
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedResolution === 'skip' ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedResolution('skip')}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          Skip for Now
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Skip this conflict and resolve it later.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleResolve}>
                    <Check className="h-4 w-4 mr-2" />
                    Apply Resolution
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};