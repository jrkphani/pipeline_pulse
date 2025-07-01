"""
Simplified API router for live CRM integration
"""

from fastapi import APIRouter
from .endpoints import analysis, zoho, export, auth
from . import currency
from .o2r import routes as o2r_routes

# Create main API router
api_router = APIRouter()

# Core endpoints (no upload/bulk update)
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(zoho.router, prefix="/zoho", tags=["zoho"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(currency.router, prefix="/currency", tags=["currency"])

# Enhanced O2R with live CRM data
api_router.include_router(o2r_routes.router, prefix="/o2r", tags=["O2R Tracker"])

# Authentication
api_router.include_router(auth.router, tags=["Authentication"])
