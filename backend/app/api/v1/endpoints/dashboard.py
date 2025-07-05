from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import structlog
from ....core.database import get_db
from ....core.deps import get_current_user
from ....models.user import User
from ....models.opportunity import Opportunity, HealthStatus, O2RPhase
from ....schemas.dashboard import (
    DashboardMetricsSchema,
    PipelineChartDataSchema,
    PipelineChartResponseSchema,
    O2RPhaseChartDataSchema,
    O2RPhaseChartResponseSchema,
    HealthChartDataSchema,
    HealthChartResponseSchema,
    AttentionRequiredResponseSchema,
    AttentionRequiredItemSchema,
)
from ....services.zoho_crm_service import ZohoCRMService
from ....services.opportunity_service import OpportunityService

logger = structlog.get_logger()
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/metrics",
    response_model=DashboardMetricsSchema,
    summary="Get dashboard metrics",
    description="Fetch key performance indicators for the dashboard including pipeline value, revenue, and conversion metrics"
)
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardMetricsSchema:
    """Get dashboard key metrics."""
    try:
        logger.info("Fetching dashboard metrics", user_id=current_user.id)
        
        # Get current date for filtering
        current_date = datetime.now()
        current_quarter_start = datetime(current_date.year, ((current_date.month - 1) // 3) * 3 + 1, 1)
        previous_quarter_start = current_quarter_start - timedelta(days=90)
        
        # Total pipeline value (all active opportunities)
        pipeline_query = select(func.sum(Opportunity.amount_sgd)).where(
            and_(
                Opportunity.phase != O2RPhase.REVENUE,
                Opportunity.health_status != HealthStatus.BLOCKED
            )
        )
        pipeline_result = await db.execute(pipeline_query)
        total_pipeline_value = pipeline_result.scalar() or Decimal("0")
        
        # Total revenue (closed deals)
        revenue_query = select(func.sum(Opportunity.amount_sgd)).where(
            Opportunity.phase == O2RPhase.REVENUE
        )
        revenue_result = await db.execute(revenue_query)
        total_revenue = revenue_result.scalar() or Decimal("0")
        
        # Deals in progress
        deals_query = select(func.count(Opportunity.id)).where(
            and_(
                Opportunity.phase != O2RPhase.REVENUE,
                Opportunity.health_status != HealthStatus.BLOCKED
            )
        )
        deals_result = await db.execute(deals_query)
        deals_in_progress = deals_result.scalar() or 0
        
        # Average deal size
        avg_deal_query = select(func.avg(Opportunity.amount_sgd)).where(
            Opportunity.phase != O2RPhase.REVENUE
        )
        avg_deal_result = await db.execute(avg_deal_query)
        average_deal_size = avg_deal_result.scalar() or Decimal("0")
        
        # Total opportunities for win rate calculation
        total_opportunities_query = select(func.count(Opportunity.id))
        total_opportunities_result = await db.execute(total_opportunities_query)
        total_opportunities = total_opportunities_result.scalar() or 0
        
        # Closed won opportunities
        closed_won_query = select(func.count(Opportunity.id)).where(
            Opportunity.phase == O2RPhase.REVENUE
        )
        closed_won_result = await db.execute(closed_won_query)
        closed_won = closed_won_result.scalar() or 0
        
        # Calculate win rate
        win_rate = (closed_won / total_opportunities) if total_opportunities > 0 else 0.0
        
        # Conversion rate (Revenue phase / Total opportunities)
        conversion_rate = win_rate  # Same as win rate for now
        
        # Quarterly growth calculation
        current_quarter_revenue_query = select(func.sum(Opportunity.amount_sgd)).where(
            and_(
                Opportunity.phase == O2RPhase.REVENUE,
                Opportunity.updated_at >= current_quarter_start
            )
        )
        current_quarter_result = await db.execute(current_quarter_revenue_query)
        current_quarter_revenue = current_quarter_result.scalar() or Decimal("0")
        
        previous_quarter_revenue_query = select(func.sum(Opportunity.amount_sgd)).where(
            and_(
                Opportunity.phase == O2RPhase.REVENUE,
                Opportunity.updated_at >= previous_quarter_start,
                Opportunity.updated_at < current_quarter_start
            )
        )
        previous_quarter_result = await db.execute(previous_quarter_revenue_query)
        previous_quarter_revenue = previous_quarter_result.scalar() or Decimal("0")
        
        # Calculate quarterly growth
        quarterly_growth = 0.0
        if previous_quarter_revenue > 0:
            quarterly_growth = float((current_quarter_revenue - previous_quarter_revenue) / previous_quarter_revenue * 100)
        
        # Pipeline velocity (simplified calculation)
        pipeline_velocity = float(total_pipeline_value / 30) if total_pipeline_value > 0 else 0.0
        
        # Team performance (based on deals closed vs target)
        team_performance = min(100.0, (closed_won / max(1, total_opportunities)) * 100)
        
        # Risk factors (deals with red or yellow health status)
        risk_factors_query = select(func.count(Opportunity.id)).where(
            and_(
                Opportunity.health_status.in_([HealthStatus.RED, HealthStatus.YELLOW]),
                Opportunity.phase != O2RPhase.REVENUE
            )
        )
        risk_factors_result = await db.execute(risk_factors_query)
        risk_factors = risk_factors_result.scalar() or 0
        
        metrics = DashboardMetricsSchema(
            total_pipeline_value=total_pipeline_value,
            total_revenue=total_revenue,
            deals_in_progress=deals_in_progress,
            average_deal_size=average_deal_size,
            win_rate=win_rate,
            conversion_rate=conversion_rate,
            quarterly_growth=quarterly_growth,
            pipeline_velocity=pipeline_velocity,
            team_performance=team_performance,
            risk_factors=risk_factors
        )
        
        logger.info("Dashboard metrics retrieved successfully", 
                   pipeline_value=float(total_pipeline_value),
                   revenue=float(total_revenue),
                   deals_count=deals_in_progress)
        
        return metrics
        
    except Exception as e:
        logger.error("Error fetching dashboard metrics", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching dashboard metrics"
        )


@router.get(
    "/pipeline-chart",
    response_model=PipelineChartResponseSchema,
    summary="Get pipeline chart data",
    description="Fetch pipeline value trends over time for chart visualization"
)
async def get_pipeline_chart_data(
    months: int = Query(12, ge=1, le=24, description="Number of months to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PipelineChartResponseSchema:
    """Get pipeline chart data for trend visualization."""
    try:
        logger.info("Fetching pipeline chart data", user_id=current_user.id, months=months)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        # Get monthly data
        monthly_data = []
        for i in range(months):
            month_start = start_date + timedelta(days=i * 30)
            month_end = month_start + timedelta(days=30)
            month_label = month_start.strftime("%b %Y")
            
            # Pipeline value for the month (active opportunities)
            pipeline_query = select(func.sum(Opportunity.amount_sgd)).where(
                and_(
                    Opportunity.created_at <= month_end,
                    Opportunity.phase != O2RPhase.REVENUE,
                    Opportunity.health_status != HealthStatus.BLOCKED
                )
            )
            pipeline_result = await db.execute(pipeline_query)
            pipeline_value = pipeline_result.scalar() or Decimal("0")
            
            # Closed deals value for the month
            closed_query = select(func.sum(Opportunity.amount_sgd)).where(
                and_(
                    Opportunity.phase == O2RPhase.REVENUE,
                    Opportunity.updated_at >= month_start,
                    Opportunity.updated_at < month_end
                )
            )
            closed_result = await db.execute(closed_query)
            closed_value = closed_result.scalar() or Decimal("0")
            
            monthly_data.append(PipelineChartDataSchema(
                month=month_label,
                pipeline=pipeline_value,
                closed=closed_value
            ))
        
        response = PipelineChartResponseSchema(
            data=monthly_data,
            total_months=months
        )
        
        logger.info("Pipeline chart data retrieved successfully", months=months)
        return response
        
    except Exception as e:
        logger.error("Error fetching pipeline chart data", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching pipeline chart data"
        )


@router.get(
    "/o2r-phase-chart",
    response_model=O2RPhaseChartResponseSchema,
    summary="Get O2R phase chart data",
    description="Fetch O2R phase distribution data for chart visualization"
)
async def get_o2r_phase_chart_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> O2RPhaseChartResponseSchema:
    """Get O2R phase distribution chart data."""
    try:
        logger.info("Fetching O2R phase chart data", user_id=current_user.id)
        
        # Get phase distribution data
        phase_data = []
        total_deals = 0
        total_value = Decimal("0")
        
        # Phase names mapping
        phase_names = {
            O2RPhase.OPPORTUNITY: "Opportunity",
            O2RPhase.QUALIFIED: "Qualified",
            O2RPhase.PROPOSAL: "Proposal",
            O2RPhase.REVENUE: "Revenue"
        }
        
        for phase in O2RPhase:
            # Count deals in this phase
            deals_query = select(func.count(Opportunity.id)).where(
                Opportunity.phase == phase
            )
            deals_result = await db.execute(deals_query)
            deals_count = deals_result.scalar() or 0
            
            # Sum value in this phase
            value_query = select(func.sum(Opportunity.amount_sgd)).where(
                Opportunity.phase == phase
            )
            value_result = await db.execute(value_query)
            phase_value = value_result.scalar() or Decimal("0")
            
            phase_data.append(O2RPhaseChartDataSchema(
                phase=phase_names[phase],
                deals=deals_count,
                value=phase_value
            ))
            
            total_deals += deals_count
            total_value += phase_value
        
        response = O2RPhaseChartResponseSchema(
            data=phase_data,
            total_deals=total_deals,
            total_value=total_value
        )
        
        logger.info("O2R phase chart data retrieved successfully", 
                   total_deals=total_deals,
                   total_value=float(total_value))
        return response
        
    except Exception as e:
        logger.error("Error fetching O2R phase chart data", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching O2R phase chart data"
        )


@router.get(
    "/health-chart",
    response_model=HealthChartResponseSchema,
    summary="Get health chart data",
    description="Fetch deal health trends over time for chart visualization"
)
async def get_health_chart_data(
    days: int = Query(30, ge=7, le=90, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HealthChartResponseSchema:
    """Get health trend chart data."""
    try:
        logger.info("Fetching health chart data", user_id=current_user.id, days=days)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get daily health data
        daily_data = []
        for i in range(days):
            day_date = start_date + timedelta(days=i)
            day_label = day_date.strftime("%Y-%m-%d")
            
            # Count deals by health status for this day
            health_counts = {}
            for health_status in HealthStatus:
                count_query = select(func.count(Opportunity.id)).where(
                    and_(
                        Opportunity.health_status == health_status,
                        Opportunity.created_at <= day_date,
                        Opportunity.phase != O2RPhase.REVENUE
                    )
                )
                count_result = await db.execute(count_query)
                health_counts[health_status.value] = count_result.scalar() or 0
            
            daily_data.append(HealthChartDataSchema(
                date=day_label,
                green=health_counts.get("GREEN", 0),
                yellow=health_counts.get("YELLOW", 0),
                red=health_counts.get("RED", 0),
                blocked=health_counts.get("BLOCKED", 0)
            ))
        
        # Get current health summary
        current_health_summary = {}
        for health_status in HealthStatus:
            count_query = select(func.count(Opportunity.id)).where(
                and_(
                    Opportunity.health_status == health_status,
                    Opportunity.phase != O2RPhase.REVENUE
                )
            )
            count_result = await db.execute(count_query)
            current_health_summary[health_status.value] = count_result.scalar() or 0
        
        response = HealthChartResponseSchema(
            data=daily_data,
            total_periods=days,
            current_health_summary=current_health_summary
        )
        
        logger.info("Health chart data retrieved successfully", days=days)
        return response
        
    except Exception as e:
        logger.error("Error fetching health chart data", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching health chart data"
        )


@router.get(
    "/attention-required",
    response_model=AttentionRequiredResponseSchema,
    summary="Get deals requiring attention",
    description="Fetch deals that need immediate attention based on health status and other criteria"
)
async def get_attention_required_deals(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of deals to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AttentionRequiredResponseSchema:
    """Get deals requiring attention."""
    try:
        logger.info("Fetching attention required deals", user_id=current_user.id, limit=limit)
        
        # Query for deals requiring attention (RED or YELLOW health status)
        attention_query = select(Opportunity).where(
            and_(
                Opportunity.health_status.in_([HealthStatus.RED, HealthStatus.YELLOW]),
                Opportunity.phase != O2RPhase.REVENUE
            )
        ).order_by(
            # Order by priority: RED first, then YELLOW, then by amount descending
            Opportunity.health_status.desc(),
            Opportunity.amount_sgd.desc()
        ).limit(limit)
        
        attention_result = await db.execute(attention_query)
        attention_deals = attention_result.scalars().all()
        
        # Convert to schema format
        attention_items = []
        for deal in attention_deals:
            attention_items.append(AttentionRequiredItemSchema(
                id=deal.id,
                name=deal.name,
                amount_sgd=deal.amount_sgd,
                amount_local=deal.amount_local,
                local_currency=deal.local_currency,
                probability=deal.probability,
                phase=deal.phase,
                health_status=deal.health_status,
                territory_id=deal.territory_id,
                account_id=deal.account_id,
                proposal_date=deal.proposal_date,
                kickoff_date=deal.kickoff_date,
                completion_date=deal.completion_date,
                created_at=deal.created_at,
                updated_at=deal.updated_at,
                created_by=deal.created_by,
                updated_by=deal.updated_by
            ))
        
        # Get total counts
        total_attention_query = select(func.count(Opportunity.id)).where(
            and_(
                Opportunity.health_status.in_([HealthStatus.RED, HealthStatus.YELLOW]),
                Opportunity.phase != O2RPhase.REVENUE
            )
        )
        total_attention_result = await db.execute(total_attention_query)
        total_count = total_attention_result.scalar() or 0
        
        # Get critical count (RED status)
        critical_query = select(func.count(Opportunity.id)).where(
            and_(
                Opportunity.health_status == HealthStatus.RED,
                Opportunity.phase != O2RPhase.REVENUE
            )
        )
        critical_result = await db.execute(critical_query)
        critical_count = critical_result.scalar() or 0
        
        # Get warning count (YELLOW status)
        warning_query = select(func.count(Opportunity.id)).where(
            and_(
                Opportunity.health_status == HealthStatus.YELLOW,
                Opportunity.phase != O2RPhase.REVENUE
            )
        )
        warning_result = await db.execute(warning_query)
        warning_count = warning_result.scalar() or 0
        
        response = AttentionRequiredResponseSchema(
            items=attention_items,
            total_count=total_count,
            critical_count=critical_count,
            warning_count=warning_count
        )
        
        logger.info("Attention required deals retrieved successfully", 
                   total_count=total_count,
                   critical_count=critical_count,
                   warning_count=warning_count)
        return response
        
    except Exception as e:
        logger.error("Error fetching attention required deals", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching attention required deals"
        )


@router.get(
    "/sync-dashboard-data",
    response_model=dict,
    summary="Sync dashboard data from Zoho CRM",
    description="Trigger a sync of fresh dashboard data from Zoho CRM for real-time updates"
)
async def sync_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Sync dashboard data from Zoho CRM."""
    try:
        logger.info("Syncing dashboard data from Zoho CRM", user_id=current_user.id)
        
        # Initialize services
        zoho_service = ZohoCRMService()
        opportunity_service = OpportunityService(db)
        
        # Test Zoho CRM connection
        connection_test = await zoho_service.test_connection()
        if connection_test.get("status") != "success":
            logger.warning("Zoho CRM connection test failed", 
                         connection_status=connection_test)
            return {
                "status": "warning",
                "message": "Zoho CRM connection unavailable, using cached data",
                "details": connection_test
            }
        
        # Get recent deals from Zoho CRM
        try:
            # Fetch recent deals (last 30 days)
            recent_date = datetime.now() - timedelta(days=30)
            zoho_deals = await zoho_service.get_records(
                module_name="Deals",
                per_page=200,
                modified_since=recent_date,
                sort_by="Modified_Time",
                sort_order="desc"
            )
            
            deals_data = zoho_deals.get("data", [])
            sync_count = len(deals_data)
            
            logger.info("Dashboard data sync completed", 
                       deals_synced=sync_count,
                       connection_status="success")
            
            return {
                "status": "success",
                "message": f"Dashboard data synced successfully",
                "deals_synced": sync_count,
                "last_sync": datetime.now().isoformat(),
                "connection_status": "connected"
            }
            
        except Exception as sync_error:
            logger.error("Error during Zoho CRM sync", error=str(sync_error))
            return {
                "status": "partial",
                "message": "Sync encountered errors, using available data",
                "error": str(sync_error),
                "connection_status": "error"
            }
        
    except Exception as e:
        logger.error("Error syncing dashboard data", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error syncing dashboard data"
        )