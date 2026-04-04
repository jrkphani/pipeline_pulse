"""
Permission management service — Pipeline Pulse v2.0.
Role-based access control without external OAuth dependency.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Role hierarchy
ROLE_PERMISSIONS: Dict[str, Dict[str, Any]] = {
    "admin": {
        "can_manage_users": True,
        "can_manage_settings": True,
        "can_create_opportunities": True,
        "can_edit_all_opportunities": True,
        "can_delete_opportunities": True,
        "can_export": True,
        "can_import": True,
        "can_view_analytics": True,
    },
    "sales_manager": {
        "can_manage_users": False,
        "can_manage_settings": False,
        "can_create_opportunities": True,
        "can_edit_all_opportunities": True,
        "can_delete_opportunities": False,
        "can_export": True,
        "can_import": True,
        "can_view_analytics": True,
    },
    "sales_rep": {
        "can_manage_users": False,
        "can_manage_settings": False,
        "can_create_opportunities": True,
        "can_edit_all_opportunities": False,
        "can_delete_opportunities": False,
        "can_export": True,
        "can_import": False,
        "can_view_analytics": True,
    },
    "viewer": {
        "can_manage_users": False,
        "can_manage_settings": False,
        "can_create_opportunities": False,
        "can_edit_all_opportunities": False,
        "can_delete_opportunities": False,
        "can_export": True,
        "can_import": False,
        "can_view_analytics": True,
    },
}


def get_permissions_for_role(role: str) -> Dict[str, Any]:
    """Get permissions for a given role."""
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["viewer"])
