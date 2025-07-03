"""
State Management Service for Pipeline Pulse
Handles persistent storage and synchronization of user state
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
import json
import asyncio
import uuid

from app.models.user_state import UserState, StateChangeLog
from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)


class StateManager:
    """
    Manages user state persistence and synchronization
    """
    
    def __init__(self):
        self._lock = asyncio.Lock()
        self.sync_debounce_seconds = 2  # Debounce sync operations
        self._pending_syncs = {}
        
    async def get_user_state(self, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Get the current state for a user
        """
        try:
            user_state = db.query(UserState).filter(
                and_(
                    UserState.user_id == user_id,
                    UserState.is_active == True
                )
            ).first()
            
            if not user_state:
                # Create default state
                user_state = await self._create_default_state(user_id, db)
            
            return {
                "auth": user_state.auth_state or {},
                "ui": user_state.ui_state or {},
                "app": user_state.app_state or {},
                "filters": user_state.filter_state or {},
                "version": user_state.state_version,
                "last_synced": user_state.last_synced_at.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get user state: {e}")
            raise
    
    async def update_user_state(
        self, 
        user_id: str, 
        state_updates: Dict[str, Any],
        db: Session,
        source: str = "client"
    ) -> Dict[str, Any]:
        """
        Update user state with debouncing and conflict resolution
        """
        async with self._lock:
            try:
                # Get or create user state
                user_state = db.query(UserState).filter(
                    and_(
                        UserState.user_id == user_id,
                        UserState.is_active == True
                    )
                ).first()
                
                if not user_state:
                    user_state = await self._create_default_state(user_id, db)
                
                # Log changes before update
                await self._log_state_changes(
                    user_state, 
                    state_updates, 
                    source, 
                    db
                )
                
                # Apply updates
                if "auth" in state_updates:
                    user_state.auth_state = {
                        **(user_state.auth_state or {}), 
                        **state_updates["auth"]
                    }
                
                if "ui" in state_updates:
                    user_state.ui_state = {
                        **(user_state.ui_state or {}), 
                        **state_updates["ui"]
                    }
                
                if "app" in state_updates:
                    user_state.app_state = {
                        **(user_state.app_state or {}), 
                        **state_updates["app"]
                    }
                
                if "filters" in state_updates:
                    user_state.filter_state = state_updates["filters"]
                
                # Update metadata
                user_state.state_version += 1
                user_state.last_synced_at = datetime.now()
                user_state.sync_status = "synced"
                user_state.sync_error = None
                
                db.commit()
                
                logger.info(f"Updated state for user {user_id}, version {user_state.state_version}")
                
                return await self.get_user_state(user_id, db)
                
            except Exception as e:
                logger.error(f"Failed to update user state: {e}")
                db.rollback()
                
                # Mark sync as failed
                if user_state:
                    user_state.sync_status = "error"
                    user_state.sync_error = str(e)
                    db.commit()
                
                raise
    
    async def sync_state_batch(
        self, 
        user_id: str, 
        state_changes: List[Dict[str, Any]],
        db: Session
    ) -> Dict[str, Any]:
        """
        Sync multiple state changes in a batch
        """
        try:
            # Apply changes in order
            result = None
            for change in state_changes:
                result = await self.update_user_state(
                    user_id, 
                    change["state"],
                    db,
                    source=change.get("source", "client")
                )
            
            return result or await self.get_user_state(user_id, db)
            
        except Exception as e:
            logger.error(f"Failed to sync state batch: {e}")
            raise
    
    async def get_state_history(
        self, 
        user_id: str, 
        db: Session,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get state change history for debugging
        """
        try:
            changes = db.query(StateChangeLog).filter(
                StateChangeLog.user_id == user_id
            ).order_by(
                desc(StateChangeLog.server_timestamp)
            ).limit(limit).all()
            
            return [
                {
                    "id": change.id,
                    "type": change.change_type,
                    "previous": change.previous_value,
                    "new": change.new_value,
                    "source": change.change_source,
                    "timestamp": change.server_timestamp.isoformat()
                }
                for change in changes
            ]
            
        except Exception as e:
            logger.error(f"Failed to get state history: {e}")
            raise
    
    async def clear_user_state(self, user_id: str, db: Session) -> bool:
        """
        Clear all state for a user (logout/reset)
        """
        try:
            # Deactivate current state
            user_state = db.query(UserState).filter(
                and_(
                    UserState.user_id == user_id,
                    UserState.is_active == True
                )
            ).first()
            
            if user_state:
                user_state.is_active = False
                user_state.sync_status = "cleared"
                db.commit()
                logger.info(f"Cleared state for user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear user state: {e}")
            db.rollback()
            return False
    
    async def _create_default_state(self, user_id: str, db: Session) -> UserState:
        """
        Create default state for new user
        """
        default_state = UserState(
            user_id=user_id,
            auth_state={
                "isAuthenticated": False,
                "lastLogin": None
            },
            ui_state={
                "theme": "light",
                "sidebarOpen": True,
                "fontSize": "medium",
                "highContrast": False,
                "keyboardNav": False
            },
            app_state={
                "lastRoute": "/dashboard",
                "recentSearches": [],
                "favoriteFilters": []
            },
            filter_state={
                "dateRange": "last30days",
                "territories": [],
                "serviceLines": [],
                "dealStages": []
            }
        )
        
        db.add(default_state)
        db.commit()
        
        return default_state
    
    async def _log_state_changes(
        self,
        user_state: UserState,
        updates: Dict[str, Any],
        source: str,
        db: Session
    ):
        """
        Log state changes for audit
        """
        sync_id = str(uuid.uuid4())
        
        for change_type, new_value in updates.items():
            # Get previous value
            previous_value = None
            if change_type == "auth":
                previous_value = user_state.auth_state
            elif change_type == "ui":
                previous_value = user_state.ui_state
            elif change_type == "app":
                previous_value = user_state.app_state
            elif change_type == "filters":
                previous_value = user_state.filter_state
            
            # Create log entry
            log_entry = StateChangeLog(
                user_state_id=user_state.id,
                user_id=user_state.user_id,
                change_type=change_type,
                previous_value=previous_value,
                new_value=new_value,
                change_source=source,
                sync_id=sync_id,
                client_timestamp=datetime.now()
            )
            
            db.add(log_entry)


# Singleton instance
state_manager = StateManager()