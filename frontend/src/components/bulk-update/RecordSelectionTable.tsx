import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, CheckSquare, Square, AlertCircle } from 'lucide-react';

interface Record {
  id: string;
  opportunity_name: string;
  account_name: string;
  stage: string;
  owner: string;
  amount: number;
  currency: string;
  closing_date: string;
  [key: string]: any;
}

interface RecordSelectionTableProps {
  records: Record[];
  selectedRecords: string[];
  onSelectionChange: (recordIds: string[]) => void;
  isLoading: boolean;
  fieldToUpdate?: string | null;
}

export const RecordSelectionTable: React.FC<RecordSelectionTableProps> = ({
  records,
  selectedRecords,
  onSelectionChange,
  isLoading,
  fieldToUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  const filteredRecords = records.filter(record =>
    record.opportunity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handleSelectAll = () => {
    if (selectedRecords.length === paginatedRecords.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(paginatedRecords.map(record => record.id));
    }
  };

  const handleSelectRecord = (recordId: string) => {
    if (selectedRecords.includes(recordId)) {
      onSelectionChange(selectedRecords.filter(id => id !== recordId));
    } else {
      onSelectionChange([...selectedRecords, recordId]);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No records found. Please check your data source or try refreshing.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by opportunity name, account, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSelectAll}
          disabled={paginatedRecords.length === 0}
        >
          {selectedRecords.length === paginatedRecords.length ? (
            <><CheckSquare className="w-4 h-4 mr-2" /> Deselect All</>
          ) : (
            <><Square className="w-4 h-4 mr-2" /> Select All</>
          )}
        </Button>
      </div>

      {/* Selection Summary */}
      {selectedRecords.length > 0 && (
        <Alert>
          <CheckSquare className="h-4 w-4" />
          <AlertDescription>
            <strong>{selectedRecords.length}</strong> records selected for update
            {fieldToUpdate && ` (${fieldToUpdate} will be updated)`}
          </AlertDescription>
        </Alert>
      )}

      {/* Records Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRecords.length === paginatedRecords.length && paginatedRecords.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Close Date</TableHead>
              {fieldToUpdate && <TableHead>Current {fieldToUpdate}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => (
              <TableRow 
                key={record.id}
                className={selectedRecords.includes(record.id) ? "bg-blue-50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={() => handleSelectRecord(record.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="max-w-xs truncate">
                    {record.opportunity_name || 'Unnamed Opportunity'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {record.account_name || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(record.amount, record.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {record.stage || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {record.owner || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(record.closing_date)}
                </TableCell>
                {fieldToUpdate && (
                  <TableCell>
                    <div className="max-w-xs truncate text-gray-600">
                      {record[fieldToUpdate] || '-'}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {Math.min(filteredRecords.length, (currentPage - 1) * recordsPerPage + 1)} to{' '}
            {Math.min(filteredRecords.length, currentPage * recordsPerPage)} of{' '}
            {filteredRecords.length} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        {searchTerm && (
          <p>Found {filteredRecords.length} records matching "{searchTerm}"</p>
        )}
        <p>Total: {records.length} records available</p>
      </div>
    </div>
  );
};
