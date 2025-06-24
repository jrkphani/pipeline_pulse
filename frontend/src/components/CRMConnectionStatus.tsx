import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Get API base URL from environment
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api'

interface ZohoUser {
  id: string
  name: string
  email: string
  role?: string
}

interface ConnectionStatus {
  connected: boolean
  user?: ZohoUser
  connection_time?: string
  error?: string
}

export default function CRMConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/zoho/status`)
      const data = await response.json()
      setConnectionStatus(data)
    } catch (error) {
      console.error('Failed to check connection status:', error)
      setConnectionStatus({ connected: false, error: 'Failed to check status' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatConnectionTime = (timeString?: string) => {
    if (!timeString) return 'Unknown'
    try {
      return new Date(timeString).toLocaleString()
    } catch {
      return 'Unknown'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isLoading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : connectionStatus.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span>CRM Connection</span>
        </CardTitle>
        <CardDescription>
          {isLoading ? (
            'Checking connection status...'
          ) : connectionStatus.connected ? (
            'Connected to Zoho CRM'
          ) : (
            'Not connected to Zoho CRM'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verifying connection...</span>
          </div>
        ) : connectionStatus.connected && connectionStatus.user ? (
          <div className="space-y-2">
            <div className="text-sm">
              <p className="font-medium">{connectionStatus.user.name}</p>
              <p className="text-muted-foreground">{connectionStatus.user.email}</p>
              {connectionStatus.user.role && (
                <p className="text-xs text-muted-foreground">Role: {connectionStatus.user.role}</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Connected: {formatConnectionTime(connectionStatus.connection_time)}
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={checkConnectionStatus} 
                size="sm" 
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link to="/crm-sync">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Manage
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {connectionStatus.error || 'Connect your Zoho CRM account to access real-time pipeline data and sync features.'}
            </div>
            <Button asChild className="w-full">
              <Link to="/crm-sync">
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect to Zoho CRM
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
