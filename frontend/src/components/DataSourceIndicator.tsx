import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Info, Database, RefreshCw } from 'lucide-react'

interface DataSourceIndicatorProps {
  source: 'pipeline' | 'o2r' | 'analysis'
  currencyNote?: string
  lastSync?: string
  className?: string
}

export function DataSourceIndicator({ 
  source, 
  currencyNote, 
  lastSync, 
  className 
}: DataSourceIndicatorProps) {
  const getSourceInfo = () => {
    switch (source) {
      case 'pipeline':
        return {
          label: 'Pipeline Data',
          description: 'Original uploaded data with mixed currencies',
          color: 'bg-blue-100 text-blue-800',
          icon: <Database className="h-3 w-3" />
        }
      case 'o2r':
        return {
          label: 'O2R Tracking',
          description: 'Converted to SGD using live exchange rates',
          color: 'bg-green-100 text-green-800',
          icon: <RefreshCw className="h-3 w-3" />
        }
      case 'analysis':
        return {
          label: 'Analysis View',
          description: 'Raw data analysis with original currency values',
          color: 'bg-purple-100 text-purple-800',
          icon: <Info className="h-3 w-3" />
        }
      default:
        return {
          label: 'Unknown',
          description: 'Data source not specified',
          color: 'bg-gray-100 text-gray-800',
          icon: <Info className="h-3 w-3" />
        }
    }
  }

  const sourceInfo = getSourceInfo()

  return (
    <Card className={`border-l-4 border-l-current ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-start space-x-3">
          <Badge className={sourceInfo.color}>
            {sourceInfo.icon}
            <span className="ml-1">{sourceInfo.label}</span>
          </Badge>
          <div className="flex-1 space-y-1">
            <p className="text-xs text-gray-600">{sourceInfo.description}</p>
            {currencyNote && (
              <p className="text-xs text-orange-600 font-medium">
                💱 {currencyNote}
              </p>
            )}
            {lastSync && (
              <p className="text-xs text-gray-500">
                Last synced: {new Date(lastSync).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
