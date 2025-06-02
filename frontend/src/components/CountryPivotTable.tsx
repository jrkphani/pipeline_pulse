/**
 * Pivot Table-style Country Drilldown Component
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { CountryMetrics, Deal } from '@/hooks/useFilteredDeals';
import { convertToSGD } from '@/lib/utils';

interface CountryPivotTableProps {
  countryBreakdown: CountryMetrics[];
  totalValue: number;
  totalDeals: number;
  exchangeRates?: { [key: string]: number } | null;
  onExportCountry?: (countryCode: string, deals: Deal[]) => void;
}

export const CountryPivotTable: React.FC<CountryPivotTableProps> = ({
  countryBreakdown,
  totalValue,
  totalDeals,
  exchangeRates,
  onExportCountry
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🌍</span>
            <span>Country Pipeline Analysis</span>
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
        <div className="space-y-1">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
            <div className="col-span-4">Country / Opportunity</div>
            <div className="col-span-2 text-center">SGD Amount</div>
            <div className="col-span-1 text-center">Probability</div>
            <div className="col-span-2 text-center">Stage</div>
            <div className="col-span-2 text-center">Closing Date</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {/* Country Rows */}
          {countryBreakdown.map((country) => {
            const isExpanded = expandedCountries.has(country.countryCode);
            const countryPercentage = totalValue > 0 ? (country.totalValue / totalValue * 100) : 0;

            return (
              <div key={country.countryCode} className="border rounded-lg">
                {/* Country Summary Row */}
                <div 
                  className="grid grid-cols-12 gap-2 p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                  onClick={() => toggleCountryExpansion(country.countryCode)}
                >
                  <div className="col-span-4 flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-xl">{country.flag}</span>
                    <div>
                      <div className="font-semibold">{country.countryName}</div>
                      <div className="text-sm text-gray-600">
                        {country.dealCount} deals • Avg: {country.avgProbability.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-bold text-lg">{formatCurrency(country.totalValue)}</div>
                    <div className="text-xs text-gray-600">{countryPercentage.toFixed(1)}% of total</div>
                  </div>
                  <div className="col-span-1 text-center">
                    <Badge variant="secondary" className="text-xs">
                      {country.avgProbability.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {Object.entries(country.stageBreakdown).map(([stage, count]) => (
                        <Badge key={stage} variant="outline" className="text-xs">
                          {stage}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-sm text-gray-600">
                      Avg: {formatCurrency(country.avgDealSize)}
                    </div>
                  </div>
                  <div className="col-span-1 text-center">
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
                  </div>
                </div>

                {/* Expanded Deal Rows */}
                {isExpanded && (
                  <div className="border-t bg-white">
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
                        <div
                          key={deal['Record Id'] || index}
                          className="grid grid-cols-12 gap-2 p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="col-span-4 pl-8">
                            <div className="font-medium text-sm">
                              {deal['Opportunity Name'] || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {deal['Account Name'] || deal.account_name || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-600">
                              {currency} → SGD (Rate: {exchangeRate || 'Default'})
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <div className="font-semibold">{formatCurrencyFull(convertedAmount)}</div>
                            <div className="text-xs text-gray-500">
                              Original: {currency} {originalAmount.toLocaleString()}
                            </div>
                          </div>
                          <div className="col-span-1 text-center">
                            <Badge
                              variant="secondary"
                              className={getProbabilityColor(probability)}
                            >
                              {probability}%
                            </Badge>
                          </div>
                          <div className="col-span-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStageColor(deal.Stage || deal.stage || '')}`}
                            >
                              {deal.Stage || deal.stage || 'N/A'}
                            </Badge>
                          </div>
                          <div className="col-span-2 text-center text-sm">
                            {deal['Closing Date'] || deal.closing_date
                              ? new Date(deal['Closing Date'] || deal.closing_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </div>
                          <div className="col-span-1 text-center text-xs text-gray-500">
                            {deal['Opportunity Owner'] || 'N/A'}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Country Subtotal */}
                    <div className="grid grid-cols-12 gap-2 p-3 bg-blue-100 font-semibold text-sm">
                      <div className="col-span-4 pl-8">
                        Subtotal: {country.countryName}
                      </div>
                      <div className="col-span-2 text-center">
                        {formatCurrency(country.totalValue)}
                      </div>
                      <div className="col-span-1 text-center">
                        {country.avgProbability.toFixed(1)}%
                      </div>
                      <div className="col-span-2 text-center">
                        {country.dealCount} deals
                      </div>
                      <div className="col-span-2 text-center">
                        Avg: {formatCurrency(country.avgDealSize)}
                      </div>
                      <div className="col-span-1"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="grid grid-cols-12 gap-2 p-4 bg-gray-100 font-bold text-sm border-t-2 border-gray-300">
            <div className="col-span-4">
              Grand Total: {countryBreakdown.length} Countries
            </div>
            <div className="col-span-2 text-center text-lg">
              {formatCurrency(totalValue)}
            </div>
            <div className="col-span-1 text-center">
              {countryBreakdown.length > 0 
                ? (countryBreakdown.reduce((sum, c) => sum + c.avgProbability, 0) / countryBreakdown.length).toFixed(1)
                : 0
              }%
            </div>
            <div className="col-span-2 text-center">
              {totalDeals} deals
            </div>
            <div className="col-span-2 text-center">
              Avg: {totalDeals > 0 ? formatCurrency(totalValue / totalDeals) : 'SGD 0'}
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
