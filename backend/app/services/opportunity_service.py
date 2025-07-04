from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, func
from typing import Optional, List, Dict, Any
from decimal import Decimal
import structlog
from ..models.opportunity import Opportunity, HealthStatus, O2RPhase
from ..schemas.opportunity_schemas import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OpportunityListResponse,
)
from .currency_service import CurrencyService

logger = structlog.get_logger()


class OpportunityService:
    """Service for managing opportunity business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.currency_service = CurrencyService()
    
    async def create_opportunity(self, opportunity_data: OpportunityCreate) -> OpportunityResponse:
        """Create new opportunity with currency conversion."""
        try:
            # Convert to SGD
            sgd_amount = await self.currency_service.convert_to_sgd(
                amount=opportunity_data.amount_local,
                from_currency=opportunity_data.local_currency
            )
            
            # Create opportunity
            # Note: created_by and updated_by must be provided by authentication system
            raise NotImplementedError(
                "Opportunity creation requires authentication system to provide user context"
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating opportunity: {e}")
            raise
    
    async def get_opportunities(
        self,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> OpportunityListResponse:
        """Get opportunities with filtering and pagination."""
        try:
            # Build base query
            query = select(Opportunity)
            
            # Apply filters
            if filters:
                if health_status := filters.get("health_status"):
                    query = query.where(Opportunity.health_status == health_status)
                if territory_id := filters.get("territory_id"):
                    query = query.where(Opportunity.territory_id == territory_id)
                if phase := filters.get("phase"):
                    query = query.where(Opportunity.o2r_phase == O2RPhase(phase))
            
            # Count total records
            count_query = select(func.count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total = total_result.scalar()
            
            # Apply pagination
            offset = (page - 1) * page_size
            query = query.order_by(Opportunity.updated_at.desc()).offset(offset).limit(page_size)
            
            # Execute query
            result = await self.db.execute(query)
            opportunities = result.scalars().all()
            
            # Calculate pagination info
            total_pages = (total + page_size - 1) // page_size
            
            return OpportunityListResponse(
                opportunities=[OpportunityResponse.from_orm(opp) for opp in opportunities],
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            )
            
        except Exception as e:
            logger.error(f"Error retrieving opportunities: {e}")
            raise
    
    async def get_opportunity_by_id(self, opportunity_id: int) -> Optional[OpportunityResponse]:
        """Get opportunity by ID."""
        try:
            query = select(Opportunity).where(Opportunity.id == opportunity_id)
            result = await self.db.execute(query)
            opportunity = result.scalar_one_or_none()
            
            if opportunity:
                return OpportunityResponse.from_orm(opportunity)
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving opportunity {opportunity_id}: {e}")
            raise
    
    async def update_opportunity(
        self,
        opportunity_id: int,
        opportunity_data: OpportunityUpdate
    ) -> Optional[OpportunityResponse]:
        """Update opportunity."""
        try:
            # Get existing opportunity
            query = select(Opportunity).where(Opportunity.id == opportunity_id)
            result = await self.db.execute(query)
            opportunity = result.scalar_one_or_none()
            
            if not opportunity:
                return None
            
            # Update fields
            update_data = opportunity_data.dict(exclude_unset=True)
            
            # Handle currency conversion if amount or currency changed
            if "amount_local" in update_data or "local_currency" in update_data:
                amount = update_data.get("amount_local", opportunity.amount_local)
                currency = update_data.get("local_currency", opportunity.local_currency)
                
                sgd_amount = await self.currency_service.convert_to_sgd(amount, currency)
                update_data["amount_sgd"] = sgd_amount
            
            # Update opportunity
            # Note: updated_by must be provided by authentication system
            raise NotImplementedError(
                "Opportunity updates require authentication system to provide user context"
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating opportunity {opportunity_id}: {e}")
            raise
    
    async def delete_opportunity(self, opportunity_id: int) -> bool:
        """Delete opportunity."""
        try:
            query = select(Opportunity).where(Opportunity.id == opportunity_id)
            result = await self.db.execute(query)
            opportunity = result.scalar_one_or_none()
            
            if not opportunity:
                return False
            
            await self.db.delete(opportunity)
            await self.db.commit()
            
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting opportunity {opportunity_id}: {e}")
            raise
    
    async def bulk_update_health_status(
        self,
        opportunity_ids: List[int],
        health_status: HealthStatus
    ) -> int:
        """Bulk update health status."""
        try:
            # Note: updated_by must be provided by authentication system
            raise NotImplementedError(
                "Bulk updates require authentication system to provide user context"
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error in bulk health status update: {e}")
            raise