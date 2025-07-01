import * as React from "react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, row: T, index: number) => React.ReactNode
  sortable?: boolean
  className?: string
  numeric?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  onRowClick?: (row: T, index: number) => void
}

function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  loading = false, 
  emptyMessage = "No data available",
  className,
  onRowClick,
  ...props 
}: DataTableProps<T>) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg border", className)} {...props}>
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      )}
      
      <table className="pp-table">
        <thead className="pp-table__header">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={String(column.key) + index}
                className={cn(
                  "pp-table__header-cell",
                  column.numeric && "text-right",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="pp-table__cell text-center py-8 text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={cn(
                  "pp-table__row",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((column, colIndex) => {
                  const value = column.key.toString().includes('.') 
                    ? column.key.toString().split('.').reduce((obj, key) => obj?.[key], row)
                    : row[column.key as keyof T]
                  
                  return (
                    <td 
                      key={String(column.key) + colIndex}
                      className={cn(
                        "pp-table__cell",
                        column.numeric && "pp-table__cell--numeric",
                        column.className
                      )}
                    >
                      {column.render ? column.render(value, row, rowIndex) : value}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export { DataTable }