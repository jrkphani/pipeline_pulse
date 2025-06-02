import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { DataSourceIndicator } from '@/components/DataSourceIndicator'
import {
  TrendingUp,
  DollarSign,
  Target,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  FileText,
  Download
} from 'lucide-react'

interface O2RStats {
  total_opportunities: number
  total_value_sgd: number
  avg_deal_size: number
  phase_distribution: Record<string, number>
  health_distribution: Record<string, number>
  territory_breakdown: Record<string, number>
  service_breakdown: Record<string, number>
  revenue_realization: {
    realized_value: number
    pending_value: number
    realized_percentage: number
  }
  attention_required: {
    count: number
    opportunities: string[]
  }
}

interface O2ROpportunity {
  id: string
  deal_name: string
  account_name: string
  territory: string
  service_type: string
  sgd_amount: number
  current_phase: string
  health_signal: string
  health_reason: string
  requires_attention: boolean
  last_updated: string
}

export default function O2RDashboard() {
  const [stats, setStats] = useState<O2RStats | null>(null)
  const [opportunities, setOpportunities] = useState<O2ROpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchO2RData()
  }, [])

  const fetchO2RData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats
      const statsResponse = await fetch('/api/o2r/dashboard/summary')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch opportunities requiring attention
      const oppsResponse = await fetch('/api/o2r/opportunities?requires_attention=true&limit=10')
      if (oppsResponse.ok) {
        const oppsData = await oppsResponse.json()
        setOpportunities(oppsData)
      }

    } catch (err) {
      setError('Failed to load O2R data')
      console.error('Error fetching O2R data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getHealthBadgeColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800'
      case 'yellow': return 'bg-yellow-100 text-yellow-800'
      case 'red': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return `SGD ${(amount / 1000000).toFixed(2)}M`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading O2R Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">O2R Tracker Dashboard</h1>
          <p className="text-muted-foreground">
            Opportunity-to-Revenue tracking and milestone management
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Get Started with O2R Tracking</span>
            </CardTitle>
            <CardDescription>
              Upload your Zoho CRM export to start tracking opportunities through the revenue realization process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No O2R Data Available</p>
              <p className="text-sm text-gray-600 mb-6">
                Import your opportunity data to start tracking the complete opportunity-to-revenue journey
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full max-w-sm">
                  <Link to="/upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV Data
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full max-w-sm">
                  <a href="/api/o2r/sample-csv-template" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download O2R Template
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const overviewStats = [
    {
      title: "Total Pipeline",
      value: stats ? formatCurrency(stats.total_value_sgd) : "SGD 0M",
      description: `${stats?.total_opportunities || 0} opportunities`,
      icon: DollarSign,
      trend: stats ? `Avg: ${formatCurrency(stats.avg_deal_size)}` : "No data"
    },
    {
      title: "Revenue Realized",
      value: stats?.revenue_realization ? `${stats.revenue_realization.realized_percentage.toFixed(1)}%` : "0%",
      description: stats?.revenue_realization ? formatCurrency(stats.revenue_realization.realized_value) : "SGD 0M",
      icon: TrendingUp,
      trend: stats?.revenue_realization ? `Pending: ${formatCurrency(stats.revenue_realization.pending_value)}` : "No data"
    },
    {
      title: "Attention Required",
      value: stats?.attention_required?.count?.toString() || "0",
      description: "Opportunities need review",
      icon: AlertTriangle,
      trend: "Requires immediate action"
    },
    {
      title: "Active Territories",
      value: stats?.territory_breakdown ? Object.keys(stats.territory_breakdown).length.toString() : "0",
      description: "Geographic coverage",
      icon: Users,
      trend: stats?.territory_breakdown ? `Top: ${Object.keys(stats.territory_breakdown)[0] || 'None'}` : "No data"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">O2R Tracker Dashboard</h1>
        <p className="text-muted-foreground">
          Complete opportunity-to-revenue tracking with milestone management and health monitoring
        </p>
      </div>

      {/* Data Source Indicator */}
      <DataSourceIndicator
        source="o2r"
        currencyNote="All amounts converted to SGD using live exchange rates"
        lastSync={stats ? new Date().toISOString() : undefined}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <p className="text-xs text-blue-600 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your O2R tracking workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/o2r/opportunities">
                <BarChart3 className="h-4 w-4 mr-2" />
                View All Opportunities
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV Data
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/o2r/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Attention Required */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Requires Attention</span>
            </CardTitle>
            <CardDescription>
              Opportunities that need immediate review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All opportunities are on track!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.slice(0, 5).map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{opp.deal_name}</p>
                      <p className="text-xs text-gray-600">{opp.account_name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getHealthBadgeColor(opp.health_signal)}>
                          {opp.health_signal}
                        </Badge>
                        <span className="text-xs text-gray-500">{opp.current_phase}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(opp.sgd_amount)}</p>
                      <p className="text-xs text-gray-500">{opp.territory}</p>
                    </div>
                  </div>
                ))}
                {opportunities.length > 5 && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/o2r/opportunities?requires_attention=true">
                      View All ({opportunities.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
