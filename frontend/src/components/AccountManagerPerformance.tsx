import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, User } from 'lucide-react'
import { Deal } from '@/hooks/useFilteredDeals'
import { convertToSGD } from '@/hooks/useFilteredDeals'

interface AccountManagerMetrics {
  accountManager: string
  dealCount: number
  totalValue: number
  avgProbability: number
  avgDealSize: number
  countries: CountryStats[]
  allDeals: Deal[]
  winRate: number
}

interface CountryStats {
  countryCode: string
  countryName: string
  flag: string
  dealCount: number
  totalValue: number
  avgProbability: number
  deals: Deal[]
}

interface AccountManagerPerformanceProps {
  deals: Deal[]
  totalValue: number
  exchangeRates?: { [key: string]: number } | null
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `SGD ${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `SGD ${(amount / 1000).toFixed(0)}K`
  } else {
    return `SGD ${amount.toFixed(0)}`
  }
}

const extractCountryFromDeal = (deal: Deal): { code: string; flag: string; name: string } => {
  const country = deal['Country'] || deal['country'] || 'Unknown'

  const countryMap: { [key: string]: { code: string; flag: string; name: string } } = {
    'Singapore': { code: 'SG', flag: '🇸🇬', name: 'Singapore' },
    'Malaysia': { code: 'MY', flag: '🇲🇾', name: 'Malaysia' },
    'Thailand': { code: 'TH', flag: '🇹🇭', name: 'Thailand' },
    'Indonesia': { code: 'ID', flag: '🇮🇩', name: 'Indonesia' },
    'Philippines': { code: 'PH', flag: '🇵🇭', name: 'Philippines' },
    'Vietnam': { code: 'VN', flag: '🇻🇳', name: 'Vietnam' },
    'India': { code: 'IN', flag: '🇮🇳', name: 'India' },
    'Unknown': { code: 'XX', flag: '🌍', name: 'Unknown' }
  }

  return countryMap[country] || { code: 'XX', flag: '🌍', name: country }
}

export function AccountManagerPerformance({ deals, totalValue, exchangeRates }: AccountManagerPerformanceProps) {
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set())

  const accountManagerMetrics = useMemo(() => {
    if (!deals || deals.length === 0) return []

    const managerGroups: { [key: string]: Deal[] } = {}

    deals.forEach(deal => {
      const accountManager = deal['Opportunity Owner'] || deal['Account Manager'] || deal['account_manager'] || deal['owner'] || 'Unassigned'
      if (!managerGroups[accountManager]) {
        managerGroups[accountManager] = []
      }
      managerGroups[accountManager].push(deal)
    })

    const metrics: AccountManagerMetrics[] = Object.entries(managerGroups).map(([managerName, managerDeals]) => {
      const countryGroups: { [key: string]: Deal[] } = {}

      managerDeals.forEach(deal => {
        const country = extractCountryFromDeal(deal)
        const key = country.code
        if (!countryGroups[key]) {
          countryGroups[key] = []
        }
        countryGroups[key].push(deal)
      })

      const countries: CountryStats[] = Object.entries(countryGroups).map(([countryCode, countryDeals]) => {
        const country = extractCountryFromDeal(countryDeals[0])

        const totalValue = countryDeals.reduce((sum, deal) => {
          const originalAmount = deal['OCH Revenue'] || deal.amount || 0
          const currency = deal.Currency || deal.currency || 'SGD'
          const exchangeRate = deal['Exchange Rate'] || deal.exchange_rate

          // Convert to SGD using the utility function
          const convertedAmount = convertToSGD(
            originalAmount,
            currency,
            exchangeRate,
            exchangeRates || undefined
          )

          return sum + convertedAmount
        }, 0)

        const avgProbability = countryDeals.length > 0
          ? countryDeals.reduce((sum, deal) => sum + (deal['Probability (%)'] || deal.probability || 0), 0) / countryDeals.length
          : 0

        return {
          countryCode,
          countryName: country.name,
          flag: country.flag,
          dealCount: countryDeals.length,
          totalValue,
          avgProbability,
          deals: countryDeals
        }
      })

      countries.sort((a, b) => b.totalValue - a.totalValue)

      const totalManagerValue = managerDeals.reduce((sum, deal) => {
        const originalAmount = deal['OCH Revenue'] || deal.amount || 0
        const currency = deal.Currency || deal.currency || 'SGD'
        const exchangeRate = deal['Exchange Rate'] || deal.exchange_rate

        // Convert to SGD using the utility function
        const convertedAmount = convertToSGD(
          originalAmount,
          currency,
          exchangeRate,
          exchangeRates || undefined
        )

        return sum + convertedAmount
      }, 0)

      const avgProbability = managerDeals.length > 0
        ? managerDeals.reduce((sum, deal) => sum + (deal['Probability (%)'] || deal.probability || 0), 0) / managerDeals.length
        : 0

      const highProbDeals = managerDeals.filter(deal => {
        const prob = deal['Probability (%)'] || deal.probability || 0
        return prob >= 80
      })
      const winRate = managerDeals.length > 0 ? (highProbDeals.length / managerDeals.length) * 100 : 0

      return {
        accountManager: managerName,
        dealCount: managerDeals.length,
        totalValue: totalManagerValue,
        avgProbability,
        avgDealSize: managerDeals.length > 0 ? totalManagerValue / managerDeals.length : 0,
        countries,
        allDeals: managerDeals,
        winRate
      }
    })

    return metrics.sort((a, b) => b.totalValue - a.totalValue)
  }, [deals])

  const toggleManagerExpansion = (managerName: string) => {
    const newExpanded = new Set(expandedManagers)
    if (newExpanded.has(managerName)) {
      newExpanded.delete(managerName)
    } else {
      newExpanded.add(managerName)
    }
    setExpandedManagers(newExpanded)
  }

  const expandAllManagers = () => {
    setExpandedManagers(new Set(accountManagerMetrics.map(m => m.accountManager)))
  }

  const collapseAllManagers = () => {
    setExpandedManagers(new Set())
  }

  if (accountManagerMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Manager Performance by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No account manager data available for current filters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Account Manager Performance by Country</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm font-normal text-muted-foreground">
              {accountManagerMetrics.length} managers • {deals.length} deals • {formatCurrency(totalValue)}
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={expandAllManagers}>
                Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAllManagers}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
            <div className="col-span-4">Account Manager / Country / Opportunity</div>
            <div className="col-span-2 text-center">SGD Amount</div>
            <div className="col-span-1 text-center">Probability</div>
            <div className="col-span-2 text-center">Stage</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {accountManagerMetrics.map((manager) => {
            const isExpanded = expandedManagers.has(manager.accountManager)
            const managerPercentage = totalValue > 0 ? (manager.totalValue / totalValue * 100) : 0

            return (
              <div key={manager.accountManager} className="border rounded-lg">
                <div
                  className="grid grid-cols-12 gap-2 p-3 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors"
                  onClick={() => toggleManagerExpansion(manager.accountManager)}
                >
                  <div className="col-span-4 flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-semibold">{manager.accountManager}</div>
                      <div className="text-sm text-gray-600">
                        {manager.dealCount} deals • {manager.countries.length} countries
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-bold text-lg">{formatCurrency(manager.totalValue)}</div>
                    <div className="text-xs text-gray-600">{managerPercentage.toFixed(1)}% of total</div>
                  </div>
                  <div className="col-span-1 text-center">
                    <Badge variant="secondary" className="text-xs">
                      {manager.avgProbability.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-sm">
                      {manager.dealCount} deals
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-semibold text-green-600">{manager.winRate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">
                      Avg: {formatCurrency(manager.avgDealSize)}
                    </div>
                  </div>
                  <div className="col-span-1 text-center">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-white p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Countries for {manager.accountManager}:
                    </div>
                    {manager.countries.map((country) => (
                      <div key={country.countryCode} className="mb-2 p-2 bg-blue-50 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{country.flag}</span>
                            <span className="font-medium">{country.countryName}</span>
                            <span className="text-gray-600">({country.dealCount} deals)</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(country.totalValue)}</div>
                            <div className="text-xs text-gray-600">
                              Avg: {country.avgProbability.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Individual deals for this country */}
                        <div className="mt-2 space-y-1">
                          {country.deals.map((deal, index) => {
                            const probability = deal['Probability (%)'] || deal.probability || 0
                            const originalAmount = deal['OCH Revenue'] || deal.amount || 0
                            const currency = deal.Currency || deal.currency || 'SGD'
                            const exchangeRate = deal['Exchange Rate'] || deal.exchange_rate

                            // Convert to SGD using the utility function
                            const convertedAmount = convertToSGD(
                              originalAmount,
                              currency,
                              exchangeRate,
                              exchangeRates || undefined
                            )

                            return (
                              <div key={deal['Record Id'] || index} className="text-xs bg-white p-2 rounded border">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium">{deal['Opportunity Name'] || 'N/A'}</div>
                                    <div className="text-gray-600">{deal['account_name'] || deal['Account Name'] || 'N/A'}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(convertedAmount)}</div>
                                    <div className="text-xs text-gray-500">
                                      Original: {currency} {originalAmount.toLocaleString()}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {probability}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="grid grid-cols-12 gap-2 p-4 bg-gray-100 font-bold text-sm border-t-2 border-gray-300">
            <div className="col-span-4">
              Grand Total: {accountManagerMetrics.length} Account Managers
            </div>
            <div className="col-span-2 text-center text-lg">
              {formatCurrency(totalValue)}
            </div>
            <div className="col-span-1 text-center">
              {accountManagerMetrics.length > 0
                ? (accountManagerMetrics.reduce((sum, m) => sum + m.avgProbability, 0) / accountManagerMetrics.length).toFixed(1)
                : 0
              }%
            </div>
            <div className="col-span-2 text-center">
              {deals.length} deals
            </div>
            <div className="col-span-2 text-center">
              Win Rate: {accountManagerMetrics.length > 0
                ? (accountManagerMetrics.reduce((sum, m) => sum + m.winRate, 0) / accountManagerMetrics.length).toFixed(1)
                : 0
              }%
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}