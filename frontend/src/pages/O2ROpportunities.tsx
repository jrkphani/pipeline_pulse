import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, createSortableHeader, createActionColumn } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { StatusExplanation } from '@/components/o2r/StatusExplanation'
import { OpportunityStatusDetails } from '@/components/o2r/OpportunityStatusDetails'
import { HealthSummaryCard } from '@/components/o2r/HealthSummaryCard'
import { OpportunityDetailModal } from '@/components/o2r/OpportunityDetailModal'
import { GlobalSyncStatus } from '@/components/layout/GlobalSyncStatus'
import { liveSyncApi } from '@/services/liveSyncApi'
import { useToast } from '@/components/ui/use-toast'
import { ColumnDef } from '@tanstack/react-table'
import {
  Search,
  Filter,
  ArrowLeft,
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  XCircle,
  RefreshCw,
  Database,
  MoreHorizontal,
  Edit,
  ExternalLink
} from 'lucide-react'

interface O2ROpportunity {
  id: string
  deal_name: string
  account_name: string
  territory: string
  service_type: string
  funding_type: string
  sgd_amount: number
  current_phase: string
  health_signal: string
  health_reason: string
  requires_attention: boolean
  strategic_account: boolean
  last_updated: string
  milestones: {
    proposal_sent?: string
    po_received?: string
    kickoff_complete?: string
    go_live?: string
  }
}

// Helper functions for table display
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getHealthBadgeVariant = (health: string) => {
  switch (health.toLowerCase()) {
    case 'healthy': return 'default'
    case 'at_risk': return 'destructive'
    case 'delayed': return 'secondary'
    default: return 'outline'
  }
}

const getPhaseBadgeVariant = (phase: string) => {
  switch (phase.toLowerCase()) {
    case 'opportunity': return 'secondary'
    case 'proposal': return 'default'
    case 'commitment': return 'default'
    case 'execution': return 'default'
    case 'revenue': return 'default'
    default: return 'outline'
  }
}

