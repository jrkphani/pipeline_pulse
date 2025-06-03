import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Settings, CheckCircle, ExternalLink, Copy, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CRMSync() {
  const [clientId, setClientId] = useState('1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH')
  const [orgId, setOrgId] = useState('495490000000268051')
  const [refreshToken, setRefreshToken] = useState('1000.d72854d630d911a480b58b816950ef6b.ece6834d42a54c2d8039623ca8de022b')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus('checking')
      const response = await fetch('/api/zoho/auth/status')
      const data = await response.json()

      setIsConnected(data.authenticated)
      setConnectionStatus(data.authenticated ? 'connected' : 'disconnected')

      if (data.authenticated) {
        setLastSync(new Date().toLocaleString())
      }
    } catch (error) {
      console.error('Failed to check connection status:', error)
      setConnectionStatus('disconnected')
      setIsConnected(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/zoho/auth/status')
      const data = await response.json()

      if (data.authenticated) {
        alert('✅ Connection successful! Zoho CRM is connected and working.')
        setIsConnected(true)
        setConnectionStatus('connected')
        setLastSync(new Date().toLocaleString())
      } else {
        alert('❌ Connection failed. Please check your credentials.')
        setIsConnected(false)
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      alert('❌ Connection test failed. Please check if the backend server is running.')
      setIsConnected(false)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  const pullLatestDeals = async () => {
    setIsLoading(true)
    try {
      // Test connection first
      const connectionResponse = await fetch('/api/zoho/auth/check')
      if (!connectionResponse.ok) {
        alert('❌ Zoho CRM connection failed. Please check authentication.')
        return
      }

      // Start bulk export
      const response = await fetch('/api/bulk-export/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()

      if (response.ok) {
        alert(`✅ Bulk export started! Estimated ${data.estimated_records} records to fetch. Job ID: ${data.job_id}`)
        setLastSync(new Date().toLocaleString())

        // Start polling for job status
        pollJobStatus(data.job_id)
      } else {
        alert(`❌ Failed to start bulk export: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to start bulk export:', error)
      alert('❌ Failed to connect to Zoho CRM.')
    } finally {
      setIsLoading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const maxPolls = 60 // Maximum 60 polls (1 hour)
    let pollCount = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/bulk-export/job/${jobId}/status`)
        const jobStatus = await response.json()

        if (response.ok) {
          if (jobStatus.status === 'completed') {
            alert(`✅ Bulk export completed!
              📊 Total records: ${jobStatus.total_records}
              🆕 New records: ${jobStatus.new_records}
              🔄 Updated records: ${jobStatus.updated_records}
              🗑️ Deleted records: ${jobStatus.deleted_records}`)
            return
          } else if (jobStatus.status === 'failed') {
            alert(`❌ Bulk export failed: ${jobStatus.error_message || 'Unknown error'}`)
            return
          } else if (jobStatus.status === 'in_progress') {
            console.log(`Bulk export in progress... (${jobStatus.progress_percentage || 0}%)`)
          }
        }

        pollCount++
        if (pollCount < maxPolls) {
          setTimeout(poll, 60000) // Poll every minute
        } else {
          alert('⏰ Bulk export is taking longer than expected. Please check the status manually.')
        }
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }

    // Start polling after 30 seconds
    setTimeout(poll, 30000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CRM Integration</h1>
        <p className="text-muted-foreground">
          Connect directly to your Zoho CRM (India Data Center) for real-time data analysis and deal updates.
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className={`h-5 w-5 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
            <span>Connection Status</span>
          </CardTitle>
          <CardDescription>
            Current status of your Zoho CRM integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            {connectionStatus === 'checking' && (
              <>
                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                <div>
                  <p className="font-medium">Checking connection...</p>
                  <p className="text-sm text-muted-foreground">Verifying Zoho CRM status</p>
                </div>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Connected to Zoho CRM (India)</p>
                  <p className="text-sm text-muted-foreground">
                    {lastSync ? `Last sync: ${lastSync}` : 'Ready for sync'}
                  </p>
                </div>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Not connected to Zoho CRM</p>
                  <p className="text-sm text-muted-foreground">Please check your configuration</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure your Zoho CRM connection settings (India Data Center)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client ID</label>
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Your Zoho Client ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="Your Zoho Org ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Refresh Token</label>
            <Input
              type="password"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              placeholder="Your refresh token"
            />
          </div>

          <Button onClick={testConnection} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      {/* Sync Options */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Operations</CardTitle>
          <CardDescription>
            Manage data synchronization between Pipeline Pulse and Zoho CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              className="h-20 flex flex-col space-y-2"
              onClick={pullLatestDeals}
              disabled={!isConnected || isLoading}
            >
              <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Bulk Import from Zoho</span>
              <span className="text-xs opacity-75">Fetch new/updated opportunities</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              disabled={!isConnected || isLoading}
              onClick={() => alert('Push Updates feature coming soon!')}
            >
              <RefreshCw className="h-6 w-6" />
              <span>Push Updates</span>
              <span className="text-xs opacity-75">Update deal probabilities</span>
            </Button>
          </div>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Please test the connection first to enable sync operations
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
