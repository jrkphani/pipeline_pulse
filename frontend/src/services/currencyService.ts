/**
 * Currency Service for Dynamic Exchange Rates
 * 
 * Provides functions to interact with the backend currency API
 * for real-time exchange rate conversion and management.
 */

import { apiService } from './api';

export interface ExchangeRates {
  [currencyCode: string]: number;
}

export interface CurrencyConversion {
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  target_currency: string;
  rate_source: 'live' | 'cached' | 'fallback' | 'base' | 'unsupported' | 'error';
  conversion_rate: string;
}

export interface CacheStatus {
  cache_status: 'empty' | 'fresh' | 'stale';
  total_currencies: number;
  last_updated: string | null;
  age_days: number | null;
  currencies?: string[];
}

export interface SupportedCurrencies {
  base_currency: string;
  supported_currencies: string[];
  total_count: number;
}

class CurrencyService {
  private baseUrl = '/currency'; // Remove /api prefix since apiService already includes it
  private cachedRates: ExchangeRates | null = null;
  private cacheTimestamp: number | null = null;
  private cacheExpiryMinutes = 60; // Cache rates for 1 hour

  /**
   * Get current exchange rates from the backend
   */
  async getExchangeRates(forceRefresh = false): Promise<ExchangeRates> {
    // Check if we have valid cached rates
    if (!forceRefresh && this.cachedRates && this.cacheTimestamp) {
      const ageMinutes = (Date.now() - this.cacheTimestamp) / (1000 * 60);
      if (ageMinutes < this.cacheExpiryMinutes) {
        return this.cachedRates;
      }
    }

    try {
      const response = await apiService.get<ExchangeRates>(`${this.baseUrl}/rates`);
      
      // Cache the rates
      this.cachedRates = response;
      this.cacheTimestamp = Date.now();
      
      return response;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      
      // Return cached rates if available, otherwise throw
      if (this.cachedRates) {
        console.warn('Using cached exchange rates due to API error');
        return this.cachedRates;
      }
      
      throw error;
    }
  }

  /**
   * Convert amount from one currency to SGD
   */
  async convertToSGD(amount: number, fromCurrency: string): Promise<CurrencyConversion> {
    try {
      const response = await apiService.post<CurrencyConversion>(
        `${this.baseUrl}/convert`,
        {},
        {
          params: {
            amount,
            from_currency: fromCurrency,
            to_currency: 'SGD'
          }
        }
      );
      
      return response;
    } catch (error) {
      console.error('Failed to convert currency:', error);
      
      // Fallback to local conversion using cached rates
      try {
        const rates = await this.getExchangeRates();
        const rate = rates[fromCurrency.toUpperCase()];
        
        if (rate && rate > 0) {
          const convertedAmount = amount / rate;
          return {
            original_amount: amount,
            original_currency: fromCurrency.toUpperCase(),
            converted_amount: Math.round(convertedAmount * 100) / 100,
            target_currency: 'SGD',
            rate_source: 'fallback',
            conversion_rate: `1 SGD = ${rate} ${fromCurrency.toUpperCase()}`
          };
        }
      } catch (fallbackError) {
        console.error('Fallback conversion also failed:', fallbackError);
      }
      
      // Final fallback - return original amount
      return {
        original_amount: amount,
        original_currency: fromCurrency.toUpperCase(),
        converted_amount: amount,
        target_currency: 'SGD',
        rate_source: 'error',
        conversion_rate: 'Conversion failed'
      };
    }
  }

  /**
   * Get cache status information
   */
  async getCacheStatus(): Promise<CacheStatus> {
    try {
      const response = await apiService.get<CacheStatus>(`${this.baseUrl}/rates/cache-status`);
      return response;
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return {
        cache_status: 'empty',
        total_currencies: 0,
        last_updated: null,
        age_days: null
      };
    }
  }

  /**
   * Force refresh exchange rates from external API
   */
  async refreshRates(): Promise<{ success: boolean; message: string; rates?: ExchangeRates }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        message: string;
        rates: ExchangeRates;
        cache_info: any;
      }>(`${this.baseUrl}/rates/refresh`);
      
      // Update local cache
      if (response.rates) {
        this.cachedRates = response.rates;
        this.cacheTimestamp = Date.now();
      }
      
      return {
        success: response.success,
        message: response.message,
        rates: response.rates
      };
    } catch (error) {
      console.error('Failed to refresh rates:', error);
      return {
        success: false,
        message: 'Failed to refresh exchange rates'
      };
    }
  }

  /**
   * Get list of supported currencies
   */
  async getSupportedCurrencies(): Promise<SupportedCurrencies> {
    try {
      const response = await apiService.get<SupportedCurrencies>(`${this.baseUrl}/supported-currencies`);
      return response;
    } catch (error) {
      console.error('Failed to get supported currencies:', error);
      
      // Fallback to common currencies
      return {
        base_currency: 'SGD',
        supported_currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'MYR', 'PHP', 'THB', 'INR', 'SGD'],
        total_count: 11
      };
    }
  }

  /**
   * Convert multiple amounts in a batch
   */
  async convertBatch(conversions: Array<{ amount: number; currency: string }>): Promise<CurrencyConversion[]> {
    const results: CurrencyConversion[] = [];
    
    // Get rates once for all conversions
    const rates = await this.getExchangeRates();
    
    for (const { amount, currency } of conversions) {
      try {
        if (currency.toUpperCase() === 'SGD') {
          results.push({
            original_amount: amount,
            original_currency: 'SGD',
            converted_amount: amount,
            target_currency: 'SGD',
            rate_source: 'base',
            conversion_rate: '1 SGD = 1 SGD'
          });
        } else {
          const rate = rates[currency.toUpperCase()];
          if (rate && rate > 0) {
            const convertedAmount = amount / rate;
            results.push({
              original_amount: amount,
              original_currency: currency.toUpperCase(),
              converted_amount: Math.round(convertedAmount * 100) / 100,
              target_currency: 'SGD',
              rate_source: 'cached',
              conversion_rate: `1 SGD = ${rate} ${currency.toUpperCase()}`
            });
          } else {
            results.push({
              original_amount: amount,
              original_currency: currency.toUpperCase(),
              converted_amount: amount,
              target_currency: 'SGD',
              rate_source: 'unsupported',
              conversion_rate: 'Currency not supported'
            });
          }
        }
      } catch (error) {
        results.push({
          original_amount: amount,
          original_currency: currency.toUpperCase(),
          converted_amount: amount,
          target_currency: 'SGD',
          rate_source: 'error',
          conversion_rate: 'Conversion failed'
        });
      }
    }
    
    return results;
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.cachedRates = null;
    this.cacheTimestamp = null;
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();