// Column definitions for DataTable
const createOpportunityColumns = (
  onViewDetails: (opportunity: O2ROpportunity) => void,
  onEdit: (opportunity: O2ROpportunity) => void
): ColumnDef<O2ROpportunity>[] => [
  {
    accessorKey: "deal_name",
    header: createSortableHeader("Deal Name"),
    cell: ({ row }) => {
      const opportunity = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium">{opportunity.deal_name}</div>
          <div className="text-sm text-muted-foreground">{opportunity.account_name}</div>
          {opportunity.strategic_account && (
            <Badge variant="outline" className="text-xs">Strategic</Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "territory",
    header: createSortableHeader("Territory"),
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("territory")}</Badge>
    ),
  },
  {
    accessorKey: "sgd_amount",
    header: createSortableHeader("SGD Amount"),
    cell: ({ row }) => (
      <div className="font-medium">{formatCurrency(row.getValue("sgd_amount"))}</div>
    ),
  },
  {
    accessorKey: "current_phase",
    header: createSortableHeader("Phase"),
    cell: ({ row }) => (
      <Badge variant={getPhaseBadgeVariant(row.getValue("current_phase"))}>
        {row.getValue("current_phase")}
      </Badge>
    ),
  },
  {
    accessorKey: "health_signal",
    header: createSortableHeader("Health"),
    cell: ({ row }) => {
      const health = row.getValue("health_signal") as string
      const opportunity = row.original
      return (
        <div className="flex items-center space-x-2">
          <Badge variant={getHealthBadgeVariant(health)}>
            {health === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
            {health === 'at_risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {health === 'delayed' && <Clock className="h-3 w-3 mr-1" />}
            {health.replace('_', ' ')}
          </Badge>
          {opportunity.requires_attention && (
            <Badge variant="destructive" className="text-xs">Attention</Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "service_type",
    header: "Service Type",
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("service_type")}</div>
    ),
  },
  {
    accessorKey: "last_updated",
    header: createSortableHeader("Last Updated"),
    cell: ({ row }) => {
      const date = new Date(row.getValue("last_updated"))
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  createActionColumn<O2ROpportunity>([
    {
      label: "View Details",
      onClick: onViewDetails,
      icon: <Eye className="h-4 w-4" />
    },
    {
      label: "Edit",
      onClick: onEdit,
      icon: <Edit className="h-4 w-4" />
    },
    {
      label: "Open in CRM",
      onClick: (opportunity) => {
        window.open(`https://crm.zoho.in/crm/org123/tab/Deals/${opportunity.id}`, '_blank')
      },
      icon: <ExternalLink className="h-4 w-4" />
    }
  ])
]

export default function O2ROpportunities() {
  const { toast } = useToast()
  const [opportunities, setOpportunities] = useState<O2ROpportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<O2ROpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [territoryFilter, setTerritoryFilter] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [attentionFilter, setAttentionFilter] = useState(false)
  const [territories, setTerritories] = useState<string[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<O2ROpportunity | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Live sync status
  const { data: syncOverview } = useQuery({
    queryKey: ['o2r-opportunities-sync-overview'],
    queryFn: () => liveSyncApi.getSyncOverview(),
    refetchInterval: 30000,
  })

  useEffect(() => {
    fetchOpportunities()
    fetchTerritories()
  }, [])

  useEffect(() => {
    filterOpportunities()
  }, [opportunities, searchTerm, territoryFilter, healthFilter, phaseFilter, attentionFilter])

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/o2r/opportunities?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setOpportunities(data)
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTerritories = async () => {
    try {
      const response = await fetch('/api/o2r/territories')
      if (response.ok) {
        const data = await response.json()
        setTerritories(data)
      }
    } catch (error) {
      console.error('Error fetching territories:', error)
    }
  }

  const filterOpportunities = () => {
    let filtered = opportunities

    if (searchTerm) {
      filtered = filtered.filter(opp => 
        opp.deal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (territoryFilter && territoryFilter !== 'all') {
      filtered = filtered.filter(opp => opp.territory === territoryFilter)
    }

    if (healthFilter && healthFilter !== 'all') {
      filtered = filtered.filter(opp => opp.health_signal.toLowerCase() === healthFilter.toLowerCase())
    }

    if (phaseFilter && phaseFilter !== 'all') {
      filtered = filtered.filter(opp => opp.current_phase === phaseFilter)
    }

    if (attentionFilter) {
      filtered = filtered.filter(opp => opp.requires_attention)
    }

    setFilteredOpportunities(filtered)
  }

  const getHealthBadgeColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800'
      case 'yellow': return 'bg-yellow-100 text-yellow-800'
      case 'red': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-gray-100 text-gray-800'
      case 'needs_update': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return <CheckCircle className="h-4 w-4" />
      case 'yellow': return <Clock className="h-4 w-4" />
      case 'red': return <AlertTriangle className="h-4 w-4" />
      case 'blocked': return <XCircle className="h-4 w-4" />
      case 'needs_update': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return `SGD ${(amount / 1000000).toFixed(2)}M`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setTerritoryFilter('')
    setHealthFilter('')
    setPhaseFilter('')
    setAttentionFilter(false)
  }

  const handleViewOpportunity = (opportunity: O2ROpportunity) => {
    setSelectedOpportunity(opportunity)
    setIsDetailModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setSelectedOpportunity(null)
  }

  const handleUpdateOpportunity = (updatedOpportunity: O2ROpportunity) => {
    // Update the opportunity in the local state
    setOpportunities(prev =>
      prev.map(opp => opp.id === updatedOpportunity.id ? updatedOpportunity : opp)
    )

    // The filtered opportunities will be updated automatically by the useEffect
  }

  const handleLiveSync = async () => {
    setLoading(true)
    try {
      const result = await liveSyncApi.triggerManualSync()
      
      if (result.success) {
        toast({
          title: "Live Sync Started",
          description: "O2R data is being synchronized from Zoho CRM.",
        })
        // Refresh the opportunities list after a short delay
        setTimeout(async () => {
          await fetchOpportunities()
        }, 3000)
      } else {
        toast({
          title: "Sync Failed",
          description: result.message || "Failed to start live sync",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Live sync error:', error)
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to trigger live sync",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncFromPipeline = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/o2r/sync-from-pipeline', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        // Refresh the opportunities list
        await fetchOpportunities()
        toast({
          title: "Legacy Sync Complete",
          description: `Successfully synced ${result.total_opportunities} opportunities from pipeline data.`,
        })
      } else {
        toast({
          title: "Legacy Sync Failed",
          description: "Failed to sync opportunities from pipeline data.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "Sync Error",
        description: "Error syncing opportunities from pipeline data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && opportunities.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>

        {/* Quick Filters Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Summary Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/o2r">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to O2R Dashboard
              </Link>
            </Button>
          </div>
          <StatusExplanation />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">O2R Opportunities</h1>
            <p className="text-muted-foreground">
              Track and manage opportunities through the complete revenue realization journey
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleLiveSync}
              disabled={loading || !!syncOverview?.active_sync}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Database className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Live Sync</span>
            </Button>
            <Button
              onClick={handleSyncFromPipeline}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Legacy Sync</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Sync Status */}
      <GlobalSyncStatus compact={true} />

      {/* Quick Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Filters</CardTitle>
          <CardDescription>
            Filter opportunities by health status or attention requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Health Status Filters */}
            <Button
              variant={healthFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHealthFilter('')}
              className="flex items-center space-x-1"
            >
              <span>All</span>
              <Badge variant="secondary" className="ml-1">
                {opportunities.length}
              </Badge>
            </Button>

            <Button
              variant={healthFilter === 'green' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHealthFilter('green')}
              className="flex items-center space-x-1"
            >
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Green</span>
              <Badge variant="secondary" className="ml-1">
                {opportunities.filter(opp => opp.health_signal.toLowerCase() === 'green').length}
              </Badge>
            </Button>

            <Button
              variant={healthFilter === 'yellow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHealthFilter('yellow')}
              className="flex items-center space-x-1"
            >
              <Clock className="h-3 w-3 text-yellow-600" />
              <span>Yellow</span>
              <Badge variant="secondary" className="ml-1">
                {opportunities.filter(opp => opp.health_signal.toLowerCase() === 'yellow').length}
              </Badge>
            </Button>

            <Button
              variant={healthFilter === 'red' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHealthFilter('red')}
              className="flex items-center space-x-1"
            >
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span>Red</span>
              <Badge variant="secondary" className="ml-1">
                {opportunities.filter(opp => opp.health_signal.toLowerCase() === 'red').length}
              </Badge>
            </Button>

            <Button
              variant={healthFilter === 'blocked' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHealthFilter('blocked')}
              className="flex items-center space-x-1"
            >
              <XCircle className="h-3 w-3 text-gray-600" />
              <span>Blocked</span>
              <Badge variant="secondary" className="ml-1">
                {opportunities.filter(opp => opp.health_signal.toLowerCase() === 'blocked').length}
              </Badge>
            </Button>

            <Button
              variant={healthFilter === 'needs_update' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHealthFilter('needs_update')}
              className="flex items-center space-x-1"
            >
              <Clock className="h-3 w-3 text-blue-600" />
              <span>Needs Update</span>
              <Badge variant="secondary" className="ml-1">
                {opportunities.filter(opp => opp.health_signal.toLowerCase() === 'needs_update').length}
              </Badge>
            </Button>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Attention Filter */}
            <Button
              variant={attentionFilter ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setAttentionFilter(!attentionFilter)}
              className="flex items-center space-x-1"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Needs Attention</span>
              <Badge variant="secondary" className="ml-1">
                {opportunities.filter(opp => opp.requires_attention).length}
              </Badge>
            </Button>

            {/* Clear Filters */}
            {(healthFilter || attentionFilter || searchTerm || territoryFilter || phaseFilter) && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search deals or accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Territory</label>
              <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All territories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All territories</SelectItem>
                  {territories.map(territory => (
                    <SelectItem key={territory} value={territory}>
                      {territory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Health Signal</label>
              <Select value={healthFilter} onValueChange={setHealthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All health signals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All health signals</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phase</label>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All phases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All phases</SelectItem>
                  <SelectItem value="Phase I">Phase I - Opportunity to Proposal</SelectItem>
                  <SelectItem value="Phase II">Phase II - Proposal to Commitment</SelectItem>
                  <SelectItem value="Phase III">Phase III - Execution</SelectItem>
                  <SelectItem value="Phase IV">Phase IV - Revenue Realization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Summary */}
      <HealthSummaryCard opportunities={filteredOpportunities} />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(filteredOpportunities.reduce((sum, opp) => sum + opp.sgd_amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-lg font-semibold">{filteredOpportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Need Attention</p>
                <p className="text-lg font-semibold">
                  {filteredOpportunities.filter(opp => opp.requires_attention).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Strategic Accounts</p>
                <p className="text-lg font-semibold">
                  {filteredOpportunities.filter(opp => opp.strategic_account).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle>Opportunities ({filteredOpportunities.length})</CardTitle>
          <CardDescription>
            Advanced table with sorting, filtering, and actions. Right-click on rows for context menu options.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={createOpportunityColumns(
              handleViewOpportunity,
              (opportunity) => {
                // Handle edit action - could open edit modal or navigate to edit page
                console.log('Edit opportunity:', opportunity)
                // For now, just open the detail modal
                handleViewOpportunity(opportunity)
              }
            )}
            data={filteredOpportunities}
            loading={loading}
            searchKey="deal_name"
            searchPlaceholder="Search opportunities..."
            onRowClick={handleViewOpportunity}
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleUpdateOpportunity}
        />
      )}
    </div>
  )
}
