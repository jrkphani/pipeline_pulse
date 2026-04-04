from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import get_db  # single canonical get_db — re-exported for importers
from .security import verify_token
from ..models.user import User, UserRole
import structlog

logger = structlog.get_logger()

# HTTPBearer for Swagger UI / API clients — auto_error=False so we can
# fall back to the httpOnly cookie without a hard 403 from the scheme itself.
_bearer_scheme = HTTPBearer(auto_error=False)

# Roles that can create / manage opportunities
_SALES_ROLES = {
    UserRole.admin,
    UserRole.cro,
    UserRole.sales_manager,
    UserRole.ae,
    UserRole.sdr,
    UserRole.aws_alliance_manager,
}

# Roles that can trigger / manage sync operations
_SYNC_MANAGER_ROLES = {
    UserRole.admin,
    UserRole.cro,
    UserRole.aws_alliance_manager,
}


# ---------------------------------------------------------------------------
# Token extraction
# ---------------------------------------------------------------------------

def _extract_token(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials],
) -> str:
    """
    Resolve a JWT from (in priority order):
      1. Authorization: Bearer <token> header  (API / Swagger clients)
      2. access_token httpOnly cookie          (browser clients)

    Raises HTTP 401 if neither is present.
    """
    if bearer and bearer.credentials:
        return bearer.credentials

    cookie_token: Optional[str] = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


# ---------------------------------------------------------------------------
# Core auth dependency
# ---------------------------------------------------------------------------

async def get_current_user(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Authenticate the request and return the active User.

    Accepts a JWT via:
      - Authorization: Bearer header
      - access_token httpOnly cookie
    """
    token = _extract_token(request, bearer)

    try:
        payload = verify_token(token)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Token verification failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user: Optional[User] = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )

    logger.info("Authenticated", user_id=user.id, role=user.role)
    return user


# ---------------------------------------------------------------------------
# Role-gated dependencies
# ---------------------------------------------------------------------------

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require superuser flag."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


async def get_current_sales_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require a role that can create and manage opportunities."""
    if current_user.role not in _SALES_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for sales operations",
        )
    return current_user


async def get_current_sync_manager(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require a role that can trigger sync operations."""
    if current_user.role not in _SYNC_MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for sync management",
        )
    return current_user
