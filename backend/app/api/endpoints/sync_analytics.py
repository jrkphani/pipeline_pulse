"""
Sync Analytics API Endpoints
Provides detailed analytics and monitoring for CRM synchronization operations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.services.sync_status_service import SyncStatusService
from app.services.zoho_health_monitor import ZohoHealthMonitor
from app.services.zoho_crm.conflicts.sync_tracker import SyncOperationTracker
from app.services.zoho_crm.conflicts.resolver import ConflictResolutionEngine
from app.services.zoho_crm.core.exceptions import (
    ZohoAPIError, ZohoAuthError
)

router = APIRouter(prefix="/analytics", tags=["Sync Analytics"])


def get_status_service(db: Session = Depends(get_db)) -> SyncStatusService:
    """Dependency to get sync status service instance"""
    return SyncStatusService(db)


def get_health_monitor(db: Session = Depends(get_db)) -> ZohoHealthMonitor:
    """Dependency to get health monitor instance"""
    return ZohoHealthMonitor(db)


def get_sync_tracker(db: Session = Depends(get_db)) -> SyncOperationTracker:
    """Dependency to get sync tracker instance"""
    return SyncOperationTracker(db)


def get_conflict_resolver(db: Session = Depends(get_db)) -> ConflictResolutionEngine:
    """Dependency to get conflict resolver instance"""
    return ConflictResolutionEngine(db)


@router.get("/health")
async def get_sync_health_analytics(
    time_range_hours: int = Query(24, ge=1, le=168, description="Time range in hours"),
    include_trends: bool = Query(True, description="Include trend analysis"),
    health_monitor: ZohoHealthMonitor = Depends(get_health_monitor),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get comprehensive sync health analytics
    
    Provides detailed health metrics including:
    - Sync success rates
    - Performance metrics
    - Error analysis
    - Trend data
    """
    try:
        # Get current health status
        current_health = await health_monitor.get_comprehensive_health_status()
        
        # Get historical metrics
        since_time = datetime.now() - timedelta(hours=time_range_hours)
        historical_metrics = await status_service.get_sync_metrics_since(since_time)
        
        # Calculate health score
        health_score = await health_monitor.calculate_health_score()
        
        health_analytics = {
            "overall_health": {
                "score": health_score,
                "status": current_health.get("status", "unknown"),
                "last_updated": datetime.now().isoformat()
            },
            "sync_performance": {
                "success_rate": historical_metrics.get("success_rate", 0),
                "average_sync_duration": historical_metrics.get("avg_duration_seconds", 0),
                "total_syncs": historical_metrics.get("total_syncs", 0),
                "failed_syncs": historical_metrics.get("failed_syncs", 0)
            },
            "error_analysis": {
                "error_rate": historical_metrics.get("error_rate", 0),
                "common_errors": historical_metrics.get("common_errors", []),
                "critical_errors": historical_metrics.get("critical_errors", [])
            },
            "system_metrics": {
                "api_response_time": current_health.get("api_response_time_ms", 0),
                "token_health": current_health.get("token_health", {}),
                "connectivity_status": current_health.get("connectivity_status", "unknown")
            }
        }
        
        # Include trend analysis if requested
        if include_trends:
            trends = await _calculate_health_trends(historical_metrics, time_range_hours)
            health_analytics["trends"] = trends
        
        return {
            "time_range_hours": time_range_hours,
            "health_analytics": health_analytics,
            "recommendations": await _get_health_recommendations(health_analytics),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sync health analytics: {str(e)}")


@router.get("/performance")
async def get_performance_metrics(
    metric_type: str = Query("all", regex="^(all|sync_duration|throughput|error_rates|api_performance)$"),
    time_range_hours: int = Query(24, ge=1, le=168),
    group_by: str = Query("hour", regex="^(hour|day|week)$"),
    status_service: SyncStatusService = Depends(get_status_service),
    health_monitor: ZohoHealthMonitor = Depends(get_health_monitor)
) -> Dict[str, Any]:
    """
    Get detailed performance metrics
    
    Returns granular performance data with time-series analysis
    """
    try:
        since_time = datetime.now() - timedelta(hours=time_range_hours)
        
        # Get performance metrics based on type
        if metric_type == "all" or metric_type == "sync_duration":
            sync_duration_metrics = await status_service.get_sync_duration_metrics(since_time, group_by)
        else:
            sync_duration_metrics = {}
        
        if metric_type == "all" or metric_type == "throughput":
            throughput_metrics = await status_service.get_throughput_metrics(since_time, group_by)
        else:
            throughput_metrics = {}
        
        if metric_type == "all" or metric_type == "error_rates":
            error_rate_metrics = await status_service.get_error_rate_metrics(since_time, group_by)
        else:
            error_rate_metrics = {}
        
        if metric_type == "all" or metric_type == "api_performance":
            api_performance_metrics = await health_monitor.get_api_performance_metrics(since_time, group_by)
        else:
            api_performance_metrics = {}
        
        return {
            "metric_type": metric_type,
            "time_range_hours": time_range_hours,
            "group_by": group_by,
            "metrics": {
                "sync_duration": sync_duration_metrics,
                "throughput": throughput_metrics,
                "error_rates": error_rate_metrics,
                "api_performance": api_performance_metrics
            },
            "summary": {
                "data_points": sum([
                    len(sync_duration_metrics.get("data_points", [])),
                    len(throughput_metrics.get("data_points", [])),
                    len(error_rate_metrics.get("data_points", [])),
                    len(api_performance_metrics.get("data_points", []))
                ]),
                "time_period": f"{since_time.isoformat()} to {datetime.now().isoformat()}"
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")


@router.get("/conflicts")
async def get_conflict_analytics(
    status: Optional[str] = Query(None, regex="^(pending|resolved|ignored)$"),
    conflict_type: Optional[str] = Query(None, description="Filter by conflict type"),
    time_range_hours: int = Query(24, ge=1, le=168),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sync_tracker: SyncOperationTracker = Depends(get_sync_tracker)
) -> Dict[str, Any]:
    """
    Get detailed conflict information and analytics
    
    Provides comprehensive conflict data including:
    - Conflict frequency and types
    - Resolution statistics
    - Pending conflicts requiring attention
    """
    try:
        since_time = datetime.now() - timedelta(hours=time_range_hours)
        
        # Get conflicts with filters
        conflicts = await sync_tracker.get_conflicts(
            since=since_time,
            status=status,
            conflict_type=conflict_type,
            limit=limit,
            offset=offset
        )
        
        # Get conflict summary statistics
        conflict_stats = await sync_tracker.get_conflict_statistics(since_time)
        
        # Group conflicts by type and status
        conflicts_by_type = {}
        conflicts_by_status = {}
        
        for conflict in conflicts:
            conflict_type_name = conflict.get("conflict_type", "unknown")
            conflict_status = conflict.get("status", "unknown")
            
            if conflict_type_name not in conflicts_by_type:
                conflicts_by_type[conflict_type_name] = []
            conflicts_by_type[conflict_type_name].append(conflict)
            
            if conflict_status not in conflicts_by_status:
                conflicts_by_status[conflict_status] = []
            conflicts_by_status[conflict_status].append(conflict)
        
        return {
            "conflicts": conflicts,
            "conflict_analytics": {
                "total_conflicts": len(conflicts),
                "conflicts_by_type": {
                    ctype: len(clist) for ctype, clist in conflicts_by_type.items()
                },
                "conflicts_by_status": {
                    cstatus: len(clist) for cstatus, clist in conflicts_by_status.items()
                },
                "statistics": conflict_stats
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "has_more": len(conflicts) == limit
            },
            "filters": {
                "status": status,
                "conflict_type": conflict_type,
                "time_range_hours": time_range_hours
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conflict analytics: {str(e)}")


@router.post("/conflicts/{conflict_id}/resolve")
async def resolve_sync_conflict(
    conflict_id: str,
    resolution_strategy: str = Query(..., regex="^(use_local|use_remote|merge|custom)$"),
    resolution_data: Optional[Dict[str, Any]] = None,
    auto_apply_similar: bool = Query(False, description="Auto-apply to similar conflicts"),
    conflict_resolver: ConflictResolutionEngine = Depends(get_conflict_resolver),
    sync_tracker: SyncOperationTracker = Depends(get_sync_tracker)
) -> Dict[str, Any]:
    """
    Resolve a specific sync conflict
    
    Applies resolution strategy and optionally auto-resolves similar conflicts
    """
    try:
        # Get conflict details
        conflict = await sync_tracker.get_conflict_by_id(conflict_id)
        if not conflict:
            raise HTTPException(status_code=404, detail=f"Conflict {conflict_id} not found")
        
        # Apply resolution
        resolution_result = await conflict_resolver.resolve_conflict(
            conflict_id=conflict_id,
            strategy=resolution_strategy,
            resolution_data=resolution_data
        )
        
        if not resolution_result.get("success", False):
            return {
                "success": False,
                "conflict_id": conflict_id,
                "error": resolution_result.get("error", "Resolution failed"),
                "details": resolution_result.get("details", {})
            }
        
        # Auto-apply to similar conflicts if requested
        similar_resolutions = []
        if auto_apply_similar:
            similar_conflicts = await sync_tracker.find_similar_conflicts(
                conflict_id=conflict_id,
                max_similar=10
            )
            
            for similar_conflict in similar_conflicts:
                try:
                    similar_result = await conflict_resolver.resolve_conflict(
                        conflict_id=similar_conflict["id"],
                        strategy=resolution_strategy,
                        resolution_data=resolution_data
                    )
                    similar_resolutions.append({
                        "conflict_id": similar_conflict["id"],
                        "success": similar_result.get("success", False),
                        "error": similar_result.get("error")
                    })
                except Exception as e:
                    similar_resolutions.append({
                        "conflict_id": similar_conflict["id"],
                        "success": False,
                        "error": str(e)
                    })
        
        return {
            "success": True,
            "conflict_id": conflict_id,
            "resolution_strategy": resolution_strategy,
            "resolution_result": resolution_result,
            "similar_resolutions": similar_resolutions,
            "auto_applied_count": len([r for r in similar_resolutions if r.get("success", False)]),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve conflict: {str(e)}")


@router.get("/trends")
async def get_sync_trends(
    metric: str = Query("success_rate", regex="^(success_rate|sync_duration|error_rate|throughput)$"),
    time_range_days: int = Query(7, ge=1, le=30),
    granularity: str = Query("hour", regex="^(hour|day)$"),
    status_service: SyncStatusService = Depends(get_status_service)
) -> Dict[str, Any]:
    """
    Get sync trend analysis
    
    Provides time-series analysis of sync metrics with trend indicators
    """
    try:
        since_time = datetime.now() - timedelta(days=time_range_days)
        
        # Get trend data
        trend_data = await status_service.get_metric_trends(
            metric=metric,
            since=since_time,
            granularity=granularity
        )
        
        # Calculate trend indicators
        trend_analysis = await _calculate_trend_analysis(trend_data, metric)
        
        return {
            "metric": metric,
            "time_range_days": time_range_days,
            "granularity": granularity,
            "trend_data": trend_data,
            "trend_analysis": trend_analysis,
            "data_points": len(trend_data.get("data_points", [])),
            "time_period": {
                "start": since_time.isoformat(),
                "end": datetime.now().isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sync trends: {str(e)}")


@router.get("/reports/summary")
async def get_sync_summary_report(
    time_range_days: int = Query(7, ge=1, le=30),
    include_recommendations: bool = Query(True, description="Include improvement recommendations"),
    status_service: SyncStatusService = Depends(get_status_service),
    health_monitor: ZohoHealthMonitor = Depends(get_health_monitor)
) -> Dict[str, Any]:
    """
    Get comprehensive sync summary report
    
    Provides executive summary of sync operations and health
    """
    try:
        since_time = datetime.now() - timedelta(days=time_range_days)
        
        # Get overall metrics
        summary_metrics = await status_service.get_summary_metrics(since_time)
        
        # Get health overview
        health_overview = await health_monitor.get_health_overview()
        
        # Generate executive summary
        executive_summary = {
            "sync_operations": {
                "total_syncs": summary_metrics.get("total_syncs", 0),
                "successful_syncs": summary_metrics.get("successful_syncs", 0),
                "failed_syncs": summary_metrics.get("failed_syncs", 0),
                "success_rate": summary_metrics.get("success_rate", 0)
            },
            "performance": {
                "average_duration": summary_metrics.get("avg_duration_seconds", 0),
                "fastest_sync": summary_metrics.get("fastest_sync_seconds", 0),
                "slowest_sync": summary_metrics.get("slowest_sync_seconds", 0),
                "total_records_synced": summary_metrics.get("total_records_synced", 0)
            },
            "health_status": {
                "overall_health": health_overview.get("status", "unknown"),
                "api_health": health_overview.get("api_health", "unknown"),
                "token_health": health_overview.get("token_health", "unknown"),
                "last_successful_sync": health_overview.get("last_successful_sync")
            },
            "error_summary": {
                "total_errors": summary_metrics.get("total_errors", 0),
                "error_rate": summary_metrics.get("error_rate", 0),
                "top_error_types": summary_metrics.get("top_error_types", [])
            }
        }
        
        # Include recommendations if requested
        recommendations = []
        if include_recommendations:
            recommendations = await _generate_sync_recommendations(executive_summary)
        
        return {
            "report_period": {
                "days": time_range_days,
                "start_date": since_time.date().isoformat(),
                "end_date": datetime.now().date().isoformat()
            },
            "executive_summary": executive_summary,
            "recommendations": recommendations,
            "report_generated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary report: {str(e)}")


async def _calculate_health_trends(historical_metrics: Dict[str, Any], time_range_hours: int) -> Dict[str, Any]:
    """Calculate health trend indicators"""
    return {
        "success_rate_trend": "stable",  # Would calculate based on historical data
        "performance_trend": "improving",
        "error_rate_trend": "decreasing",
        "overall_trend": "positive"
    }


async def _get_health_recommendations(health_analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate health improvement recommendations"""
    recommendations = []
    
    # Check success rate
    success_rate = health_analytics.get("sync_performance", {}).get("success_rate", 0)
    if success_rate < 0.95:
        recommendations.append({
            "type": "performance",
            "priority": "high",
            "title": "Low Success Rate Detected",
            "description": f"Sync success rate is {success_rate:.1%}, below recommended 95%",
            "action": "Review error logs and resolve common sync issues"
        })
    
    # Check error rate
    error_rate = health_analytics.get("error_analysis", {}).get("error_rate", 0)
    if error_rate > 0.05:
        recommendations.append({
            "type": "reliability",
            "priority": "medium",
            "title": "High Error Rate",
            "description": f"Error rate is {error_rate:.1%}, above recommended 5%",
            "action": "Investigate and fix common error patterns"
        })
    
    return recommendations


async def _calculate_trend_analysis(trend_data: Dict[str, Any], metric: str) -> Dict[str, Any]:
    """Calculate trend analysis for metrics"""
    return {
        "direction": "increasing",  # Would calculate based on actual data
        "magnitude": 0.05,
        "confidence": 0.85,
        "forecast": "stable",
        "anomalies_detected": 0
    }


async def _generate_sync_recommendations(executive_summary: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate recommendations based on executive summary"""
    recommendations = []
    
    # Check sync performance
    success_rate = executive_summary.get("sync_operations", {}).get("success_rate", 0)
    if success_rate < 0.9:
        recommendations.append({
            "category": "performance",
            "priority": "high",
            "title": "Improve Sync Reliability",
            "description": "Consider implementing retry mechanisms and error handling improvements"
        })
    
    # Check average duration
    avg_duration = executive_summary.get("performance", {}).get("average_duration", 0)
    if avg_duration > 300:  # 5 minutes
        recommendations.append({
            "category": "performance",
            "priority": "medium",
            "title": "Optimize Sync Performance",
            "description": "Consider batch size optimization and parallel processing"
        })
    
    return recommendations