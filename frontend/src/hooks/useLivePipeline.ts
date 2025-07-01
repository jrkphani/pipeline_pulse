import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface Deal {
  record_id: string
  opportunity_name: string
  account_name: string
  amount: number
  currency: string
  sgd_amount: number
  probability: number
  stage: string
  closing_date: string
  owner: string
  territory?: string
  service_line?: string
}

interface PipelineSummary {
  total_deals: number
  total_value: number
  avg_probability: number
  deals_by_stage: Record<string, { count: number; value: number }>
}

interface SyncStatus {
  lastSync: Date | null
  isConnected: boolean
  syncInProgress: boolean
  nextSyncIn: number
}

interface LivePipelineData {
  deals: Deal[]
  summary: PipelineSummary
  syncStatus: SyncStatus
}

export const useLivePipeline = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isConnected: false,
    syncInProgress: false,
    nextSyncIn: 0
  })
  
  const queryClient = useQueryClient()
  
  // Fetch live pipeline data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['live-pipeline'],
    queryFn: async () => {
      const response = await fetch('/api/zoho/live-pipeline')
      if (!response.ok) throw new Error('Failed to fetch pipeline data')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  })
  
  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true }))
      
      const response = await fetch('/api/zoho/sync', { method: 'POST' })
      const result = await response.json()
      
      if (result.status === 'success') {
        // Invalidate and refetch data
        queryClient.invalidateQueries({ queryKey: ['live-pipeline'] })
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          isConnected: true
        }))
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncStatus(prev => ({ ...prev, isConnected: false }))
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }))
    }
  }, [queryClient])
  
  // Update sync status from API
  useEffect(() => {
    if (data?.syncStatus) {
      setSyncStatus({
        lastSync: data.syncStatus.lastSync ? new Date(data.syncStatus.lastSync) : null,
        isConnected: data.syncStatus.isConnected,
        syncInProgress: data.syncStatus.syncInProgress,
        nextSyncIn: data.syncStatus.nextSyncIn
      })
    }
  }, [data])
  
  return {
    data: data?.deals || [],
    summary: data?.summary,
    syncStatus,
    isLoading,
    error,
    triggerSync,
    refetch
  }
}