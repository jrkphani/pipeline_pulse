import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FieldInfo {
  api_name: string;
  field_label: string;
  data_type: string;
  custom_field: boolean;
  mandatory: boolean;
  read_only: boolean;
}

interface ModuleFields {
  total_fields: number;
  custom_fields_count: number;
  standard_fields_count: number;
  custom_fields: FieldInfo[];
  important_standard_fields: FieldInfo[];
  all_standard_fields: FieldInfo[];
  error?: string;
}

interface DiscoveryResults {
  user_email: string;
  discovery_timestamp: string;
  modules: Record<string, ModuleFields>;
  summary: {
    modules_discovered: number;
    total_custom_fields: number;
    priority_modules: string[];
  };
}

export function FieldDiscoveryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiscoveryResults | null>(null);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState('Deals');

  const discoverFields = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/auth/zoho/fields', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover fields');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `zoho_fields_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderFieldTable = (fields: FieldInfo[], title: string) => {
    if (!fields || fields.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field Label</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">API Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Properties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fields.map((field, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm">{field.field_label}</td>
                  <td className="px-4 py-2 text-sm font-mono text-xs">{field.api_name}</td>
                  <td className="px-4 py-2 text-sm">
                    <Badge variant="outline">{field.data_type}</Badge>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {field.mandatory && <Badge variant="destructive" className="mr-1">Required</Badge>}
                    {field.read_only && <Badge variant="secondary">Read-only</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Zoho CRM Field Discovery</CardTitle>
          <CardDescription>
            Discover all available fields in your Zoho CRM modules, including custom fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={discoverFields} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Discover Fields
                </>
              )}
            </Button>
            
            {results && (
              <Button variant="outline" onClick={downloadResults}>
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Modules Discovered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{results.summary.modules_discovered}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Custom Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{results.summary.total_custom_fields}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Discovery Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{new Date(results.discovery_timestamp).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={selectedModule} onValueChange={setSelectedModule}>
                <TabsList>
                  {Object.keys(results.modules).map(module => (
                    <TabsTrigger key={module} value={module}>
                      {module}
                      {results.modules[module].custom_fields_count > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {results.modules[module].custom_fields_count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(results.modules).map(([module, data]) => (
                  <TabsContent key={module} value={module}>
                    {data.error ? (
                      <Alert variant="destructive">
                        <AlertDescription>Error: {data.error}</AlertDescription>
                      </Alert>
                    ) : (
                      <div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Fields</p>
                            <p className="text-xl font-semibold">{data.total_fields}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Custom Fields</p>
                            <p className="text-xl font-semibold">{data.custom_fields_count}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Standard Fields</p>
                            <p className="text-xl font-semibold">{data.standard_fields_count}</p>
                          </div>
                        </div>
                        
                        {renderFieldTable(data.custom_fields, 'Custom Fields')}
                        {renderFieldTable(data.important_standard_fields, 'Important Standard Fields')}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}