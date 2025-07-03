"""
Dynamic Currency Conversion Service

Fetches live exchange rates from CurrencyFreaks API and caches them for a week.
Provides SGD conversion for all supported currencies with fallback to static rates.
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, List, Any
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.currency_rate import CurrencyRate
import logging

logger = logging.getLogger(__name__)

class CurrencyService:
    """Service for managing dynamic currency conversion rates"""
    
    # Fallback static rates (used if API fails)
    FALLBACK_RATES = {
        'USD': 0.75,    # 1 SGD = 0.75 USD
        'EUR': 0.68,    # 1 SGD = 0.68 EUR  
        'GBP': 0.58,    # 1 SGD = 0.58 GBP
        'JPY': 110.0,   # 1 SGD = 110 JPY
        'AUD': 1.05,    # 1 SGD = 1.05 AUD
        'CAD': 1.00,    # 1 SGD = 1.00 CAD
        'CHF': 0.68,    # 1 SGD = 0.68 CHF
        'CNY': 5.20,    # 1 SGD = 5.20 CNY
        'HKD': 5.80,    # 1 SGD = 5.80 HKD
        'INR': 62.14,   # 1 SGD = 62.14 INR
        'KRW': 950.0,   # 1 SGD = 950 KRW
        'MYR': 3.20,    # 1 SGD = 3.20 MYR
        'PHP': 42.02,   # 1 SGD = 42.02 PHP
        'THB': 25.0,    # 1 SGD = 25.0 THB
        'TWD': 23.0,    # 1 SGD = 23.0 TWD
        'VND': 18000.0, # 1 SGD = 18000 VND
        'IDR': 11000.0, # 1 SGD = 11000 IDR
        'SGD': 1.0      # Base currency
    }
    
    def __init__(self):
        self.api_key = settings.CURRENCY_API_KEY
        self.base_url = "https://api.currencyfreaks.com/v2.0/rates/latest"
        self.cache_duration_days = 7  # Cache for 1 week
        
    def get_exchange_rates(self, db: Session, force_refresh: bool = False) -> Dict[str, float]:
        """
        Get current exchange rates, using cache if available and not expired
        
        Args:
            db: Database session
            force_refresh: Force API call even if cache is valid
            
        Returns:
            Dictionary of currency codes to SGD conversion rates
        """
        try:
            # Check cache first (unless force refresh)
            if not force_refresh:
                cached_rates = self._get_cached_rates(db)
                if cached_rates:
                    logger.info("Using cached exchange rates")
                    return cached_rates
            
            # Fetch fresh rates from API
            logger.info("Fetching fresh exchange rates from CurrencyFreaks API")
            fresh_rates = self._fetch_rates_from_api()
            
            if fresh_rates:
                # Save to cache
                self._save_rates_to_cache(db, fresh_rates)
                logger.info(f"Successfully fetched and cached {len(fresh_rates)} exchange rates")
                return fresh_rates
            else:
                logger.warning("API call failed, falling back to cached rates")
                cached_rates = self._get_cached_rates(db, ignore_expiry=True)
                if cached_rates:
                    # If this is a force refresh, update timestamps even with cached rates
                    if force_refresh:
                        try:
                            logger.info("Updating cache timestamps for weekly refresh (cached rates)")
                            self._save_rates_to_cache(db, cached_rates)
                        except Exception as e:
                            logger.error(f"Failed to update cache timestamps: {e}")
                    return cached_rates

        except Exception as e:
            logger.error(f"Error in get_exchange_rates: {e}")

        # Final fallback to static rates
        logger.warning("Using fallback static exchange rates")
        fallback_rates = self.FALLBACK_RATES.copy()

        # If this is a force refresh, update cache timestamps even with fallback rates
        if force_refresh:
            try:
                # For force refresh, always update timestamps to mark the refresh
                # Use the best available rates (cached if available, otherwise fallback)
                cached_rates = self._get_cached_rates(db, ignore_expiry=True)
                rates_to_save = cached_rates if cached_rates else fallback_rates

                logger.info("Updating cache timestamps for weekly refresh")
                self._save_rates_to_cache(db, rates_to_save)
            except Exception as e:
                logger.error(f"Failed to update cache during force refresh: {e}")

        return fallback_rates
    
    def _fetch_rates_from_api(self) -> Optional[Dict[str, float]]:
        """Fetch exchange rates from CurrencyFreaks API"""
        try:
            if not self.api_key:
                logger.warning("No API key configured for CurrencyFreaks")
                return None
                
            # CurrencyFreaks API params - use USD as base since SGD might not be supported
            all_currencies = list(self.FALLBACK_RATES.keys())
            params = {
                'apikey': self.api_key,
                'base': 'USD',  # Use USD as base currency
                'symbols': ','.join(all_currencies)  # Include SGD in symbols
            }

            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if 'rates' not in data:
                logger.error(f"Invalid API response format: {data}")
                return None

            # Convert USD-based rates to SGD-based rates
            usd_rates = data['rates']

            # Get USD to SGD rate
            if 'SGD' not in usd_rates:
                logger.error("SGD rate not found in API response")
                return None

            usd_to_sgd = float(usd_rates['SGD'])

            # Convert all rates to SGD base
            rates = {'SGD': 1.0}  # Base currency

            for currency, usd_rate in usd_rates.items():
                if currency == 'SGD':
                    continue  # Already handled
                try:
                    # Convert USD rate to SGD rate
                    # If 1 USD = X SGD and 1 USD = Y Currency
                    # Then 1 SGD = Y/X Currency
                    sgd_rate = float(usd_rate) / usd_to_sgd
                    rates[currency] = sgd_rate
                except (ValueError, TypeError, ZeroDivisionError):
                    logger.warning(f"Invalid rate for {currency}: {usd_rate}")
                    continue
            
            logger.info(f"Successfully fetched rates for {len(rates)} currencies")
            return rates
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse API response: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching rates: {e}")
            return None
    
    def _get_cached_rates(self, db: Session, ignore_expiry: bool = False) -> Optional[Dict[str, float]]:
        """Get exchange rates from database cache"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=self.cache_duration_days)
            
            if ignore_expiry:
                # Get any cached rates, regardless of age
                rates = db.query(CurrencyRate).all()
            else:
                # Get only non-expired rates
                rates = db.query(CurrencyRate).filter(
                    CurrencyRate.updated_at >= cutoff_date
                ).all()
            
            if not rates:
                return None
            
            # Convert to dictionary
            rate_dict = {}
            for rate in rates:
                rate_dict[rate.currency_code] = rate.sgd_rate
            
            # Ensure SGD is included
            rate_dict['SGD'] = 1.0
            
            logger.info(f"Retrieved {len(rate_dict)} cached exchange rates")
            return rate_dict
            
        except Exception as e:
            logger.error(f"Error retrieving cached rates: {e}")
            return None
    
    def _save_rates_to_cache(self, db: Session, rates: Dict[str, float]) -> None:
        """Save exchange rates to database cache"""
        try:
            current_time = datetime.utcnow()
            
            for currency_code, sgd_rate in rates.items():
                if currency_code == 'SGD':
                    continue  # Skip base currency
                
                # Update or create rate record
                existing_rate = db.query(CurrencyRate).filter(
                    CurrencyRate.currency_code == currency_code
                ).first()
                
                if existing_rate:
                    existing_rate.sgd_rate = sgd_rate
                    existing_rate.updated_at = current_time
                else:
                    new_rate = CurrencyRate(
                        currency_code=currency_code,
                        sgd_rate=sgd_rate,
                        updated_at=current_time
                    )
                    db.add(new_rate)
            
            db.commit()
            logger.info(f"Successfully cached {len(rates)} exchange rates")
            
        except Exception as e:
            logger.error(f"Error saving rates to cache: {e}")
            db.rollback()
    
    def convert_to_sgd(self, amount: float, from_currency: str, db: Session) -> Tuple[float, str]:
        """
        Convert amount from given currency to SGD - optimized for SDK bulk operations
        
        Args:
            amount: Amount to convert
            from_currency: Source currency code
            db: Database session
            
        Returns:
            Tuple of (converted_amount, rate_source)
            rate_source can be 'live', 'cached', or 'fallback'
        """
        if not amount or amount == 0:
            return 0.0, 'n/a'
        
        from_currency = from_currency.upper()
        
        if from_currency == 'SGD':
            return amount, 'base'
        
        try:
            # Get current exchange rates
            rates = self.get_exchange_rates(db)
            
            if from_currency in rates:
                sgd_rate = rates[from_currency]
                converted_amount = amount / sgd_rate
                
                # Determine rate source
                cached_rates = self._get_cached_rates(db)
                if cached_rates and from_currency in cached_rates:
                    rate_source = 'live' if rates == cached_rates else 'cached'
                else:
                    rate_source = 'fallback'
                
                return converted_amount, rate_source
            else:
                logger.warning(f"Currency {from_currency} not supported, returning original amount")
                return amount, 'unsupported'
                
        except Exception as e:
            logger.error(f"Error converting {from_currency} to SGD: {e}")
            return amount, 'error'
    
    def bulk_convert_to_sgd(self, currency_amounts: List[Tuple[float, str]], db: Session) -> List[Tuple[float, str]]:
        """
        Bulk convert multiple amounts to SGD for optimal performance with SDK operations
        
        Args:
            currency_amounts: List of (amount, currency) tuples
            db: Database session
            
        Returns:
            List of (converted_amount, rate_source) tuples
        """
        if not currency_amounts:
            return []
        
        try:
            # Get exchange rates once for all conversions
            rates = self.get_exchange_rates(db)
            cached_rates = self._get_cached_rates(db)
            
            results = []
            
            for amount, from_currency in currency_amounts:
                if not amount or amount == 0:
                    results.append((0.0, 'n/a'))
                    continue
                
                from_currency = from_currency.upper()
                
                if from_currency == 'SGD':
                    results.append((amount, 'base'))
                    continue
                
                if from_currency in rates:
                    sgd_rate = rates[from_currency]
                    converted_amount = amount / sgd_rate
                    
                    # Determine rate source
                    if cached_rates and from_currency in cached_rates:
                        rate_source = 'live' if rates == cached_rates else 'cached'
                    else:
                        rate_source = 'fallback'
                    
                    results.append((converted_amount, rate_source))
                else:
                    logger.warning(f"Currency {from_currency} not supported in bulk conversion")
                    results.append((amount, 'unsupported'))
            
            return results
            
        except Exception as e:
            logger.error(f"Error in bulk currency conversion: {e}")
            # Return original amounts with error flag
            return [(amount, 'error') for amount, _ in currency_amounts]

    def get_cache_status(self, db: Session) -> Dict[str, Any]:
        """
        Get detailed cache status information

        Returns:
            Dictionary with cache status details
        """
        try:
            # Get all cached rates
            all_rates = db.query(CurrencyRate).all()

            if not all_rates:
                return {
                    'cache_status': 'empty',
                    'total_currencies': 0,
                    'last_updated': None,
                    'age_days': None,
                    'currencies': []
                }

            # Find the most recent update
            latest_update = max([rate.updated_at for rate in all_rates])
            age_days = (datetime.utcnow() - latest_update).days

            # Determine cache status
            if age_days >= self.cache_duration_days:
                cache_status = 'stale'
            else:
                cache_status = 'fresh'

            # Get list of currencies
            currencies = [rate.currency_code for rate in all_rates]

            return {
                'cache_status': cache_status,
                'total_currencies': len(all_rates),
                'last_updated': latest_update.isoformat(),
                'age_days': age_days,
                'currencies': currencies
            }

        except Exception as e:
            logger.error(f"Error getting cache status: {e}")
            return {
                'cache_status': 'empty',
                'total_currencies': 0,
                'last_updated': None,
                'age_days': None,
                'currencies': []
            }

    def process_sdk_deals_currency(self, deals: List[Dict[str, Any]], db: Session) -> List[Dict[str, Any]]:
        """
        Process currency conversion for SDK deal responses in bulk
        
        Args:
            deals: List of deals from SDK response
            db: Database session
            
        Returns:
            List of deals with SGD amounts added
        """
        try:
            # Extract currency amounts for bulk processing
            currency_amounts = []
            for deal in deals:
                amount = float(deal.get("amount", 0))
                currency = deal.get("currency", "SGD")
                currency_amounts.append((amount, currency))
            
            # Bulk convert
            converted_results = self.bulk_convert_to_sgd(currency_amounts, db)
            
            # Apply results back to deals
            for i, deal in enumerate(deals):
                if i < len(converted_results):
                    sgd_amount, rate_source = converted_results[i]
                    deal["sgd_amount"] = sgd_amount
                    deal["currency_rate_source"] = rate_source
                else:
                    # Fallback
                    deal["sgd_amount"] = deal.get("amount", 0)
                    deal["currency_rate_source"] = "error"
            
            logger.info(f"💱 Bulk processed currency conversion for {len(deals)} deals")
            return deals
            
        except Exception as e:
            logger.error(f"Error processing SDK deals currency: {e}")
            # Return deals with original amounts as fallback
            for deal in deals:
                deal["sgd_amount"] = deal.get("amount", 0)
                deal["currency_rate_source"] = "error"
            return deals

# Global instance
currency_service = CurrencyService()
