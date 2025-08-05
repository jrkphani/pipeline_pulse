import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  loading?: boolean;
  emptyStateMessage?: string;
  onRowClick?: (item: T) => void;
  striped?: boolean;
  hoverable?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  loading = false,
  emptyStateMessage = 'No data available',
  onRowClick,
  striped = false,
  hoverable = true,
  ...props
}: DataTableProps<T>) {
  const getCellValue = (item: T, column: Column<T>) => {
    if (column.accessor) {
      return column.accessor(item);
    }
    return item[column.key as keyof T];
  };

  if (loading) {
    return (
      <div className={cn('pp-data-table', className)} {...props}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={`header-${index}`}
                  className={column.className}
                  style={{
                    width: column.width,
                    fontSize: 'var(--pp-font-size-xs)',
                    fontWeight: 'var(--pp-font-weight-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--pp-color-neutral-600)',
                  }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                {columns.map((_, colIndex) => (
                  <TableCell key={`skeleton-cell-${colIndex}`}>
                    <div
                      className="animate-pulse bg-muted rounded"
                      style={{
                        height: '1rem',
                        width: `${Math.random() * 40 + 60}%`,
                      }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn('pp-data-table', className)} {...props}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={`header-${index}`}
                  className={column.className}
                  style={{
                    width: column.width,
                    fontSize: 'var(--pp-font-size-xs)',
                    fontWeight: 'var(--pp-font-weight-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--pp-color-neutral-600)',
                  }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <div
          className="flex items-center justify-center text-center"
          style={{
            padding: 'var(--pp-space-12) var(--pp-space-6)',
            color: 'var(--pp-color-neutral-500)',
            fontSize: 'var(--pp-font-size-sm)',
          }}
        >
          {emptyStateMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('pp-data-table', className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={`header-${index}`}
                className={column.className}
                style={{
                  width: column.width,
                  fontSize: 'var(--pp-font-size-xs)',
                  fontWeight: 'var(--pp-font-weight-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--pp-color-neutral-600)',
                }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={index}
              className={cn(
                onRowClick && 'cursor-pointer',
                striped && index % 2 === 1 && 'bg-muted/30',
                hoverable && 'hover:bg-accent/50'
              )}
              style={{
                height: 'var(--pp-table-row-height)',
                transition: `background-color var(--pp-duration-fast) var(--pp-ease-out)`,
              }}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, colIndex) => (
                <TableCell
                  key={`cell-${index}-${colIndex}`}
                  className={column.className}
                  style={{
                    fontSize: 'var(--pp-font-size-sm)',
                    padding: 'var(--pp-table-cell-padding-y) var(--pp-table-cell-padding-x)',
                  }}
                >
                  {getCellValue(item, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}