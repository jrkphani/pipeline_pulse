import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  DollarSign,
  Target,
  Upload,
  RefreshCw,
  BarChart3,
  Globe
} from 'lucide-react'
import { apiService } from '@/services/api'
import { DataSourceIndicator } from '@/components/DataSourceIndicator'

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
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      const response = await apiService.getFiles()

      // Enrich analyses with converted SGD values from O2R system
      const enrichedAnalyses = await Promise.all(
        response.files.map(async (analysis) => {
          try {
            // First try to get O2R converted values (more accurate for financial reporting)
            const o2rResponse = await fetch('/api/o2r/dashboard/summary')
            if (o2rResponse.ok) {
              const o2rData = await o2rResponse.json()
              return {
                ...analysis,
                total_value: o2rData.total_value_sgd || analysis.total_value,
                processed_deals: o2rData.total_opportunities || analysis.processed_deals,
                currency_converted: true
              }
            } else {
              // Fallback to original analysis data
              const analysisResponse = await fetch(`/api/analysis/${analysis.id}`)
              if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json()
                return {
                  ...analysis,
                  total_value: analysisData.summary?.total_value || analysis.total_value,
                  currency_converted: false
                }
              }
            }
          } catch (error) {
            console.error(`Failed to fetch data for ${analysis.id}:`, error)
          }
          return analysis
        })
      )

      setAnalyses(enrichedAnalyses)
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
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
          trend: "Upload data to see metrics"
        },
        {
          title: "Active Analyses",
          value: "0",
          description: "No analyses yet",
          icon: Globe,
          trend: "Upload your first CSV file"
        },
        {
          title: "Total Deals",
          value: "0",
          description: "No deals processed",
          icon: Target,
          trend: "Upload data to see metrics"
        },
        {
          title: "Latest Analysis",
          value: "None",
          description: "No recent activity",
          icon: TrendingUp,
          trend: "Get started by uploading data"
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
        description: "Uploaded files",
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
        trend: latestAnalysis ? `SGD ${(latestAnalysis.total_value / 1000000).toFixed(2)}M value` : "Upload data to get started"
      }
    ]
  }

  const stats = calculateStats()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pipeline Pulse Dashboard</h1>
        <p className="text-muted-foreground">
          Transform your Zoho CRM data into actionable revenue insights. Get started by uploading your opportunity export or connecting directly to your CRM.
        </p>
      </div>

      {/* Data Source Indicator */}
      {analyses.length > 0 && (
        <DataSourceIndicator
          source="o2r"
          currencyNote="Financial values converted to SGD using live exchange rates for accurate reporting"
          lastSync={analyses.find(a => a.is_latest)?.created_at}
        />
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <Link to="/upload">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upload CSV Analysis</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Upload your Zoho CRM opportunity export for instant analysis
              </p>
            </CardContent>
          </Link>
        </Card>
        
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <Link to="/crm-sync">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CRM Integration</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Connect directly to Zoho CRM for real-time data and updates
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">View Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Access previous analyses and generate executive reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
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
                <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Analyses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Your latest pipeline analysis results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading analyses...</p>
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">No analyses yet</p>
                <p className="text-xs text-gray-500 mt-1">Upload your first CSV file to get started</p>
                <Button asChild className="mt-4" size="sm">
                  <Link to="/upload">Upload Now</Link>
                </Button>
              </div>
            ) : (
              analyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{analysis.original_filename}</p>
                    <p className="text-xs text-gray-600">
                      {analysis.processed_deals} deals • SGD {(analysis.total_value / 1000000).toFixed(2)}M
                    </p>
                    <p className="text-xs text-gray-500">{new Date(analysis.created_at).toLocaleDateString()}</p>
                    {analysis.is_latest && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Latest
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/analysis/${analysis.id}`}>View</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with Pipeline Pulse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyses.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Ready to analyze your pipeline?</p>
                  <p className="text-xs text-gray-500 mt-1">Upload your Zoho CRM export to get started</p>
                </div>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link to="/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV File
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/crm-sync">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Connect to CRM
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600">Continue working with your data</p>
                </div>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link to="/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Analysis
                    </Link>
                  </Button>
                  {analyses.find(a => a.is_latest) && (
                    <Button variant="outline" asChild className="w-full">
                      <Link to={`/analysis/${analyses.find(a => a.is_latest)?.id}`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Latest Analysis
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            New to Pipeline Pulse? Follow these steps to analyze your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                <h3 className="font-medium">Export from Zoho CRM</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Export your opportunities data from Zoho CRM as a CSV file
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                <h3 className="font-medium">Upload & Analyze</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload your CSV file and get instant pipeline analysis with SGD standardization
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                <h3 className="font-medium">Take Action</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Use insights to prioritize deals and sync updates back to your CRM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
