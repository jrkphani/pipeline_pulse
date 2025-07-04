import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Settings, CheckCircle, AlertCircle, Database, Activity, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { SyncStatusCard } from '@/components/sync/SyncStatusCard'
import { LiveSyncProgress } from '@/components/sync/LiveSyncProgress'
import { HealthIndicator } from '@/components/sync/HealthIndicator'
import { GlobalDataStatusIndicator } from '@/components/layout/GlobalDataStatusIndicator'
import { liveSyncApi } from '@/services/liveSyncApi'
import { useToast } from '@/components/ui/use-toast'

// Get API base URL from environment
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api'

export default function CRMSync() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [clientId, setClientId] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [accountsUrl, setAccountsUrl] = useState('')
  const [orgId, setOrgId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Live sync data
  const { data: syncOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['crm-sync-overview'],
    queryFn: () => liveSyncApi.getSyncOverview(),
    refetchInterval: 15000, // Refetch every 15 seconds
  })

  const { data: syncStatus } = useQuery({
    queryKey: ['crm-sync-status'],
    queryFn: () => liveSyncApi.getSyncStatus(),
    refetchInterval: 5000, // Refetch every 5 seconds
  })

  const { data: syncActivities } = useQuery({
    queryKey: ['crm-sync-activities'],
    queryFn: () => liveSyncApi.getSyncActivities(10),
    refetchInterval: 10000, // Refetch every 10 seconds
  })

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
      const result = await liveSyncApi.testConnection()
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Zoho CRM is connected. Response time: ${result.connection_details.api_response_time}ms`,
        })
        setLastSync(new Date().toLocaleString())
        refetchOverview()
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to Zoho CRM",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Connection test failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }



  const triggerManualSync = async (syncType: 'full' | 'incremental') => {
    setIsLoading(true)
    try {
      const result = await liveSyncApi.triggerManualSync(syncType)
      
      if (result.success) {
        toast({
          title: "Sync Started",
          description: `Manual ${syncType} synchronization has been triggered successfully.`,
        })
        setLastSync(new Date().toLocaleString())
        refetchOverview() // Refresh the overview immediately
      } else {
        toast({
          title: "Sync Failed",
          description: result.message || "Failed to start synchronization",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error)
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to trigger sync",
        variant: "destructive",
      })
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
            // Bulk export progress tracking
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

      {/* Live Sync Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Sync Status</CardTitle>
          <CardDescription>
            Real-time synchronization status with Zoho CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlobalDataStatusIndicator />
        </CardContent>
      </Card>

      {/* Sync Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Health Dashboard</CardTitle>
          <CardDescription>
            Comprehensive overview of synchronization health and performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SyncStatusCard
            title="Connection Status"
            status={syncOverview?.connection_status === 'connected' ? 'healthy' : 'error'}
            value={syncOverview?.active_connections}
            icon={<Database className="h-5 w-5" />}
            description={syncOverview?.connection_status === 'connected' ? 'Connected' : 'Disconnected'}
            suffix="connections"
          />
          
          <SyncStatusCard
            title="API Rate Limit"
            status={syncOverview && syncOverview.rate_limit_remaining > 100 ? 'healthy' : 'warning'}
            value={syncOverview?.rate_limit_remaining}
            icon={<Zap className="h-5 w-5" />}
            description={`Out of ${syncOverview?.rate_limit_limit || 'N/A'} daily calls`}
            suffix="calls"
          />
          
          <SyncStatusCard
            title="Success Rate"
            status={syncOverview && syncOverview.success_rate >= 90 ? 'healthy' : syncOverview && syncOverview.success_rate >= 70 ? 'warning' : 'error'}
            value={syncOverview?.success_rate}
            icon={<CheckCircle className="h-5 w-5" />}
            description="Last 24 hours"
            suffix="%"
            showProgress={true}
          />
          
          <SyncStatusCard
            title="Pending Conflicts"
            status={syncOverview && syncOverview.pending_conflicts === 0 ? 'healthy' : syncOverview && syncOverview.pending_conflicts < 5 ? 'warning' : 'error'}
            value={syncOverview?.pending_conflicts}
            icon={<AlertCircle className="h-5 w-5" />}
            description="Require resolution"
            suffix="conflicts"
          />

          <SyncStatusCard
            title="Average Sync Time"
            status={syncOverview && parseFloat(syncOverview.avg_sync_time) < 10 ? 'healthy' : 'warning'}
            value={syncOverview?.avg_sync_time}
            icon={<Activity className="h-5 w-5" />}
            description="Per record"
            suffix="ms"
          />

          <SyncStatusCard
            title="Last Sync Time"
            status={syncOverview && new Date().getTime() - new Date(syncOverview.last_sync_time || 0).getTime() < 3600000 ? 'healthy' : 'warning'}
            value={syncOverview?.last_sync_time ? new Date(syncOverview.last_sync_time).toLocaleTimeString() : 'N/A'}
            icon={<RefreshCw className="h-5 w-5" />}
            description={syncOverview?.last_sync_time ? new Date(syncOverview.last_sync_time).toLocaleDateString() : 'N/A'}
          />
        </CardContent>
      </Card>

      {/* Active Sync Progress */}
      {syncOverview?.active_sync && (
        <Card>
          <CardHeader>
            <CardTitle>Sync in Progress</CardTitle>
            <CardDescription>
              Current synchronization activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveSyncProgress sessionId={syncOverview.active_sync.session_id} />
          </CardContent>
        </Card>
      )}

      {/* Sync Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Operations</CardTitle>
          <CardDescription>
            Manual sync controls and automated settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              className="h-20 flex flex-col space-y-2"
              onClick={() => triggerManualSync('full')}
              disabled={isLoading || !!syncOverview?.active_sync}
            >
              <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Trigger Full Sync</span>
              <span className="text-xs opacity-75">Sync all records</span>
            </Button>

            <Button
              className="h-20 flex flex-col space-y-2"
              onClick={() => triggerManualSync('incremental')}
              disabled={isLoading || !!syncOverview?.active_sync}
            >
              <Zap className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Trigger Incremental Sync</span>
              <span className="text-xs opacity-75">Sync recent changes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activities */}
      {syncActivities && syncActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest synchronization events and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncActivities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell>{activity.status}</TableCell>
                    <TableCell>{activity.message}</TableCell>
                    <TableCell className="text-right">{activity.records_processed}</TableCell>
                    <TableCell className="text-right">{activity.duration_seconds}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
