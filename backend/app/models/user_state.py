"""
User State Management Models for Pipeline Pulse
Provides persistent storage for user-specific application state
"""

from sqlalchemy import Column, String, DateTime, JSON, Text, Boolean, Integer
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base
import uuid


class UserState(Base):
    """
    Stores user-specific application state for persistence across sessions
    """
    
    __tablename__ = "user_states"
    
    # Primary identifiers
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(100), nullable=False, index=True)
    
    # State categories
    auth_state = Column(JSON, nullable=True)  # Authentication related state
    ui_state = Column(JSON, nullable=True)    # UI preferences and settings
    app_state = Column(JSON, nullable=True)   # Application specific state
    filter_state = Column(JSON, nullable=True) # Current filter selections
    
    # State management
    state_version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    
    # Sync metadata
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now())
    sync_status = Column(String(50), default="synced")  # synced, pending, error
    sync_error = Column(Text, nullable=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def merge_state(self, new_state: dict) -> dict:
        """Merge new state with existing state"""
        merged = {}
        
        # Merge each state category
        if new_state.get('auth'):
            merged['auth_state'] = {**(self.auth_state or {}), **new_state['auth']}
        
        if new_state.get('ui'):
            merged['ui_state'] = {**(self.ui_state or {}), **new_state['ui']}
        
        if new_state.get('app'):
            merged['app_state'] = {**(self.app_state or {}), **new_state['app']}
        
        if new_state.get('filters'):
            merged['filter_state'] = new_state['filters']  # Replace filters entirely
        
        return merged


class StateChangeLog(Base):
    """
    Logs all state changes for debugging and audit purposes
    """
    
    __tablename__ = "state_change_logs"
    
    # Primary identifiers
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_state_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    
    # Change details
    change_type = Column(String(50), nullable=False)  # auth, ui, app, filters
    previous_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    change_source = Column(String(50), default="client")  # client, server, sync
    
    # Metadata
    client_timestamp = Column(DateTime(timezone=True), nullable=True)
    server_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Sync tracking
    sync_id = Column(String(36), nullable=True)  # To group related changes
    is_synced = Column(Boolean, default=False)