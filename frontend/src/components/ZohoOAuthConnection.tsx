import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle, ExternalLink, User, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

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

export default function ZohoOAuthConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false })
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    checkConnectionStatus()
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = () => {
    // Check for OAuth callback parameters
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const user = searchParams.get('user')
    const message = searchParams.get('message')

    if (success === 'true') {
      // OAuth success
      alert(`✅ Successfully connected to Zoho CRM!\n\nWelcome, ${user || 'User'}!\n\nYou can now access your CRM data and sync opportunities.`)
      checkConnectionStatus() // Refresh status
      // Clear URL parameters
      setSearchParams({})
    } else if (error) {
      // OAuth error
      let errorMessage = 'Failed to connect to Zoho CRM'
      
      switch (error) {
        case 'oauth_error':
          errorMessage = `OAuth error: ${message || 'Unknown error'}`
          break
        case 'missing_params':
          errorMessage = 'Missing required parameters from Zoho'
          break
        case 'invalid_state':
          errorMessage = 'Invalid security state - please try again'
          break
        case 'state_expired':
          errorMessage = 'Connection request expired - please try again'
          break
        case 'callback_failed':
          errorMessage = `Connection failed: ${message || 'Unknown error'}`
          break
        default:
          errorMessage = `Connection error: ${error}`
      }
      
      alert(`❌ ${errorMessage}\n\nPlease try connecting again.`)
      // Clear URL parameters
      setSearchParams({})
    }
  }

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

  const connectToZoho = async () => {
    try {
      setIsConnecting(true)
      
      // Get OAuth authorization URL
      const response = await fetch(`${API_BASE_URL}/zoho/auth-url`)
      const data = await response.json()
      
      if (data.auth_url) {
        // Open OAuth flow in current window
        window.location.href = data.auth_url
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (error) {
      console.error('Failed to start OAuth flow:', error)
      alert('❌ Failed to start connection process. Please try again.')
      setIsConnecting(false)
    }
  }

  const disconnectFromZoho = async () => {
    if (!confirm('Are you sure you want to disconnect from Zoho CRM?\n\nThis will remove your connection and you\'ll need to reconnect to access CRM features.')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/zoho/disconnect`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Successfully disconnected from Zoho CRM')
        setConnectionStatus({ connected: false })
      } else {
        throw new Error(data.message || 'Disconnect failed')
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      alert('❌ Failed to disconnect. Please try again.')
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
          <User className="h-5 w-5" />
          <span>Zoho CRM Connection</span>
        </CardTitle>
        <CardDescription>
          Connect your Zoho CRM account to access pipeline data and sync opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          {isLoading ? (
            <>
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              <div>
                <p className="font-medium">Checking connection...</p>
                <p className="text-sm text-muted-foreground">Verifying Zoho CRM status</p>
              </div>
            </>
          ) : connectionStatus.connected && connectionStatus.user ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">Connected to Zoho CRM</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus.user.name} ({connectionStatus.user.email})
                </p>
                {connectionStatus.user.role && (
                  <p className="text-xs text-muted-foreground">
                    Role: {connectionStatus.user.role}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Connected: {formatConnectionTime(connectionStatus.connection_time)}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">Not connected to Zoho CRM</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus.error || 'Connect your account to access CRM features'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {connectionStatus.connected ? (
            <div className="space-y-2">
              <Button 
                onClick={checkConnectionStatus} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                  </>
                )}
              </Button>
              
              <Button 
                onClick={disconnectFromZoho} 
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect from Zoho CRM
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button 
              onClick={connectToZoho} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to Zoho...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect to Zoho CRM
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded-lg">
          <p className="font-medium">How it works:</p>
          <p>• Click "Connect to Zoho CRM" to start the secure OAuth flow</p>
          <p>• You'll be redirected to Zoho to log in and grant permissions</p>
          <p>• Once connected, you can access all CRM features in Pipeline Pulse</p>
          <p>• Your connection is secure and can be disconnected at any time</p>
        </div>
      </CardContent>
    </Card>
  )
}
