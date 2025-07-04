import { useEffect, useState } from 'react'
import { useServerStore } from '@/stores/useServerStore'
import { apiService } from '@/services/api'

export function GlobalDataStatusIndicator() {
  const { connectionStatus, setConnectionStatus, lastSyncTime, updateLastSyncTime } = useServerStore()
  const [diffSummary, setDiffSummary] = useState({ local_db_only: 0, zoho_only: 0 })
  const [syncInProgress, setSyncInProgress] = useState(false)

  useEffect(() => {
    const fetchSyncHealth = async () => {
      try {
        const response = await apiService.get('/sync/health')
        const data = response.data
        updateLastSyncTime(new Date(data.lastSyncTimestamp))
        setDiffSummary(data.diffSummary)
        setSyncInProgress(data.syncInProgress)
        setConnectionStatus('online')
      } catch (error) {
        setConnectionStatus('offline')
      }
    }

    fetchSyncHealth()
    const interval = setInterval(fetchSyncHealth, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [setConnectionStatus, updateLastSyncTime])

  const getStatus = () => {
    if (connectionStatus === 'offline') {
      return { text: 'Offline', color: 'text-red-500', pulse: true }
    }
    if (syncInProgress) {
      return { text: 'Syncing...', color: 'text-blue-500', pulse: true }
    }
    if (lastSyncTime) {
      const minutes = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 60000)
      if (minutes < 30) {
        return { text: `Synced ${minutes}m ago`, color: 'text-green-500' }
      }
      if (minutes < 120) {
        return { text: `Synced ${minutes}m ago`, color: 'text-yellow-500' }
      }
      return { text: `Stale - synced ${Math.floor(minutes / 60)}h ago`, color: 'text-red-500', pulse: true }
    }
    return { text: 'Unknown', color: 'text-gray-500' }
  }

  const { text, color, pulse } = getStatus()

  return (
    <div className="flex items-center space-x-2">
      <div className={`h-2 w-2 rounded-full ${pulse ? 'animate-pulse' : ''} ${color.replace('text-', 'bg-')}`}></div>
      <span className={`text-sm ${color}`}>{text}</span>
    </div>
  )
}
