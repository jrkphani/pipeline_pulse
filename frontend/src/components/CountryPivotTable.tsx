/**
 * Pivot Table-style Country Drilldown Component
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronRight, Download, Info } from 'lucide-react';
import { CountryMetrics, Deal } from '@/hooks/useFilteredDeals';
import { convertToSGD } from '@/hooks/useFilteredDeals';

interface CountryPivotTableProps {
  countryBreakdown: CountryMetrics[];
  totalValue: number;
  totalDeals: number;
  exchangeRates?: { [key: string]: number } | null;
  onExportCountry?: (countryCode: string, deals: Deal[]) => void;
  loading?: boolean;
}

export const CountryPivotTable: React.FC<CountryPivotTableProps> = ({
  countryBreakdown,
  totalValue,
  totalDeals,
  exchangeRates,
  onExportCountry,
  loading = false
}) => {
  // Auto-expand countries if there are 3 or fewer, or expand all initially
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(countryBreakdown.length <= 3 ? countryBreakdown.map(c => c.countryCode) : [])
  );

  const toggleCountryExpansion = (countryCode: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryCode)) {
      newExpanded.delete(countryCode);
    } else {
      newExpanded.add(countryCode);
    }
    setExpandedCountries(newExpanded);
  };

  const expandAllCountries = () => {
    setExpandedCountries(new Set(countryBreakdown.map(c => c.countryCode)));
  };

  const collapseAllCountries = () => {
    setExpandedCountries(new Set());
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `SGD ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `SGD ${(amount / 1000).toFixed(0)}K`;
    }
    return `SGD ${amount.toFixed(0)}`;
  };

  const formatCurrencyFull = (amount: number) => {
    return `SGD ${new Intl.NumberFormat('en-SG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 81) return 'bg-green-100 text-green-800';
    if (prob === 80) return 'bg-blue-100 text-blue-800';
    if (prob >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStageColor = (stage: string) => {
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('approved') || lowerStage.includes('won')) return 'bg-green-100 text-green-800';
    if (lowerStage.includes('proposal') || lowerStage.includes('negotiation')) return 'bg-blue-100 text-blue-800';
    if (lowerStage.includes('presales') || lowerStage.includes('demo')) return 'bg-yellow-100 text-yellow-800';
    if (lowerStage.includes('qualified') || lowerStage.includes('discovery')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>🌍</span>
              <span>Country Pipeline Analysis</span>
            </div>
            <Skeleton className="h-8 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🌍</span>
            <span>Country Pipeline Analysis</span>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-1">
                  <Info className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Country Pipeline Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Interactive table showing deal distribution by country. Click on countries to expand and view individual opportunities.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • All amounts converted to SGD
                    • Click expand/collapse to manage view
                    • Export individual country data
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm font-normal text-muted-foreground">
              {countryBreakdown.length} countries • {totalDeals} deals • {formatCurrency(totalValue)}
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={expandAllCountries}>
                Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAllCountries}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Country / Opportunity</TableHead>
                <TableHead className="text-center">SGD Amount</TableHead>
                <TableHead className="text-center">Probability</TableHead>
                <TableHead className="text-center">Stage</TableHead>
                <TableHead className="text-center">Closing Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>

              {countryBreakdown.map((country) => {
                const isExpanded = expandedCountries.has(country.countryCode);
                const countryPercentage = totalValue > 0 ? (country.totalValue / totalValue * 100) : 0;

                return (
                  <React.Fragment key={country.countryCode}>
                    {/* Country Summary Row */}
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCountryExpansion(country.countryCode)}>
                      <CollapsibleTrigger asChild>
                        <TableRow className="bg-muted/50 hover:bg-muted cursor-pointer">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-xl">{country.flag}</span>
                              <div>
                                <div className="font-semibold">{country.countryName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {country.dealCount} deals • Avg: {country.avgProbability.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-bold text-lg">{formatCurrency(country.totalValue)}</div>
                            <div className="text-xs text-muted-foreground">{countryPercentage.toFixed(1)}% of total</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {country.avgProbability.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {Object.entries(country.stageBreakdown).slice(0, 2).map(([stage, count]) => (
                                <Badge key={stage} variant="outline" className="text-xs">
                                  {stage}: {count}
                                </Badge>
                              ))}
                              {Object.keys(country.stageBreakdown).length > 2 && (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <Badge variant="outline" className="text-xs cursor-help">
                                      +{Object.keys(country.stageBreakdown).length - 2} more
                                    </Badge>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold">All Stages</h4>
                                      <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(country.stageBreakdown).map(([stage, count]) => (
                                          <div key={stage} className="text-xs">
                                            <span className="font-medium">{stage}:</span> {count}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-sm text-muted-foreground">
                              Avg: {formatCurrency(country.avgDealSize)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {onExportCountry && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExportCountry(country.countryCode, country.deals);
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>

                      {/* Expanded Deal Rows */}
                      <CollapsibleContent asChild>
                        <>
                          {country.deals.map((deal, index) => {
                            const probability = deal['Probability (%)'] || deal.probability || 0;
                            const originalAmount = deal['OCH Revenue'] || deal.amount || 0;
                            const currency = deal.Currency || deal.currency || 'SGD';
                            const exchangeRate = deal['Exchange Rate'] || deal.exchange_rate;

                            // Convert to SGD using the utility function
                            const convertedAmount = convertToSGD(
                              originalAmount,
                              currency,
                              exchangeRate,
                              exchangeRates || undefined
                            );

                            return (
                              <TableRow key={deal['Record Id'] || index} className="bg-background">
                                <TableCell className="pl-8">
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm">
                                      {deal['Opportunity Name'] || 'N/A'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {deal['Account Name'] || deal.account_name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {currency} → SGD (Rate: {exchangeRate || 'Default'})
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="space-y-1">
                                    <div className="font-semibold">{formatCurrencyFull(convertedAmount)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Original: {currency} {originalAmount.toLocaleString()}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="secondary"
                                    className={getProbabilityColor(probability)}
                                  >
                                    {probability}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStageColor(deal.Stage || deal.stage || '')}`}
                                  >
                                    {deal.Stage || deal.stage || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  {deal['Closing Date'] || deal.closing_date
                                    ? new Date(deal['Closing Date'] || deal.closing_date).toLocaleDateString()
                                    : 'N/A'
                                  }
                                </TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground">
                                  {deal['Opportunity Owner'] || 'N/A'}
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Country Subtotal */}
                          <TableRow className="bg-muted font-semibold">
                            <TableCell className="pl-8">
                              Subtotal: {country.countryName}
                            </TableCell>
                            <TableCell className="text-center">
                              {formatCurrency(country.totalValue)}
                            </TableCell>
                            <TableCell className="text-center">
                              {country.avgProbability.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-center">
                              {country.dealCount} deals
                            </TableCell>
                            <TableCell className="text-center">
                              Avg: {formatCurrency(country.avgDealSize)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </>
                      </CollapsibleContent>
                    </Collapsible>
                  </React.Fragment>
                );
              })}

              {/* Grand Total */}
              <TableRow className="bg-primary text-primary-foreground font-bold border-t-2">
                <TableCell>
                  Grand Total: {countryBreakdown.length} Countries
                </TableCell>
                <TableCell className="text-center text-lg">
                  {formatCurrency(totalValue)}
                </TableCell>
                <TableCell className="text-center">
                  {countryBreakdown.length > 0
                    ? (countryBreakdown.reduce((sum, c) => sum + c.avgProbability, 0) / countryBreakdown.length).toFixed(1)
                    : 0
                  }%
                </TableCell>
                <TableCell className="text-center">
                  {totalDeals} deals
                </TableCell>
                <TableCell className="text-center">
                  Avg: {totalDeals > 0 ? formatCurrency(totalValue / totalDeals) : 'SGD 0'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
