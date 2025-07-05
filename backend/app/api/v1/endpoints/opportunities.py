from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import structlog
from ....core.database import get_db
from ....core.deps import get_current_user, get_current_sales_user
from ....models.user import User
from ....schemas.opportunity_schemas import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OpportunityListResponse,
    BulkHealthStatusUpdate,
)
from ....services.opportunity_service import OpportunityService
from ....models.opportunity import HealthStatus

logger = structlog.get_logger()
router = APIRouter()


@router.post(
    "/",
    response_model=OpportunityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new opportunity",
    description="Create a new opportunity with automatic currency conversion to SGD"
)
async def create_opportunity(
    opportunity_data: OpportunityCreate,
    current_user: User = Depends(get_current_sales_user),
    db: AsyncSession = Depends(get_db),
) -> OpportunityResponse:
    """Create new opportunity."""
    try:
        opportunity_service = OpportunityService(db)
        opportunity = await opportunity_service.create_opportunity(opportunity_data)
        
        logger.info(
            "Opportunity created",
            opportunity_id=opportunity.id,
            name=opportunity.name,
            amount_sgd=float(opportunity.amount_sgd)
        )
        
        return opportunity
        
    except ValueError as e:
        logger.warning(f"Validation error creating opportunity: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error creating opportunity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/",
    response_model=OpportunityListResponse,
    summary="Get opportunities",
    description="Retrieve opportunities with filtering and pagination"
)
async def get_opportunities(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    health_status: Optional[HealthStatus] = Query(None, description="Filter by health status"),
    territory_id: Optional[int] = Query(None, ge=1, description="Filter by territory"),
    phase: Optional[int] = Query(None, ge=1, le=4, description="Filter by O2R phase"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OpportunityListResponse:
    """Get opportunities with filtering."""
    try:
        opportunity_service = OpportunityService(db)
        
        filters = {}
        if health_status:
            filters["health_status"] = health_status
        if territory_id:
            filters["territory_id"] = territory_id
        if phase:
            filters["phase"] = phase
        
        result = await opportunity_service.get_opportunities(
            page=page,
            page_size=page_size,
            filters=filters
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving opportunities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving opportunities"
        )


@router.get(
    "/{opportunity_id}",
    response_model=OpportunityResponse,
    summary="Get opportunity by ID",
    description="Retrieve a specific opportunity by its ID"
)
async def get_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OpportunityResponse:
    """Get opportunity by ID."""
    try:
        opportunity_service = OpportunityService(db)
        opportunity = await opportunity_service.get_opportunity_by_id(opportunity_id)
        
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity {opportunity_id} not found"
            )
        
        return opportunity
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving opportunity {opportunity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving opportunity"
        )


@router.put(
    "/{opportunity_id}",
    response_model=OpportunityResponse,
    summary="Update opportunity",
    description="Update an existing opportunity"
)
async def update_opportunity(
    opportunity_id: int,
    opportunity_data: OpportunityUpdate,
    current_user: User = Depends(get_current_sales_user),
    db: AsyncSession = Depends(get_db),
) -> OpportunityResponse:
    """Update opportunity."""
    try:
        opportunity_service = OpportunityService(db)
        opportunity = await opportunity_service.update_opportunity(opportunity_id, opportunity_data)
        
        if not opportunity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity {opportunity_id} not found"
            )
        
        logger.info(
            "Opportunity updated",
            opportunity_id=opportunity.id,
            name=opportunity.name
        )
        
        return opportunity
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Validation error updating opportunity: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating opportunity {opportunity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating opportunity"
        )


@router.delete(
    "/{opportunity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete opportunity",
    description="Delete an opportunity"
)
async def delete_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_sales_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete opportunity."""
    try:
        opportunity_service = OpportunityService(db)
        success = await opportunity_service.delete_opportunity(opportunity_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity {opportunity_id} not found"
            )
        
        logger.info("Opportunity deleted", opportunity_id=opportunity_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting opportunity {opportunity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting opportunity"
        )


@router.post(
    "/bulk-update-health",
    response_model=dict,
    summary="Bulk update health status",
    description="Update health status for multiple opportunities"
)
async def bulk_update_health_status(
    update_data: BulkHealthStatusUpdate,
    current_user: User = Depends(get_current_sales_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk update health status."""
    try:
        opportunity_service = OpportunityService(db)
        updated_count = await opportunity_service.bulk_update_health_status(
            opportunity_ids=update_data.opportunity_ids,
            health_status=update_data.health_status
        )
        
        logger.info(
            "Bulk health status update",
            updated_count=updated_count,
            opportunity_ids=update_data.opportunity_ids,
            new_status=update_data.health_status.value
        )
        
        return {"updated": updated_count}
        
    except Exception as e:
        logger.error(f"Error in bulk health status update: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating health status"
        )