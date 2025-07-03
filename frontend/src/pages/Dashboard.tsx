import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  DollarSign,
  Target,
  RefreshCw,
  BarChart3,
  Globe,
  CheckCircle,
  Database,
  Activity,
  Zap
} from 'lucide-react'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'
import { DataSourceIndicator } from '@/components/DataSourceIndicator'
import CRMConnectionStatus from '@/components/CRMConnectionStatus'
import { SyncStatusCard } from '@/components/sync/SyncStatusCard'
import { ProgressTracker } from '@/components/sync/ProgressTracker'
import { HealthIndicator } from '@/components/sync/HealthIndicator'
import { GlobalSyncStatus } from '@/components/layout/GlobalSyncStatus'
import { liveSyncApi } from '@/services/liveSyncApi'

interface Analysis {
  id: string
  original_filename: string
  filename: string
  file_size: number
  total_deals: number
  processed_deals: number
  total_value: number
  is_latest: boolean
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    fetchAnalyses()
    handleOAuthSuccess()
  }, [])

  const handleOAuthSuccess = () => {
    const success = searchParams.get('success')
    const user = searchParams.get('user')

    if (success === 'true') {
      setShowWelcome(true)
      // Clear URL parameters
      setSearchParams({})
      // Auto-hide welcome message after 5 seconds
      setTimeout(() => setShowWelcome(false), 5000)
    }
  }

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      
      // Use live CRM data instead of upload-based files
      const [dashboardResponse, o2rResponse] = await Promise.all([
        fetch('/api/sync/dashboard-data'),
        fetch('/api/o2r/dashboard/summary')
      ])

      // Get live pipeline data
      let pipelineData = { deals: [], total_value: 0, total_count: 0 }
      if (dashboardResponse.ok) {
        pipelineData = await dashboardResponse.json()
      } else {
        console.warn('Live sync data not available, using empty dataset')
      }

      // Get O2R data for enhanced metrics
      let o2rData = { total_value_sgd: 0, total_opportunities: 0 }
      if (o2rResponse.ok) {
        o2rData = await o2rResponse.json()
      }

      // Create a unified analysis object from live data
      const liveAnalysis = {
        id: 'live-crm-data',
        name: 'Live CRM Pipeline',
        upload_date: new Date().toISOString(),
        file_size: pipelineData.deals?.length || 0,
        total_value: o2rData.total_value_sgd || pipelineData.total_value || 0,
        processed_deals: o2rData.total_opportunities || pipelineData.total_count || 0,
        currency_converted: true,
        is_live_data: true
      }

      // Set the live analysis as our data source
      setAnalyses([liveAnalysis])
    } catch (error) {
      console.error('Failed to fetch live CRM data:', error)
      setAnalyses([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real data
  const calculateStats = () => {
    if (analyses.length === 0) {
      return [
        {
          title: "Total Pipeline",
          value: "SGD 0",
          description: "No data available",
          icon: DollarSign,
          trend: "Connect to live CRM data"
        },
        {
          title: "Active Analyses",
          value: "0",
          description: "No analyses yet",
          icon: Globe,
          trend: "Connect to CRM for live analysis"
        },
        {
          title: "Total Deals",
          value: "0",
          description: "No deals processed",
          icon: Target,
          trend: "Connect to live CRM data"
        },
        {
          title: "Latest Analysis",
          value: "None",
          description: "No recent activity",
          icon: TrendingUp,
          trend: "Get started with live CRM sync"
        }
      ]
    }

    const totalValue = analyses.reduce((sum, analysis) => sum + analysis.total_value, 0)
    const totalDeals = analyses.reduce((sum, analysis) => sum + analysis.total_deals, 0)
    const latestAnalysis = analyses.find(a => a.is_latest)

    return [
      {
        title: "Total Pipeline",
        value: `SGD ${(totalValue / 1000000).toFixed(2)}M`,
        description: `${totalDeals} total deals`,
        icon: DollarSign,
        trend: `Across ${analyses.length} analyses`
      },
      {
        title: "Active Analyses",
        value: analyses.length.toString(),
        description: "Live data sources",
        icon: Globe,
        trend: latestAnalysis ? `Latest: ${new Date(latestAnalysis.created_at).toLocaleDateString()}` : "No recent activity"
      },
      {
        title: "Total Deals",
        value: totalDeals.toString(),
        description: "Processed opportunities",
        icon: Target,
        trend: `Avg: ${totalDeals > 0 ? Math.round(totalDeals / analyses.length) : 0} per analysis`
      },
      {
        title: "Latest Analysis",
        value: latestAnalysis ? `${latestAnalysis.processed_deals} deals` : "None",
        description: latestAnalysis ? latestAnalysis.original_filename : "No recent activity",
        icon: TrendingUp,
        trend: latestAnalysis ? `SGD ${(latestAnalysis.total_value / 1000000).toFixed(2)}M value` : "Connect to CRM to get started"
      }
    ]
  }

  const stats = calculateStats()

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      {showWelcome && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 Welcome to Pipeline Pulse, {user?.display_name}! You're now connected to Zoho CRM and ready to analyze your pipeline data.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pipeline Pulse Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.display_name}! Transform your Zoho CRM data into actionable revenue insights.
        </p>
      </header>

      {/* Live Sync Status */}
      <GlobalSyncStatus />

      {/* Live CRM Data Stats */}
      <LiveDashboardStats />

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <Link 
              to="/o2r/dashboard"
              aria-label="O2R Tracker - Track opportunities through the complete revenue realization process"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">O2R Tracker</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Track opportunities through the complete revenue realization process
                </p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <Link 
              to="/crm-sync"
              aria-label="CRM Integration - Connect directly to Zoho CRM for real-time data and updates"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CRM Integration</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Connect directly to Zoho CRM for real-time data and updates
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <Link 
              to="/reports"
              aria-label="View Reports - Access previous analyses and generate executive reports"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">View Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Access previous analyses and generate executive reports
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </section>

      {/* Stats Grid */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Pipeline Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Key pipeline metrics">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} role="img" aria-labelledby={`stat-${index}-title`} aria-describedby={`stat-${index}-desc`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle id={`stat-${index}-title`} className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" aria-label={`${stat.title}: ${stat.value}`}>
                    {stat.value}
                  </div>
                  <p id={`stat-${index}-desc`} className="text-xs text-muted-foreground">{stat.description}</p>
                  <p className="text-xs text-green-600 mt-1" aria-label={`Trend: ${stat.trend}`}>
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Recent Analyses */}
      <section aria-labelledby="recent-analyses-heading">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle id="recent-analyses-heading">Recent Analyses</CardTitle>
              <CardDescription>
                Your latest pipeline analysis results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8" role="status" aria-label="Loading analyses">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" aria-hidden="true"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading analyses...</p>
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">No analyses yet</p>
                  <p className="text-xs text-gray-500 mt-1">Connect to CRM for live data analysis</p>
                  <Button asChild className="mt-4" size="sm" aria-label="Connect to CRM for live data">
                    <Link to="/crm-sync">Connect CRM</Link>
                  </Button>
                </div>
              ) : (
                <div role="list" aria-label="Recent analysis files">
                  {analyses.slice(0, 5).map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      role="listitem"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{analysis.original_filename}</p>
                        <p className="text-xs text-gray-600">
                          {analysis.processed_deals} deals • SGD {(analysis.total_value / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-xs text-gray-500">{new Date(analysis.created_at).toLocaleDateString()}</p>
                        {analysis.is_latest && (
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            role="status"
                            aria-label="Latest analysis"
                          >
                            Latest
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        aria-label={`View analysis for ${analysis.original_filename}`}
                      >
                        <Link to={`/analysis/${analysis.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <CRMConnectionStatus />
        </div>
      </section>

      {/* Getting Started */}
      <section aria-labelledby="getting-started-heading">
        <Card>
          <CardHeader>
            <CardTitle id="getting-started-heading">Getting Started</CardTitle>
            <CardDescription>
              New to Pipeline Pulse? Follow these steps to analyze your pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3" role="list" aria-label="Getting started steps">
              <div className="space-y-2" role="listitem">
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium"
                    aria-label="Step 1"
                  >
                    1
                  </div>
                  <h3 className="font-medium">Connect to Zoho CRM</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect Pipeline Pulse directly to your Zoho CRM for real-time data sync
                </p>
              </div>
              
              <div className="space-y-2" role="listitem">
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium"
                    aria-label="Step 2"
                  >
                    2
                  </div>
                  <h3 className="font-medium">Live Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get instant pipeline analysis with live data and automatic SGD standardization
                </p>
              </div>
              
              <div className="space-y-2" role="listitem">
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium"
                    aria-label="Step 3"
                  >
                    3
                  </div>
                  <h3 className="font-medium">Take Action</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use real-time insights to prioritize deals and sync updates directly to your CRM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

// Live Dashboard Stats Component
function LiveDashboardStats() {
  const { data: syncOverview, isLoading } = useQuery({
    queryKey: ['dashboard-sync-overview'],
    queryFn: () => liveSyncApi.getSyncOverview(),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });

  const { data: dataSummary } = useQuery({
    queryKey: ['dashboard-data-summary'],
    queryFn: () => liveSyncApi.getDataSummary(),
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 120000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const liveStats = [
    {
      title: "Live CRM Data",
      value: dataSummary ? dataSummary.total_records.toLocaleString() : "0",
      description: "Records synchronized",
      icon: Database,
      status: syncOverview?.connection_status === 'connected' ? 'healthy' : 'error' as 'healthy' | 'error',
    },
    {
      title: "Sync Health",
      value: syncOverview ? `${Math.round(syncOverview.health_score)}%` : "0%",
      description: syncOverview?.overall_health || "Unknown",
      icon: Activity,
      status: syncOverview?.overall_health === 'healthy' ? 'healthy' : syncOverview?.overall_health === 'warning' ? 'warning' : 'error' as 'healthy' | 'warning' | 'error',
    },
    {
      title: "Data Freshness",
      value: dataSummary ? `${Math.round(dataSummary.data_freshness)} min` : "N/A",
      description: "Since last update",
      icon: Zap,
      status: dataSummary?.data_freshness && dataSummary.data_freshness < 30 ? 'healthy' : 'warning' as 'healthy' | 'warning',
    },
  ];

  return (
    <section aria-labelledby="live-stats-heading">
      <h2 id="live-stats-heading" className="text-lg font-semibold mb-4">Live CRM Integration</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {liveStats.map((stat, index) => (
          <SyncStatusCard
            key={index}
            title={stat.title}
            status={stat.status}
            value={typeof stat.value === 'string' ? 0 : parseInt(stat.value)}
            icon={<stat.icon className="h-5 w-5" />}
            description={stat.description}
            suffix={typeof stat.value === 'string' ? stat.value : ''}
          />
        ))}
      </div>

      {/* Active Sync Progress */}
      {syncOverview?.active_sync && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Sync in Progress</CardTitle>
            <CardDescription>
              Live synchronization with Zoho CRM is currently running
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressTracker
              syncData={{
                progress: syncOverview.active_sync.progress,
                stage: syncOverview.active_sync.stage,
                records_processed: syncOverview.active_sync.records_processed,
                total_records: syncOverview.active_sync.total_records,
                started_at: syncOverview.active_sync.started_at,
              }}
              compact={true}
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
