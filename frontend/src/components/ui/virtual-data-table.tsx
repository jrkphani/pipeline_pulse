import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { LoadingSpinner } from './loading-spinner';
import { useVirtualScrolling } from '../../hooks/use-virtual-scrolling';
import { cn } from '../../lib/utils';

export interface VirtualTableColumn<T> {
  key: string;
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string | number;
  sortable?: boolean;
  className?: string;
}

export interface VirtualDataTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  itemHeight?: number;
  containerHeight?: number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  enableVirtualization?: boolean;
  overscan?: number;
}

export function VirtualDataTable<T extends Record<string, any>>({
  data,
  columns,
  itemHeight = 48,
  containerHeight = 400,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  enableVirtualization = true,
  overscan = 10
}: VirtualDataTableProps<T>) {
  
  const { virtualItems, totalHeight, scrollElementRef, isScrolling } = useVirtualScrolling(
    data,
    {
      itemHeight,
      containerHeight,
      overscan,
      enabled: enableVirtualization && data.length > 50
    }
  );

  const getCellValue = (item: T, column: VirtualTableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor];
  };

  const handleRowClick = (item: T, index: number) => {
    if (onRowClick) {
      onRowClick(item, index);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" label="Loading table data" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('pp-virtual-data-table relative', className)}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.className)}
                style={{
                  width: column.width,
                  minWidth: typeof column.width === 'number' ? `${column.width}px` : column.width
                }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        role="grid"
        aria-label="Data table"
        aria-rowcount={data.length}
        aria-busy={isScrolling}
      >
        <div
          style={{ 
            height: totalHeight, 
            position: 'relative',
            width: '100%'
          }}
          role="presentation"
        >
          <Table>
            <TableBody>
              {virtualItems.map(({ index, item, style }) => (
                <TableRow
                  key={index}
                  style={style}
                  className={cn(
                    'absolute w-full border-b transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent/50',
                    isScrolling && 'pointer-events-none'
                  )}
                  onClick={() => handleRowClick(item, index)}
                  role="row"
                  aria-rowindex={index + 2} // +2 because header is row 1
                  tabIndex={onRowClick ? 0 : -1}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                      e.preventDefault();
                      handleRowClick(item, index);
                    }
                  }}
                >
                  {columns.map((column, columnIndex) => (
                    <TableCell
                      key={column.key}
                      className={cn(column.className)}
                      style={{
                        width: column.width,
                        minWidth: typeof column.width === 'number' ? `${column.width}px` : column.width
                      }}
                      role="gridcell"
                      aria-colindex={columnIndex + 1}
                    >
                      {getCellValue(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Scroll indicator for accessibility */}
      {isScrolling && (
        <div 
          className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs"
          role="status"
          aria-live="polite"
        >
          Scrolling...
        </div>
      )}

      {/* Performance info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 bg-background border rounded px-2 py-1 text-xs text-muted-foreground">
          Rendering {virtualItems.length} of {data.length} rows
          {enableVirtualization && data.length > 50 && ' (virtualized)'}
        </div>
      )}
    </div>
  );
}

// Memoized wrapper for better performance
export const MemoizedVirtualDataTable = React.memo(VirtualDataTable) as typeof VirtualDataTable;