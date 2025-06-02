/**
 * Custom hook for filtering deals based on date range and probability stage
 */

import { useMemo, useEffect, useState } from 'react';
import { FilterState, DateFilter, ProbabilityStage } from '@/types/filters'
import { currencyService } from '@/services/currencyService';

export interface Deal {
  'Record Id'?: string;
  'Opportunity Name'?: string;
  'Account Name'?: string;
  'Stage'?: string;
  'OCH Revenue'?: number;
  'Currency'?: string;
  'Exchange Rate'?: number;
  'Probability (%)'?: number;
  'Closing Date'?: string;
  'Country'?: string;
  'Opportunity Owner'?: string;
  'Created Time'?: string;
  'Type'?: string;
  // Legacy fields for backward compatibility
  'account_name'?: string;
  'stage'?: string;
  'amount'?: number;
  'probability'?: number;
  'closing_date'?: string;
  'created_date'?: string;
  [key: string]: any;
}

export interface FilteredDealsResult {
  filteredDeals: Deal[];
  totalValue: number;
  avgDealSize: number;
  avgProbability: number;
  countryBreakdown: CountryMetrics[];
  exchangeRates: { [key: string]: number } | null;
}

export interface CountryMetrics {
  countryCode: string;
  countryName: string;
  flag: string;
  dealCount: number;
  totalValue: number;
  avgProbability: number;
  avgDealSize: number;
  deals: Deal[];
  stageBreakdown: {
    [stageRange: string]: number;
  };
  // Pivot table features
  isExpanded?: boolean;
  subtotalByCurrency?: { [currency: string]: number };
  subtotalByStage?: { [stage: string]: { count: number; value: number } };
}

