import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Bell,
  BellOff,
  Play,
  Pause
} from 'lucide-react'

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api'

interface TokenHealth {
  status: string
  expires_at: string
  time_until_expiry: string
  refresh_count: number
  error_count: number
  last_used: string | null
  recent_refresh_attempts: number
  active_alerts: number
  requires_manual_refresh: boolean
}

interface TokenAlert {
  id: string
  alert_type: string
  severity: string
  message: string
  created_at: string
  token_record_id: string
}

interface MonitoringStatus {
  is_running: boolean
  monitoring_interval_seconds: number
  thresholds: {
    expiry_warning_minutes: number
    error_threshold: number
    stale_token_hours: number
  }
}

const TokenManagement: React.FC = () => {
  const [tokenHealth, setTokenHealth] = useState<TokenHealth | null>(null)
  const [alerts, setAlerts] = useState<TokenAlert[]>([])
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    loadTokenHealth()
    const interval = setInterval(loadTokenHealth, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadTokenHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/token-management/health`)
      const data = await response.json()

      if (response.ok) {
        setTokenHealth(data.token_health)
        setAlerts(data.active_alerts)
        setMonitoringStatus(data.monitoring)
        setLastUpdated(new Date().toLocaleString())
      }
    } catch (error) {
      console.error('Failed to load token health:', error)
    }
  }

  const refreshToken = async (force = false) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/token-management/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      })
      const data = await response.json()

      if (response.ok) {
        alert(`✅ Token refreshed successfully!\n\nResponse time: ${data.response_time_seconds.toFixed(2)}s`)
        await loadTokenHealth()
      } else {
        alert(`❌ Token refresh failed: ${data.detail}`)
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      alert('❌ Token refresh failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/token-management/test-connection`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        alert(`✅ Connection test successful!\n\nZoho CRM is accessible with current token.`)
      } else {
        alert(`❌ Connection test failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      alert('❌ Connection test failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/token-management/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      })

      if (response.ok) {
        await loadTokenHealth()
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const toggleMonitoring = async () => {
    if (!monitoringStatus) return

    try {
      const endpoint = monitoringStatus.is_running ? 'stop' : 'start'
      const response = await fetch(`${API_BASE_URL}/token-management/monitoring/${endpoint}`, {
        method: 'POST'
      })

      if (response.ok) {
        await loadTokenHealth()
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      case 'expired': return 'text-red-800'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />
      case 'expired': return <XCircle className="h-5 w-5 text-red-800" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    }
    return colors[severity as keyof typeof colors] || colors.medium
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Token Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage Zoho CRM authentication tokens
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadTokenHealth()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={testConnection} disabled={isLoading} size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      )}

      {/* Token Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tokenHealth && getStatusIcon(tokenHealth.status)}
            Token Health Status
          </CardTitle>
          <CardDescription>
            Current status and health metrics for Zoho CRM tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenHealth ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <p className={`text-lg font-semibold capitalize ${getStatusColor(tokenHealth.status)}`}>
                  {tokenHealth.status}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Time Until Expiry</p>
                <p className="text-lg font-semibold">{tokenHealth.time_until_expiry}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Refresh Count</p>
                <p className="text-lg font-semibold">{tokenHealth.refresh_count}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Error Count</p>
                <p className={`text-lg font-semibold ${tokenHealth.error_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {tokenHealth.error_count}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading token health...</p>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => refreshToken(false)} 
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Token
            </Button>
            <Button 
              onClick={() => refreshToken(true)} 
              disabled={isLoading}
              variant="outline"
            >
              Force Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoring Service
          </CardTitle>
          <CardDescription>
            Background monitoring and alerting service status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monitoringStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {monitoringStatus.is_running ? (
                    <Badge className="bg-green-100 text-green-800">Running</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Stopped</Badge>
                  )}
                  <span className="text-sm">
                    Check interval: {monitoringStatus.monitoring_interval_seconds}s
                  </span>
                </div>
                <Button onClick={toggleMonitoring} variant="outline" size="sm">
                  {monitoringStatus.is_running ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Monitoring
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Monitoring
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Expiry Warning</p>
                  <p className="text-sm text-muted-foreground">
                    {monitoringStatus.thresholds.expiry_warning_minutes} minutes
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Error Threshold</p>
                  <p className="text-sm text-muted-foreground">
                    {monitoringStatus.thresholds.error_threshold} errors
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Stale Token Alert</p>
                  <p className="text-sm text-muted-foreground">
                    {monitoringStatus.thresholds.stale_token_hours} hours
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading monitoring status...</p>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts ({alerts.length})
          </CardTitle>
          <CardDescription>
            Current token-related alerts and warnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityBadge(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span>{alert.message}</span>
                    </div>
                    <Button 
                      onClick={() => acknowledgeAlert(alert.id)}
                      variant="ghost" 
                      size="sm"
                    >
                      <BellOff className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active alerts</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TokenManagement
