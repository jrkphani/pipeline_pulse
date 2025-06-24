import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Settings, CheckCircle, AlertCircle, Database, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Get API base URL from environment
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api'

export default function CRMSync() {
  const { user } = useAuth()
  const [clientId, setClientId] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [accountsUrl, setAccountsUrl] = useState('')
  const [orgId, setOrgId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/crm/config`)
      if (response.ok) {
        const config = await response.json()
        setClientId(config.client_id || '1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY')
        setBaseUrl(config.base_url || 'https://www.zohoapis.in/crm/v8')
        setAccountsUrl(config.accounts_url || 'https://accounts.zoho.in')
        setOrgId(config.organization_id || '495490000000268051')
      } else {
        // Fallback to defaults if config endpoint fails
        setClientId('1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY')
        setBaseUrl('https://www.zohoapis.in/crm/v8')
        setAccountsUrl('https://accounts.zoho.in')
        setOrgId('495490000000268051')
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
      // Fallback to defaults
      setClientId('1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY')
      setBaseUrl('https://www.zohoapis.in/crm/v8')
      setAccountsUrl('https://accounts.zoho.in')
      setOrgId('495490000000268051')
    }
  }



  const testConnection = async () => {
    setIsLoading(true)
    try {
      // Check OAuth connection status
      const oauthResponse = await fetch(`${API_BASE_URL}/zoho/status`)
      const oauthData = await oauthResponse.json()

      // Also check legacy auth for detailed info
      const legacyResponse = await fetch(`${API_BASE_URL}/crm/auth/status`)
      const legacyData = await legacyResponse.json()

      if (oauthData.connected) {
        const userInfo = oauthData.user ?
          `\n- User: ${oauthData.user.name} (${oauthData.user.email})` :
          `\n- User: ${user?.display_name || 'N/A'}`

        alert(`✅ Connection successful! Zoho CRM is connected and working.\n\nDetails:\n- Organization: ${legacyData.organization_name || 'N/A'}${userInfo}\n- API Version: v8`)
        setLastSync(new Date().toLocaleString())
        // Reload configuration to get updated values
        loadConfiguration()
      } else {
        alert(`❌ Connection test failed: ${oauthData.error || 'Authentication failed'}\n\nYour OAuth connection may have expired. Please log out and log back in.`)
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      alert('❌ Connection test failed. Please check if the backend server is running.')
    } finally {
      setIsLoading(false)
    }
  }



  const pullLatestDeals = async () => {
    setIsLoading(true)
    try {
      // Start bulk export
      const response = await fetch(`${API_BASE_URL}/bulk-export/start`, {
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
        const response = await fetch(`${API_BASE_URL}/bulk-export/job/${jobId}/status`)
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
          Manage your Zoho CRM (India Data Center) integration for real-time data analysis and deal updates.
        </p>
      </div>

      {/* User Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Authentication Status</span>
          </CardTitle>
          <CardDescription>
            You are authenticated and connected to Zoho CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="font-medium">Connected as {user?.display_name}</p>
              <p className="text-sm text-muted-foreground">
                {user?.email} • {user?.role || 'CRM User'}
              </p>
              <p className="text-sm text-muted-foreground">
                {lastSync ? `Last sync: ${lastSync}` : 'Ready for data synchronization'}
              </p>
            </div>
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
                placeholder="Loaded from backend configuration"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                value={orgId}
                placeholder="Loaded from backend configuration"
                readOnly
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Base URL</label>
              <Input
                value={baseUrl}
                placeholder="Loaded from backend configuration"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Accounts URL</label>
              <Input
                value={accountsUrl}
                placeholder="Loaded from backend configuration"
                readOnly
              />
            </div>
          </div>

          <Button onClick={testConnection} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
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
              disabled={isLoading}
            >
              <Database className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Bulk Import from Zoho</span>
              <span className="text-xs opacity-75">Fetch new/updated opportunities</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              disabled={isLoading}
              onClick={() => alert('Push Updates feature coming soon!')}
            >
              <Upload className="h-6 w-6" />
              <span>Push Updates</span>
              <span className="text-xs opacity-75">Update deal probabilities</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
