import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { FilterPanel } from '@/components/FilterPanel'
import { CountryPivotTable } from '@/components/CountryPivotTable'
import { CurrencyStatus } from '@/components/CurrencyStatus'
import { AccountManagerPerformance } from '@/components/AccountManagerPerformance'
import { DataSourceIndicator } from '@/components/DataSourceIndicator'
import { GlobalSyncStatus } from '@/components/layout/GlobalSyncStatus'
import { useFilterState } from '@/hooks/useFilterState'
import { useFilteredDeals, Deal } from '@/hooks/useFilteredDeals'
import { generateDashboardSubtitle } from '@/types/filters'
import { apiService } from '@/services/api'
import { liveSyncApi } from '@/services/liveSyncApi'

interface AnalysisData {
  analysis_id: string
  filename: string
  total_deals: number
  processed_deals: number
  total_value: number
  is_latest: boolean
  created_at: string
  data: Deal[]
}

export default function Analysis() {
  const { id } = useParams()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Live sync status
  const { data: syncOverview } = useQuery({
    queryKey: ['analysis-sync-overview'],
    queryFn: () => liveSyncApi.getSyncOverview(),
    refetchInterval: 30000,
  })

  // Filter state management
  const { selectedDateFilter, selectedProbabilityStage } = useFilterState()

  // Apply filters to deals data
  const {
    filteredDeals,
    totalValue,
    avgDealSize,
    avgProbability,
    countryBreakdown,
    exchangeRates
  } = useFilteredDeals(
    analysisData?.data || [],
    selectedDateFilter,
    selectedProbabilityStage
  )

  useEffect(() => {
    if (id) {
      fetchAnalysisData(id)
    }
  }, [id])

  const fetchAnalysisData = async (analysisId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getAnalysisData(analysisId)
      setAnalysisData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis data')
      // Error handling - analysis data loading failed
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `SGD ${new Intl.NumberFormat('en-SG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`
  }

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) {
      return `SGD ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `SGD ${(amount / 1000).toFixed(0)}K`
    }
    return `SGD ${amount.toFixed(0)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span>Loading analysis data...</span>
        </div>
      </div>
    )
  }

  if (error || !analysisData) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
          <p className="text-gray-600">Analysis not found or failed to load</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error || 'Analysis not found'}</p>
            <Button onClick={() => window.history.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Generate dynamic subtitle
  const dynamicSubtitle = generateDashboardSubtitle(
    filteredDeals.length,
    totalValue,
    selectedDateFilter,
    selectedProbabilityStage
  )

  return (
    <div className="space-y-8">
      {/* Dynamic Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              1CloudHub Deals Analysis - Active Pipeline with Revenue
            </h1>
            <p className="text-muted-foreground">
              {dynamicSubtitle}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Analysis results for {analysisData.filename}
            </p>
          </div>
          {analysisData.is_latest && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Latest Analysis
            </Badge>
          )}
        </div>
      </div>

      {/* Live Sync Status */}
      <GlobalSyncStatus compact={true} />

      {/* Data Source Indicator */}
      <DataSourceIndicator
        source="live"
        currencyNote="Live data from Zoho CRM with real-time currency conversion to SGD"
        lastSync={syncOverview?.last_sync_time || analysisData.created_at}
      />

      {/* Filter Panel and Currency Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <FilterPanel
            filteredDealsCount={filteredDeals.length}
            totalValue={totalValue}
            onExport={() => {
              // Export functionality needs implementation - see GitHub issue #123
            }}
          />
        </div>
        <div className="lg:col-span-1">
          <CurrencyStatus />
        </div>
      </div>

      {/* Summary Cards - Using Filtered Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Deals</CardTitle>
            <span className="text-2xl">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDeals.length}</div>
            <p className="text-xs text-gray-600">
              From {analysisData.total_deals} total deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyShort(totalValue)}</div>
            <p className="text-xs text-gray-600">
              SGD standardized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyShort(avgDealSize)}</div>
            <p className="text-xs text-gray-600">
              Per qualified deal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Probability</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProbability.toFixed(1)}%</div>
            <p className="text-xs text-gray-600">
              {selectedProbabilityStage.label}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Country Pivot Table */}
      <CountryPivotTable
        countryBreakdown={countryBreakdown}
        totalValue={totalValue}
        totalDeals={filteredDeals.length}
        exchangeRates={exchangeRates}
        onExportCountry={(countryCode, deals) => {
          // Country-specific export needs implementation - see GitHub issue #124
        }}
      />

      {/* Account Manager Performance */}
      <AccountManagerPerformance
        deals={filteredDeals}
        totalValue={totalValue}
        exchangeRates={exchangeRates}
      />
    </div>
  )
}
