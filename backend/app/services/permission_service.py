"""
Permission management service with smart caching
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.services.zoho_service import ZohoService
from app.models.user import User, UserSession
from app.core.database import get_db

logger = logging.getLogger(__name__)


class PermissionManager:
    """Smart permission caching and management"""
    
    def __init__(self):
        self.zoho_service = ZohoService()
        self.cache_duration = timedelta(hours=1)  # Adjust based on needs
    
    async def get_user_permissions(self, user_id: str, access_token: str, db: Session) -> Dict[str, Any]:
        """
        Get permissions with smart caching strategy
        """
        try:
            # 1. Check database cache first
            user = db.query(User).filter(User.zoho_user_id == user_id).first()
            
            if user and user.is_role_cache_valid:
                logger.info(f"Using cached permissions for user {user_id}")
                return {
                    'module_permissions': user.module_permissions or {},
                    'field_permissions': user.field_permissions or {},
                    'territories': user.territory_assignments or [],
                    'profile': {
                        'id': user.zoho_user_id,
                        'email': user.email,
                        'full_name': user.full_name,
                        'role_name': user.zoho_role_name,
                        'profile_name': user.zoho_profile_name
                    },
                    'is_admin': user.is_admin,
                    'cached': True
                }
            
            # 2. Fetch fresh from Zoho (cache miss or expired)
            logger.info(f"Fetching fresh permissions for user {user_id}")
            fresh_permissions = await self.fetch_fresh_permissions(user_id, access_token)
            
            # 3. Update cache
            await self.update_user_cache(user_id, fresh_permissions, db)
            
            return fresh_permissions
            
        except Exception as e:
            logger.error(f"Error getting user permissions: {str(e)}")
            # Fallback to cached data even if expired
            if user:
                logger.warning(f"Using expired cache for user {user_id}")
                return {
                    'module_permissions': user.module_permissions or {},
                    'field_permissions': user.field_permissions or {},
                    'territories': user.territory_assignments or [],
                    'profile': {
                        'id': user.zoho_user_id,
                        'email': user.email,
                        'full_name': user.full_name
                    },
                    'cached': True,
                    'expired': True
                }
            
            # Ultimate fallback - minimal readonly permissions
            return self.get_minimal_readonly_permissions()
    
    async def fetch_fresh_permissions(self, user_id: str, access_token: str) -> Dict[str, Any]:
        """
        Fetch permissions directly from Zoho
        """
        try:
            # Get complete user info from Zoho
            user_info = await self.zoho_service.get_complete_user_info(access_token)
            
            profile = user_info.get('profile', {})
            permissions = user_info.get('permissions', {})
            territories = user_info.get('territories', [])
            
            return {
                'profile': profile,
                'module_permissions': permissions,
                'field_permissions': {},  # Can be extended later
                'territories': territories,
                'is_admin': self._is_admin_role(profile),
                'fetched_at': datetime.now().isoformat(),
                'cached': False
            }
            
        except Exception as e:
            logger.error(f"Error fetching fresh permissions: {str(e)}")
            raise
    
    async def update_user_cache(self, user_id: str, permissions: Dict[str, Any], db: Session):
        """
        Update user cache with fresh permissions
        """
        try:
            profile = permissions.get('profile', {})
            
            # Find or create user
            user = db.query(User).filter(User.zoho_user_id == user_id).first()
            
            if not user:
                user = User(
                    zoho_user_id=user_id,
                    email=profile.get('email', ''),
                    first_name=profile.get('first_name', ''),
                    last_name=profile.get('last_name', ''),
                    display_name=profile.get('full_name', ''),
                )
                db.add(user)
            
            # Update user with fresh data
            user.email = profile.get('email', user.email)
            user.first_name = profile.get('first_name', user.first_name)
            user.last_name = profile.get('last_name', user.last_name)
            user.display_name = profile.get('full_name', user.display_name)
            user.zoho_role_name = profile.get('role', {}).get('name', '')
            user.zoho_profile_name = profile.get('profile', {}).get('name', '')
            user.module_permissions = permissions.get('module_permissions', {})
            user.field_permissions = permissions.get('field_permissions', {})
            user.territory_assignments = permissions.get('territories', [])
            user.last_role_sync = datetime.now()
            user.role_cache_valid_until = datetime.now() + self.cache_duration
            user.last_login = datetime.now()
            
            db.commit()
            logger.info(f"Updated cache for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error updating user cache: {str(e)}")
            db.rollback()
    
    def _is_admin_role(self, profile: Dict[str, Any]) -> bool:
        """
        Check if user has admin role based on profile
        """
        role_name = profile.get('role', {}).get('name', '').lower()
        profile_name = profile.get('profile', {}).get('name', '').lower()
        
        admin_keywords = ['administrator', 'admin', 'super', 'manager']
        
        return any(keyword in role_name or keyword in profile_name for keyword in admin_keywords)
    
    def get_minimal_readonly_permissions(self) -> Dict[str, Any]:
        """
        Return minimal readonly permissions as fallback
        """
        return {
            'module_permissions': {
                'Deals': {'view': True, 'edit': False, 'create': False, 'delete': False}
            },
            'field_permissions': {},
            'territories': [],
            'profile': {'id': 'unknown', 'email': 'unknown'},
            'is_admin': False,
            'fallback': True
        }


class PermissionChecker:
    """Real-time permission checking"""
    
    def __init__(self, permission_manager: PermissionManager):
        self.permission_manager = permission_manager
    
    async def check_permissions(self, user_id: str, action: str, resource: str = None, 
                               access_token: str = None, db: Session = None) -> bool:
        """
        Real-time permission checking
        """
        try:
            # Get user permissions
            permissions = await self.permission_manager.get_user_permissions(user_id, access_token, db)
            
            # Check specific action
            if action == 'view_deals':
                return permissions['module_permissions'].get('Deals', {}).get('view', False)
            
            elif action == 'edit_deals':
                return permissions['module_permissions'].get('Deals', {}).get('edit', False)
            
            elif action == 'create_deals':
                return permissions['module_permissions'].get('Deals', {}).get('create', False)
            
            elif action == 'delete_deals':
                return permissions['module_permissions'].get('Deals', {}).get('delete', False)
            
            elif action == 'bulk_update':
                return permissions['module_permissions'].get('Deals', {}).get('mass_update', False)
            
            elif action == 'view_territory':
                if permissions.get('is_admin', False):
                    return True
                return resource in permissions.get('territories', [])
            
            elif action == 'admin_access':
                return permissions.get('is_admin', False)
            
            # Default deny
            return False
            
        except Exception as e:
            logger.error(f"Error checking permissions: {str(e)}")
            return False  # Fail secure
    
    async def get_accessible_territories(self, user_id: str, access_token: str = None, 
                                       db: Session = None) -> List[str]:
        """
        Get list of territories user can access
        """
        try:
            permissions = await self.permission_manager.get_user_permissions(user_id, access_token, db)
            
            # Admins can access all territories
            if permissions.get('is_admin', False):
                # Return all territories (you might want to fetch this from Zoho)
                return ['ALL_TERRITORIES']
            
            return permissions.get('territories', [])
            
        except Exception as e:
            logger.error(f"Error getting accessible territories: {str(e)}")
            return []


class RoleBasedQueryBuilder:
    """Build queries based on user roles and permissions"""
    
    def __init__(self, user_permissions: Dict[str, Any]):
        self.permissions = user_permissions
    
    def build_opportunity_filter(self) -> Dict[str, Any]:
        """
        Build query filters based on user permissions
        """
        filters = {}
        
        # Territory-based filtering
        territories = self.permissions.get('territories', [])
        if territories and not self.permissions.get('is_admin', False):
            filters['territory__in'] = territories
        
        # Owner-based filtering (if not admin and no view_all permission)
        if not self._can_view_all_deals():
            profile = self.permissions.get('profile', {})
            filters['owner_email'] = profile.get('email')
        
        return filters
    
    def _can_view_all_deals(self) -> bool:
        """
        Check if user can view all deals
        """
        if self.permissions.get('is_admin', False):
            return True
        
        deals_perms = self.permissions.get('module_permissions', {}).get('Deals', {})
        return deals_perms.get('view_all', False)


# Global instances
permission_manager = PermissionManager()
permission_checker = PermissionChecker(permission_manager)