// Country mapping based on CSV specification - maps CSV country codes to display info
const COUNTRY_MAPPING: { [key: string]: { code: string; flag: string; name: string } } = {
  // Primary countries from CSV specification
  'MY': { code: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  'SG': { code: 'SG', flag: '🇸🇬', name: 'Singapore' },
  'PH': { code: 'PH', flag: '🇵🇭', name: 'Philippines' },
  'IND': { code: 'IND', flag: '🇮🇳', name: 'India' },
  'TH': { code: 'TH', flag: '🇹🇭', name: 'Thailand' },
  'US': { code: 'US', flag: '🇺🇸', name: 'United States' },
  'VNM': { code: 'VNM', flag: '🇻🇳', name: 'Vietnam' },

  // Additional common country codes
  'ID': { code: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  'AU': { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  'NZ': { code: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  'HK': { code: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  'TW': { code: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  'KR': { code: 'KR', flag: '🇰🇷', name: 'South Korea' },
  'JP': { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  'CN': { code: 'CN', flag: '🇨🇳', name: 'China' },
  'CA': { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  'GB': { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  'DE': { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  'FR': { code: 'FR', flag: '🇫🇷', name: 'France' },
  'NL': { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  'CH': { code: 'CH', flag: '🇨🇭', name: 'Switzerland' },

  // Legacy/alternative codes for backward compatibility
  'IN': { code: 'IND', flag: '🇮🇳', name: 'India' },
  'VN': { code: 'VNM', flag: '🇻🇳', name: 'Vietnam' }
};

// Extract country from the Country column (CSV specification compliant)
const extractCountryFromDeal = (deal: Deal): { code: string; flag: string; name: string } => {
  // Primary: Use the Country column from CSV specification
  const countryCode = deal.Country || deal.country;

  if (countryCode && COUNTRY_MAPPING[countryCode]) {
    return COUNTRY_MAPPING[countryCode];
  }

  // Fallback: Try to extract from account name patterns (legacy support)
  const accountName = (deal['Account Name'] || deal.account_name || '').toLowerCase();
  const opportunityName = (deal['Opportunity Name'] || '').toLowerCase();

  // Check for country indicators in text
  if (accountName.includes('sdn bhd') || accountName.includes('malaysia')) {
    return COUNTRY_MAPPING['MY'];
  }
  if (accountName.includes('pte ltd') || accountName.includes('singapore')) {
    return COUNTRY_MAPPING['SG'];
  }
  if (accountName.includes('inc') || accountName.includes('corp') || accountName.includes('llc')) {
    return COUNTRY_MAPPING['US'];
  }
  if (accountName.includes('pvt ltd') || accountName.includes('private limited')) {
    return COUNTRY_MAPPING['IND'];
  }
  if (accountName.includes('co., ltd') || accountName.includes('company limited')) {
    return COUNTRY_MAPPING['TH'];
  }

  // Default to Singapore if no match (most common in dataset)
  return COUNTRY_MAPPING['SG'];
};

// Currency conversion to SGD using dynamic rates from backend
const convertToSGD = (deal: Deal, exchangeRates?: { [key: string]: number }): number => {
  const amount = deal['OCH Revenue'] || deal.amount || 0;
  if (!amount || amount === 0) return 0;

  const currency = deal.Currency || deal.currency || 'SGD';

  // If SGD, return as-is
  if (currency === 'SGD') {
    return amount;
  }

  // Use exchange rate from CSV if available
  const csvExchangeRate = deal['Exchange Rate'] || deal.exchange_rate;
  if (csvExchangeRate && csvExchangeRate > 0) {
    return amount / csvExchangeRate;
  }

  // Use dynamic exchange rates if provided
  if (exchangeRates && exchangeRates[currency]) {
    return amount / exchangeRates[currency];
  }

  // Fallback to static exchange rates
  const fallbackRates: { [key: string]: number } = {
    'SGD': 1.0,
    'USD': 0.75,   // 1 SGD = 0.75 USD
    'INR': 62.14,  // 1 SGD = 62.14 INR
    'PHP': 42.02,  // 1 SGD = 42.02 PHP
    'MYR': 3.2,    // 1 SGD = 3.2 MYR
    'THB': 25.0,   // 1 SGD = 25.0 THB
    'IDR': 11000,  // 1 SGD = 11000 IDR
    'VND': 18000,  // 1 SGD = 18000 VND
  };

  const rate = fallbackRates[currency] || 1.0;
  return amount / rate;
};

export const useFilteredDeals = (
  deals: Deal[],
  selectedDateFilter: DateFilter,
  selectedProbabilityStage: ProbabilityStage
): FilteredDealsResult => {
  // State for dynamic exchange rates
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number } | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // Fetch exchange rates on mount
  useEffect(() => {
    const fetchExchangeRates = async () => {
      if (exchangeRates || ratesLoading) return; // Already loaded or loading

      setRatesLoading(true);
      try {
        const rates = await currencyService.getExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        console.warn('Failed to fetch exchange rates, using fallback rates:', error);
        setExchangeRates(null); // Will use fallback rates
      } finally {
        setRatesLoading(false);
      }
    };

    fetchExchangeRates();
  }, [exchangeRates, ratesLoading]);

  return useMemo(() => {
    if (!deals || deals.length === 0) {
      return {
        filteredDeals: [],
        totalValue: 0,
        avgDealSize: 0,
        avgProbability: 0,
        countryBreakdown: [],
        exchangeRates
      };
    }

    // Apply filters
    let filteredDeals = deals.filter(deal => {
      // Revenue filter (always applied) - only deals with actual OCH Revenue
      const ochRevenue = deal['OCH Revenue'] || deal.amount || 0;
      if (!ochRevenue || ochRevenue <= 0) return false;

      // Probability stage filter - use correct column name
      const probability = deal['Probability (%)'] || deal.probability || 0;
      if (probability < selectedProbabilityStage.minProbability ||
          probability > selectedProbabilityStage.maxProbability) {
        return false;
      }

      // Date range filter - use correct column name
      if (selectedDateFilter.startDate && selectedDateFilter.endDate) {
        const closingDate = new Date(deal['Closing Date'] || deal.closing_date || '');
        if (isNaN(closingDate.getTime())) return true; // Include deals with invalid dates

        if (closingDate < selectedDateFilter.startDate ||
            closingDate > selectedDateFilter.endDate) {
          return false;
        }
      }

      return true;
    });

    // Calculate metrics using proper currency conversion
    const totalValue = filteredDeals.reduce((sum, deal) => {
      return sum + convertToSGD(deal, exchangeRates || undefined);
    }, 0);

    const avgDealSize = filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0;

    const avgProbability = filteredDeals.length > 0
      ? filteredDeals.reduce((sum, deal) => sum + (deal['Probability (%)'] || deal.probability || 0), 0) / filteredDeals.length
      : 0;

    // Generate country breakdown - all filters already applied to filteredDeals
    const countryGroups: { [key: string]: { country: { code: string; flag: string; name: string }, deals: Deal[] } } = {};

    filteredDeals.forEach(deal => {
      const country = extractCountryFromDeal(deal);
      const key = country.code;

      if (!countryGroups[key]) {
        countryGroups[key] = { country, deals: [] };
      }
      countryGroups[key].deals.push(deal);
    });

    const countryBreakdown: CountryMetrics[] = Object.entries(countryGroups).map(([countryCode, group]) => {
      const { country, deals } = group;

      const totalValue = deals.reduce((sum, deal) => {
        return sum + convertToSGD(deal, exchangeRates || undefined);
      }, 0);

      const avgProbability = deals.length > 0
        ? deals.reduce((sum, deal) => sum + (deal['Probability (%)'] || deal.probability || 0), 0) / deals.length
        : 0;
      
      // Stage breakdown
      const stageBreakdown: { [key: string]: number } = {};
      deals.forEach(deal => {
        const prob = deal['Probability (%)'] || deal.probability || 0;
        let stage = '';
        if (prob >= 10 && prob <= 40) stage = '10-40%';
        else if (prob >= 41 && prob <= 70) stage = '41-70%';
        else if (prob >= 71 && prob <= 80) stage = '71-80%';
        else if (prob >= 81 && prob <= 100) stage = '81-100%';

        if (stage) {
          stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
        }
      });

      return {
        countryCode,
        countryName: country.name,
        flag: country.flag,
        dealCount: deals.length,
        totalValue,
        avgProbability,
        avgDealSize: deals.length > 0 ? totalValue / deals.length : 0,
        deals,
        stageBreakdown
      };
    });

    // Sort countries by total value descending
    countryBreakdown.sort((a, b) => b.totalValue - a.totalValue);

    return {
      filteredDeals,
      totalValue,
      avgDealSize,
      avgProbability,
      countryBreakdown,
      exchangeRates
    };
    
  }, [deals, selectedDateFilter, selectedProbabilityStage, exchangeRates]);
};
