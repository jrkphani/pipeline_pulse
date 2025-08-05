from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
from ....core.database import get_db
from ....core.deps import get_current_user, get_current_sync_manager
from ....models.user import User

logger = structlog.get_logger()
router = APIRouter()


@router.post("/full")
async def trigger_full_sync(
    current_user: User = Depends(get_current_sync_manager),
    db: AsyncSession = Depends(get_db),
):
    """Trigger full Zoho CRM synchronization."""
    logger.info(
        "Full sync requested",
        user_id=current_user.id,
        user_email=current_user.email,
    )
    raise NotImplementedError("Zoho CRM synchronization not implemented")


@router.post("/incremental")
async def trigger_incremental_sync(
    current_user: User = Depends(get_current_sync_manager),
    db: AsyncSession = Depends(get_db),
):
    """Trigger incremental Zoho CRM synchronization."""
    logger.info(
        "Incremental sync requested",
        user_id=current_user.id,
        user_email=current_user.email,
    )
    raise NotImplementedError("Zoho CRM synchronization not implemented")


@router.get("/status")
async def get_sync_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current sync status."""
    raise NotImplementedError("Sync status tracking not implemented")


@router.get("/sessions")
async def get_sync_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get sync session history."""
    raise NotImplementedError("Sync session management not implemented")