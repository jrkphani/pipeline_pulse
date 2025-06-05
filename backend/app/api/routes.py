"""
Main API router that includes all route modules
(Authentication removed - direct access mode)
"""

from fastapi import APIRouter
from .endpoints import upload, analysis, zoho, export, bulk_update, crm, bulk_export, token_management
from . import currency
from .o2r import routes as o2r_routes

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(zoho.router, prefix="/zoho", tags=["zoho"])
api_router.include_router(crm.router, tags=["Unified CRM"])  # New unified CRM router
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(currency.router, prefix="/currency", tags=["currency"])

# Include O2R (Opportunity-to-Revenue) tracker routes
api_router.include_router(o2r_routes.router, prefix="/o2r", tags=["O2R Tracker"])

# Include Bulk Update routes
api_router.include_router(bulk_update.router, tags=["Bulk Update"])

# Include Bulk Export routes
api_router.include_router(bulk_export.router, tags=["Bulk Export"])

# Authentication removed - operating in direct access mode
