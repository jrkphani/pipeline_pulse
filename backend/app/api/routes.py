"""
Simplified API router for live CRM integration
"""

from fastapi import APIRouter
from .endpoints import (
    analysis, crm, export, oauth, bulk_export,
    live_sync, crm_auth, bulk_operations, search_records, sync_analytics, webhooks
)
from . import currency
from .o2r import routes as o2r_routes

# Create main API router
api_router = APIRouter()

# Core endpoints
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(crm.router, tags=["CRM"])  # CRM endpoints at /api/crm/*
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(currency.router, prefix="/currency", tags=["currency"])

# Live Sync System endpoints
api_router.include_router(live_sync.router, tags=["Live Sync"])  # /api/sync/*
api_router.include_router(crm_auth.router, tags=["CRM Authentication"])  # /api/auth/*
api_router.include_router(bulk_operations.router, tags=["Bulk Operations"])  # /api/bulk/*
api_router.include_router(search_records.router, tags=["Search & Records"])  # /api/search/*
api_router.include_router(sync_analytics.router, tags=["Sync Analytics"])  # /api/analytics/*

# Bulk Export for Zoho CRM data
api_router.include_router(bulk_export.router, tags=["Bulk Export"])

# Enhanced O2R with live CRM data
api_router.include_router(o2r_routes.router, prefix="/o2r", tags=["O2R Tracker"])

# OAuth Authentication - includes /api/zoho/* endpoints
api_router.include_router(oauth.router, tags=["OAuth"])

# Webhook endpoints for real-time CRM updates
api_router.include_router(webhooks.router, tags=["Webhooks"])
