import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { StatusIndicator } from '@/components/ui/status-indicator'

interface ConnectionStatusProps {
  lastSync: Date | null
  isConnected: boolean
  syncInProgress: boolean
  nextSyncIn: number
  onSync: () => void
  className?: string
}

export function ConnectionStatus({
  lastSync,
  isConnected,
  syncInProgress,
  nextSyncIn,
  onSync,
  className
}: ConnectionStatusProps) {
  const [timeUntilSync, setTimeUntilSync] = useState(nextSyncIn)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilSync(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setTimeUntilSync(nextSyncIn)
  }, [nextSyncIn])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border bg-card",
      className
    )}>
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-success" />
          ) : (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
          <div>
            <p className="font-medium text-sm">
              {isConnected ? 'Connected to Zoho CRM' : 'Disconnected'}
            </p>
            <p className="text-xs text-muted-foreground">
              Last sync: {formatLastSync(lastSync)}
            </p>
          </div>
        </div>

        {/* Sync Status */}
        {syncInProgress ? (
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Syncing...</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Next sync in {formatTime(timeUntilSync)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <EnhancedButton
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncInProgress}
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-2",
            syncInProgress && "animate-spin"
          )} />
          {syncInProgress ? 'Syncing...' : 'Sync Now'}
        </EnhancedButton>
      </div>
    </div>
  )
}

interface LiveSyncIndicatorProps {
  isConnected: boolean
  lastSync: Date | null
  className?: string
}

export function LiveSyncIndicator({ 
  isConnected, 
  lastSync,
  className 
}: LiveSyncIndicatorProps) {
  return (
    <div className={cn(
      "inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium",
      isConnected 
        ? "bg-success-light text-success" 
        : "bg-destructive-light text-destructive",
      className
    )}>
      <div className={cn(
        "h-2 w-2 rounded-full",
        isConnected ? "bg-success animate-pulse" : "bg-destructive"
      )} />
      <span>
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}