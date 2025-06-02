"""
Unified Zoho CRM Integration Module
Consolidates all Zoho CRM functionality into a single, efficient module
"""

from .unified_crm_service import UnifiedZohoCRMService
from .core.exceptions import (
    ZohoAPIError,
    ZohoAuthError,
    ZohoRateLimitError,
    ZohoValidationError,
    ZohoConflictError,
    ZohoBulkOperationError,
    ZohoFieldError,
    ZohoSyncError
)

__all__ = [
    "UnifiedZohoCRMService",
    "ZohoAPIError",
    "ZohoAuthError", 
    "ZohoRateLimitError",
    "ZohoValidationError",
    "ZohoConflictError",
    "ZohoBulkOperationError",
    "ZohoFieldError",
    "ZohoSyncError"
]
