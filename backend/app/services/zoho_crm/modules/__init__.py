"""
Zoho CRM module managers
"""

from .deals import ZohoDealManager
from .fields import ZohoFieldManager
from .bulk_async import ZohoAsyncBulkManager

__all__ = [
    "ZohoDealManager",
    "ZohoFieldManager", 
    "ZohoAsyncBulkManager"
]
