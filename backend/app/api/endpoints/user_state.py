"""
User State Management API Endpoints
Handles state persistence and synchronization for Zustand stores
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.core.database import get_db
from app.services.state_manager import state_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/state", tags=["User State"])


class User:
    """Simple user class for state management"""
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email


async def get_current_user(db: Session = Depends(get_db)) -> User:
    """Get current authenticated user"""
    # This would normally check the token/session
    # For now, returning a mock user
    return User(id="current-user-id", email="user@example.com")


@router.get("")
async def get_user_state(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get the complete state for the current user
    
    Returns:
        Complete user state including auth, ui, app, and filter states
    """
    try:
        state = await state_manager.get_user_state(current_user.id, db)
        return {
            "status": "success",
            "data": state,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get user state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_user_state(
    state_updates: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update user state with partial updates
    
    Args:
        state_updates: Dictionary with keys: auth, ui, app, filters
        
    Returns:
        Updated complete user state
    """
    try:
        # Validate update structure
        valid_keys = {"auth", "ui", "app", "filters"}
        invalid_keys = set(state_updates.keys()) - valid_keys
        
        if invalid_keys:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid state keys: {invalid_keys}. Valid keys: {valid_keys}"
            )
        
        # Update state
        updated_state = await state_manager.update_user_state(
            current_user.id,
            state_updates,
            db,
            source="client"
        )
        
        return {
            "status": "success",
            "data": updated_state,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to update user state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync")
async def sync_state_batch(
    changes: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Sync multiple state changes in a batch
    
    Args:
        changes: List of state changes with timestamps
        
    Returns:
        Final synchronized state
    """
    try:
        # Validate batch structure
        for i, change in enumerate(changes):
            if "state" not in change:
                raise HTTPException(
                    status_code=400,
                    detail=f"Change at index {i} missing 'state' field"
                )
        
        # Apply batch
        final_state = await state_manager.sync_state_batch(
            current_user.id,
            changes,
            db
        )
        
        return {
            "status": "success",
            "data": final_state,
            "applied_changes": len(changes),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to sync state batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_state_history(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get state change history for debugging
    
    Args:
        limit: Number of changes to return (max 200)
        
    Returns:
        List of state changes with timestamps
    """
    try:
        history = await state_manager.get_state_history(
            current_user.id,
            db,
            limit=limit
        )
        
        return {
            "status": "success",
            "data": history,
            "count": len(history),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get state history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear")
async def clear_user_state(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Clear all state for the current user
    
    Returns:
        Success status
    """
    try:
        success = await state_manager.clear_user_state(current_user.id, db)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to clear user state"
            )
        
        return {
            "status": "success",
            "message": "User state cleared successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to clear user state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket functionality removed for now
# APIRouter doesn't support WebSocket endpoints directly
# Real-time updates can be implemented using Server-Sent Events (SSE) or polling