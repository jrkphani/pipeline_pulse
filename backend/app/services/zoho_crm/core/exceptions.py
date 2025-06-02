"""
Custom exceptions for Zoho CRM integration
"""

from typing import Optional, Dict, Any


class ZohoAPIError(Exception):
    """Base exception for Zoho API errors"""
    
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class ZohoAuthError(ZohoAPIError):
    """Authentication related errors"""
    pass


class ZohoRateLimitError(ZohoAPIError):
    """Rate limit exceeded errors"""
    
    def __init__(self, message: str, retry_after: Optional[int] = None, **kwargs):
        self.retry_after = retry_after
        super().__init__(message, **kwargs)


class ZohoValidationError(ZohoAPIError):
    """Data validation errors"""
    
    def __init__(self, message: str, field_errors: Optional[Dict[str, str]] = None, **kwargs):
        self.field_errors = field_errors or {}
        super().__init__(message, **kwargs)


class ZohoConflictError(ZohoAPIError):
    """Data conflict errors during sync operations"""
    
    def __init__(self, message: str, local_data: Optional[Dict[str, Any]] = None, 
                 zoho_data: Optional[Dict[str, Any]] = None, **kwargs):
        self.local_data = local_data
        self.zoho_data = zoho_data
        super().__init__(message, **kwargs)


class ZohoBulkOperationError(ZohoAPIError):
    """Bulk operation specific errors"""
    
    def __init__(self, message: str, job_id: Optional[str] = None, 
                 failed_records: Optional[list] = None, **kwargs):
        self.job_id = job_id
        self.failed_records = failed_records or []
        super().__init__(message, **kwargs)


class ZohoFieldError(ZohoAPIError):
    """Field metadata and validation errors"""
    
    def __init__(self, message: str, field_name: Optional[str] = None, 
                 field_type: Optional[str] = None, **kwargs):
        self.field_name = field_name
        self.field_type = field_type
        super().__init__(message, **kwargs)


class ZohoSyncError(ZohoAPIError):
    """Synchronization operation errors"""
    
    def __init__(self, message: str, sync_operation: Optional[str] = None, 
                 affected_records: Optional[list] = None, **kwargs):
        self.sync_operation = sync_operation
        self.affected_records = affected_records or []
        super().__init__(message, **kwargs)
