import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from 'react-router-dom'
import { StatusExplanation } from '@/components/o2r/StatusExplanation'
import { OpportunityStatusDetails } from '@/components/o2r/OpportunityStatusDetails'
import { HealthSummaryCard } from '@/components/o2r/HealthSummaryCard'
import { OpportunityDetailModal } from '@/components/o2r/OpportunityDetailModal'
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
  RefreshCw
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

export default function O2ROpportunities() {
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
        alert(`✅ Successfully synced ${result.total_opportunities} opportunities from pipeline data!`)
      } else {
        alert('❌ Failed to sync opportunities from pipeline data.')
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('❌ Error syncing opportunities from pipeline data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading opportunities...</p>
        </div>
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
          <Button
            onClick={handleSyncFromPipeline}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync from Pipeline</span>
          </Button>
        </div>
      </div>

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
            Click on any opportunity to view detailed tracking information. Use the info icon (ⓘ) next to status badges to understand why an opportunity has its current health signal and attention level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No opportunities found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOpportunities.map((opp) => (
                <div key={opp.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{opp.deal_name}</h3>
                        {opp.strategic_account && (
                          <Badge variant="secondary">Strategic</Badge>
                        )}
                        {opp.requires_attention && (
                          <Badge variant="destructive">Attention Required</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{opp.account_name}</span>
                        <span>•</span>
                        <span>{opp.territory}</span>
                        <span>•</span>
                        <span>{opp.service_type}</span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Badge className={getHealthBadgeColor(opp.health_signal)}>
                            {getHealthIcon(opp.health_signal)}
                            <span className="ml-1">{opp.health_signal}</span>
                          </Badge>
                          <OpportunityStatusDetails opportunity={opp} />
                        </div>
                        <Badge variant="outline">{opp.current_phase}</Badge>
                        <span className="text-sm text-gray-500">
                          Updated: {formatDate(opp.last_updated)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-xl font-bold">{formatCurrency(opp.sgd_amount)}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOpportunity(opp)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
