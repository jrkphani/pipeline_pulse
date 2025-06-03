"""
Currency API endpoints

Provides endpoints for managing currency conversion rates and manual refresh.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime

from app.core.database import get_db
from app.services.currency_service import currency_service
from app.models.currency_rate import CurrencyRate

router = APIRouter(tags=["currency"])

@router.get("/rates")
async def get_current_rates(db: Session = Depends(get_db)):
    """
    Get current exchange rates for all supported currencies

    Returns rates in format: 1 SGD = X units of currency
    """
    try:
        rates = currency_service.get_exchange_rates(db)
        return {
            "rates": rates,
            "base_currency": "SGD",
            "last_updated": datetime.utcnow().isoformat(),
            "total_currencies": len(rates)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get exchange rates: {str(e)}")

@router.post("/rates/refresh")
async def refresh_rates(db: Session = Depends(get_db)):
    """
    Force refresh of exchange rates from external API
    
    This will bypass the cache and fetch fresh rates from CurrencyFreaks API
    """
    try:
        rates = currency_service.get_exchange_rates(db, force_refresh=True)
        
        # Get cache info
        cached_rates = db.query(CurrencyRate).all()
        cache_info = {
            'total_currencies': len(rates),
            'cached_currencies': len(cached_rates),
            'last_updated': max([r.updated_at for r in cached_rates]).isoformat() if cached_rates else None
        }
        
        return {
            'success': True,
            'message': 'Exchange rates refreshed successfully',
            'rates': rates,
            'cache_info': cache_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh exchange rates: {str(e)}")

@router.get("/rates/cache-status")
async def get_cache_status(db: Session = Depends(get_db)):
    """
    Get information about the current exchange rate cache
    """
    try:
        cached_rates = db.query(CurrencyRate).all()
        
        if not cached_rates:
            return {
                'cache_status': 'empty',
                'total_currencies': 0,
                'last_updated': None,
                'age_days': None
            }
        
        latest_update = max([r.updated_at for r in cached_rates])
        age_days = (datetime.utcnow() - latest_update).days
        
        cache_status = 'fresh' if age_days < 7 else 'stale'
        
        return {
            'cache_status': cache_status,
            'total_currencies': len(cached_rates),
            'last_updated': latest_update.isoformat(),
            'age_days': age_days,
            'currencies': [r.currency_code for r in cached_rates]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache status: {str(e)}")

@router.post("/convert")
async def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str = "SGD",
    db: Session = Depends(get_db)
):
    """
    Convert amount between currencies
    
    Args:
        amount: Amount to convert
        from_currency: Source currency code (e.g., 'USD')
        to_currency: Target currency code (default: 'SGD')
    """
    try:
        if to_currency.upper() != 'SGD':
            raise HTTPException(status_code=400, detail="Only conversion to SGD is currently supported")
        
        converted_amount, rate_source = currency_service.convert_to_sgd(amount, from_currency, db)
        
        return {
            'original_amount': amount,
            'original_currency': from_currency.upper(),
            'converted_amount': round(converted_amount, 2),
            'target_currency': 'SGD',
            'rate_source': rate_source,
            'conversion_rate': f"1 SGD = {currency_service.get_exchange_rates(db).get(from_currency.upper(), 'N/A')} {from_currency.upper()}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to convert currency: {str(e)}")

@router.get("/supported-currencies")
async def get_supported_currencies():
    """
    Get list of all supported currency codes
    """
    return {
        'base_currency': 'SGD',
        'supported_currencies': list(currency_service.FALLBACK_RATES.keys()),
        'total_count': len(currency_service.FALLBACK_RATES)
    }
