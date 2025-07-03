"""
Live Data Service for real-time CRM data transformation and caching
Handles data freshness checking, cache invalidation, and live analytics
"""

import logging
import json
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import asyncio

from app.services.zoho_crm_service import EnhancedZohoCRMService
from app.services.sync_status_service import SyncStatusService
from app.models.crm_sync_sessions import SyncOperationType
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class DataFreshnessLevel(Enum):
    """Data freshness levels"""
    FRESH = "fresh"          # < 5 minutes old
    STALE = "stale"          # 5-15 minutes old
    EXPIRED = "expired"      # > 15 minutes old
    UNKNOWN = "unknown"      # No timestamp available


class CacheStrategy(Enum):
    """Cache invalidation strategies"""
    TIME_BASED = "time_based"
    EVENT_BASED = "event_based"
    DEMAND_BASED = "demand_based"
    HYBRID = "hybrid"


@dataclass
class DataFreshnessInfo:
    """Information about data freshness"""
    level: DataFreshnessLevel
    last_updated: Optional[datetime]
    age_minutes: float
    next_refresh_due: Optional[datetime]
    cache_hit_ratio: float
    source: str  # "cache", "crm", "database"


@dataclass
class LiveDataMetrics:
    """Metrics for live data performance"""
    total_requests: int
    cache_hits: int
    cache_misses: int
    avg_response_time_ms: float
    data_freshness: DataFreshnessInfo
    error_count: int
    last_sync_time: Optional[datetime]


class LiveDataService:
    """Service for managing live CRM data with intelligent caching"""
    
    def __init__(self, 
                 zoho_service: EnhancedZohoCRMService = None,
                 sync_service: SyncStatusService = None,
                 db: Session = None):
        """Initialize the live data service"""
        self.zoho_service = zoho_service or EnhancedZohoCRMService()
        self.sync_service = sync_service or SyncStatusService()
        self.db = db or next(get_db())
        
        # Cache configuration
        self.cache_ttl_minutes = 5  # Time-to-live for cached data
        self.force_refresh_threshold_minutes = 15  # Force refresh if older than this
        self.cache_strategy = CacheStrategy.HYBRID
        
        # In-memory cache (in production, consider Redis)
        self._data_cache = {}
        self._cache_metadata = {}
        
        # Performance tracking
        self._request_count = 0
        self._cache_hits = 0
        self._cache_misses = 0
        self._total_response_time = 0
        
        logger.info("Live Data Service initialized")
    
    # ==================== Data Freshness Management ====================
    
    async def check_data_freshness(self, 
                                 data_key: str,
                                 module_name: str = "Deals") -> DataFreshnessInfo:
        """
        Check the freshness of cached data
        
        Args:
            data_key: Unique identifier for the data
            module_name: CRM module name
            
        Returns:
            DataFreshnessInfo with freshness details
        """
        try:
            # Check cache metadata
            cache_info = self._cache_metadata.get(data_key)
            
            if not cache_info:
                return DataFreshnessInfo(
                    level=DataFreshnessLevel.UNKNOWN,
                    last_updated=None,
                    age_minutes=float('inf'),
                    next_refresh_due=datetime.utcnow(),
                    cache_hit_ratio=0.0,
                    source="none"
                )
            
            last_updated = cache_info.get("last_updated")
            if not last_updated:
                return DataFreshnessInfo(
                    level=DataFreshnessLevel.UNKNOWN,
                    last_updated=None,
                    age_minutes=float('inf'),
                    next_refresh_due=datetime.utcnow(),
                    cache_hit_ratio=0.0,
                    source="cache"
                )
            
            # Calculate age
            age_timedelta = datetime.utcnow() - last_updated
            age_minutes = age_timedelta.total_seconds() / 60
            
            # Determine freshness level
            if age_minutes < 5:
                level = DataFreshnessLevel.FRESH
            elif age_minutes < 15:
                level = DataFreshnessLevel.STALE
            else:
                level = DataFreshnessLevel.EXPIRED
            
            # Calculate next refresh time
            next_refresh_due = last_updated + timedelta(minutes=self.cache_ttl_minutes)
            
            # Calculate cache hit ratio
            total_requests = cache_info.get("access_count", 0)
            cache_hits = cache_info.get("hit_count", 0)
            cache_hit_ratio = (cache_hits / total_requests) * 100 if total_requests > 0 else 0
            
            return DataFreshnessInfo(
                level=level,
                last_updated=last_updated,
                age_minutes=age_minutes,
                next_refresh_due=next_refresh_due,
                cache_hit_ratio=cache_hit_ratio,
                source=cache_info.get("source", "cache")
            )
            
        except Exception as e:
            logger.error(f"Failed to check data freshness for {data_key}: {str(e)}")
            return DataFreshnessInfo(
                level=DataFreshnessLevel.UNKNOWN,
                last_updated=None,
                age_minutes=float('inf'),
                next_refresh_due=datetime.utcnow(),
                cache_hit_ratio=0.0,
                source="error"
            )
    
    async def invalidate_cache(self, 
                             data_key: str = None,
                             module_name: str = None,
                             pattern: str = None) -> int:
        """
        Invalidate cached data based on various criteria
        
        Args:
            data_key: Specific data key to invalidate
            module_name: Invalidate all data for a module
            pattern: Pattern to match for bulk invalidation
            
        Returns:
            Number of cache entries invalidated
        """
        try:
            invalidated_count = 0
            
            if data_key:
                # Invalidate specific key
                if data_key in self._data_cache:
                    del self._data_cache[data_key]
                    del self._cache_metadata[data_key]
                    invalidated_count = 1
                    logger.debug(f"Invalidated cache for key: {data_key}")
            
            elif module_name:
                # Invalidate all data for a module
                keys_to_remove = [
                    key for key in self._data_cache.keys() 
                    if key.startswith(f"{module_name}_")
                ]
                
                for key in keys_to_remove:
                    del self._data_cache[key]
                    if key in self._cache_metadata:
                        del self._cache_metadata[key]
                    invalidated_count += 1
                
                logger.info(f"Invalidated {invalidated_count} cache entries for module: {module_name}")
            
            elif pattern:
                # Invalidate based on pattern
                keys_to_remove = [
                    key for key in self._data_cache.keys() 
                    if pattern in key
                ]
                
                for key in keys_to_remove:
                    del self._data_cache[key]
                    if key in self._cache_metadata:
                        del self._cache_metadata[key]
                    invalidated_count += 1
                
                logger.info(f"Invalidated {invalidated_count} cache entries matching pattern: {pattern}")
            
            return invalidated_count
            
        except Exception as e:
            logger.error(f"Failed to invalidate cache: {str(e)}")
            return 0
    
    # ==================== Live Data Retrieval ====================
    
    async def get_live_pipeline_data(self, 
                                   module_name: str = "Deals",
                                   fields: List[str] = None,
                                   filters: Dict[str, Any] = None,
                                   force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get live pipeline data with intelligent caching
        
        Args:
            module_name: CRM module name
            fields: Specific fields to retrieve
            filters: Optional filters to apply
            force_refresh: Whether to bypass cache and fetch fresh data
            
        Returns:
            Dictionary containing pipeline data with metadata
        """
        start_time = datetime.utcnow()
        self._request_count += 1
        
        try:
            # Generate cache key
            cache_key = self._generate_cache_key("pipeline", module_name, fields, filters)
            
            # Check if we should use cached data
            if not force_refresh:
                freshness_info = await self.check_data_freshness(cache_key, module_name)
                
                if (freshness_info.level in [DataFreshnessLevel.FRESH, DataFreshnessLevel.STALE] and
                    cache_key in self._data_cache):
                    
                    # Return cached data
                    self._cache_hits += 1
                    self._update_cache_access(cache_key, hit=True)
                    
                    response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
                    self._total_response_time += response_time
                    
                    cached_data = self._data_cache[cache_key]
                    cached_data["metadata"]["served_from_cache"] = True
                    cached_data["metadata"]["freshness"] = freshness_info.__dict__
                    
                    logger.debug(f"Served pipeline data from cache for {module_name}")
                    return cached_data
            
            # Fetch fresh data from CRM
            self._cache_misses += 1
            logger.info(f"Fetching fresh pipeline data for {module_name}")
            
            # Perform full sync if needed
            sync_session = await self.sync_service.create_sync_session(
                session_type=SyncOperationType.FULL_SYNC,
                module_name=module_name,
                initiated_by="live_data_service"
            )
            
            sync_result = await self.zoho_service.perform_full_sync(
                module_name=module_name,
                fields=fields or self.zoho_service.REQUIRED_FIELDS,
                sync_session=sync_session
            )
            
            # Transform data for Pipeline Pulse
            transformed_data = await self._transform_pipeline_data(
                sync_result, module_name, filters
            )
            
            # Cache the data
            self._cache_data(cache_key, transformed_data, module_name)
            self._update_cache_access(cache_key, hit=False)
            
            # Calculate response time
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            self._total_response_time += response_time
            
            # Add metadata
            transformed_data["metadata"]["served_from_cache"] = False
            transformed_data["metadata"]["response_time_ms"] = response_time
            transformed_data["metadata"]["sync_session_id"] = sync_result.session_id
            
            logger.info(f"Successfully fetched and cached pipeline data for {module_name}")
            return transformed_data
            
        except Exception as e:
            logger.error(f"Failed to get live pipeline data: {str(e)}")
            raise
    
    async def get_live_deal_details(self, 
                                  deal_id: str,
                                  force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get detailed information for a specific deal
        
        Args:
            deal_id: CRM deal ID
            force_refresh: Whether to bypass cache
            
        Returns:
            Dictionary with detailed deal information
        """
        start_time = datetime.utcnow()
        self._request_count += 1
        
        try:
            cache_key = f"deal_details_{deal_id}"
            
            # Check cache first
            if not force_refresh:
                freshness_info = await self.check_data_freshness(cache_key)
                
                if (freshness_info.level == DataFreshnessLevel.FRESH and
                    cache_key in self._data_cache):
                    
                    self._cache_hits += 1
                    self._update_cache_access(cache_key, hit=True)
                    
                    cached_data = self._data_cache[cache_key]
                    cached_data["metadata"]["served_from_cache"] = True
                    
                    return cached_data
            
            # Fetch from CRM
            self._cache_misses += 1
            
            deal_result = await self.zoho_service.get_single_record(
                module_name="Deals",
                record_id=deal_id,
                fields=self.zoho_service.REQUIRED_FIELDS
            )
            
            if deal_result["status"] == "not_found":
                return {
                    "status": "not_found",
                    "deal_id": deal_id,
                    "metadata": {
                        "served_from_cache": False,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            
            # Transform and enrich deal data
            transformed_deal = await self._transform_deal_data(deal_result["record"])
            
            # Cache the data
            result = {
                "status": "found",
                "deal_id": deal_id,
                "deal": transformed_deal,
                "metadata": {
                    "served_from_cache": False,
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "crm"
                }
            }
            
            self._cache_data(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get deal details for {deal_id}: {str(e)}")
            raise
    
    async def get_live_dashboard_metrics(self, 
                                       force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get real-time dashboard metrics
        
        Args:
            force_refresh: Whether to bypass cache
            
        Returns:
            Dictionary with dashboard metrics
        """
        start_time = datetime.utcnow()
        self._request_count += 1
        
        try:
            cache_key = "dashboard_metrics"
            
            # Check cache
            if not force_refresh:
                freshness_info = await self.check_data_freshness(cache_key)
                
                if (freshness_info.level == DataFreshnessLevel.FRESH and
                    cache_key in self._data_cache):
                    
                    self._cache_hits += 1
                    return self._data_cache[cache_key]
            
            # Calculate fresh metrics
            self._cache_misses += 1
            
            # Get pipeline data
            pipeline_data = await self.get_live_pipeline_data(force_refresh=True)
            deals = pipeline_data.get("deals", [])
            
            # Calculate metrics
            metrics = await self._calculate_dashboard_metrics(deals)
            
            # Add sync health metrics
            health_metrics = await self.sync_service.calculate_sync_health_metrics()
            metrics["sync_health"] = health_metrics
            
            # Cache metrics
            self._cache_data(cache_key, metrics, ttl_minutes=2)  # Shorter TTL for metrics
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get dashboard metrics: {str(e)}")
            raise
    
    # ==================== Data Transformation ====================
    
    async def _transform_pipeline_data(self, 
                                     sync_result: Any,
                                     module_name: str,
                                     filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Transform raw CRM data for Pipeline Pulse consumption"""
        try:
            # Extract deal records from SDK sync result
            deals = sync_result.get("data", [])
            
            if not deals and sync_result.get("sdk_source"):
                logger.warning(f"No deals returned from SDK for module {module_name}")
            
            # Apply filters if provided
            if filters:
                deals = await self._apply_filters(deals, filters)
            
            # Calculate summary statistics
            total_deals = len(deals)
            total_amount = sum(float(deal.get("Amount", 0) or 0) for deal in deals)
            
            # Group by stage
            stage_summary = {}
            for deal in deals:
                stage = deal.get("Stage", "Unknown")
                if stage not in stage_summary:
                    stage_summary[stage] = {"count": 0, "amount": 0}
                stage_summary[stage]["count"] += 1
                stage_summary[stage]["amount"] += float(deal.get("Amount", 0) or 0)
            
            # Group by territory
            territory_summary = {}
            for deal in deals:
                territory = deal.get("Territory", "Unknown")
                if territory not in territory_summary:
                    territory_summary[territory] = {"count": 0, "amount": 0}
                territory_summary[territory]["count"] += 1
                territory_summary[territory]["amount"] += float(deal.get("Amount", 0) or 0)
            
            return {
                "deals": deals,
                "summary": {
                    "total_deals": total_deals,
                    "total_amount": total_amount,
                    "average_deal_size": total_amount / total_deals if total_deals > 0 else 0,
                    "stage_breakdown": stage_summary,
                    "territory_breakdown": territory_summary
                },
                "metadata": {
                    "module_name": module_name,
                    "timestamp": datetime.utcnow().isoformat(),
                    "filters_applied": filters or {},
                    "sync_session_id": sync_result.session_id if hasattr(sync_result, 'session_id') else None,
                    "data_source": "live_crm"
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to transform pipeline data: {str(e)}")
            raise
    
    async def _transform_deal_data(self, deal_record: Dict[str, Any]) -> Dict[str, Any]:
        """Transform individual deal record for enhanced display"""
        try:
            # Extract O2R milestone dates
            milestones = {
                "proposal_date": deal_record.get("Proposal_Date"),
                "sow_date": deal_record.get("SOW_Date"),
                "po_date": deal_record.get("PO_Date"),
                "kickoff_date": deal_record.get("Kickoff_Date"),
                "invoice_date": deal_record.get("Invoice_Date"),
                "payment_date": deal_record.get("Payment_Date"),
                "revenue_date": deal_record.get("Revenue_Date")
            }
            
            # Calculate health score based on milestones and timeline
            health_score = await self._calculate_deal_health_score(deal_record, milestones)
            
            # Determine current phase
            current_phase = self._determine_current_phase(milestones)
            
            return {
                **deal_record,  # Include all original fields
                "pipeline_pulse_data": {
                    "milestones": milestones,
                    "current_phase": current_phase,
                    "health_score": health_score,
                    "last_updated": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to transform deal data: {str(e)}")
            return deal_record
    
    async def _calculate_deal_health_score(self, 
                                         deal_record: Dict[str, Any],
                                         milestones: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate health score for a deal based on various factors"""
        try:
            score = 1.0  # Start with perfect score
            factors = []
            
            # Check closing date vs current date
            closing_date_str = deal_record.get("Closing_Date")
            if closing_date_str:
                try:
                    closing_date = datetime.fromisoformat(closing_date_str.replace('Z', '+00:00'))
                    days_to_close = (closing_date - datetime.utcnow()).days
                    
                    if days_to_close < 0:
                        score *= 0.5  # Overdue
                        factors.append("overdue_closing")
                    elif days_to_close < 30:
                        score *= 0.8  # At risk
                        factors.append("closing_soon")
                except:
                    pass
            
            # Check milestone progression
            completed_milestones = len([m for m in milestones.values() if m])
            total_milestones = len(milestones)
            milestone_completion = completed_milestones / total_milestones if total_milestones > 0 else 0.0
            
            if milestone_completion < 0.3:
                score *= 0.7
                factors.append("low_milestone_completion")
            
            # Check amount
            amount = float(deal_record.get("Amount", 0) or 0)
            if amount == 0:
                score *= 0.6
                factors.append("no_amount")
            
            # Determine status
            if score >= 0.8:
                status = "healthy"
                color = "green"
            elif score >= 0.6:
                status = "at_risk"
                color = "yellow"
            else:
                status = "critical"
                color = "red"
            
            return {
                "score": round(score, 2),
                "status": status,
                "color": color,
                "factors": factors,
                "milestone_completion_percentage": round(milestone_completion * 100, 1)
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate health score: {str(e)}")
            return {"score": 0.5, "status": "unknown", "color": "gray", "factors": ["calculation_error"]}
    
    def _determine_current_phase(self, milestones: Dict[str, Any]) -> str:
        """Determine the current phase based on completed milestones"""
        if milestones.get("revenue_date"):
            return "Revenue Realized"
        elif milestones.get("payment_date"):
            return "Payment Processing"
        elif milestones.get("invoice_date"):
            return "Invoice Sent"
        elif milestones.get("kickoff_date"):
            return "Project Execution"
        elif milestones.get("po_date"):
            return "PO Received"
        elif milestones.get("sow_date"):
            return "SOW Signed"
        elif milestones.get("proposal_date"):
            return "Proposal Submitted"
        else:
            return "Opportunity"
    
    async def _apply_filters(self, deals: List[Dict[str, Any]], 
                           filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters to deal list"""
        filtered_deals = deals
        
        # Territory filter
        if filters.get("territory"):
            filtered_deals = [
                deal for deal in filtered_deals 
                if deal.get("Territory") == filters["territory"]
            ]
        
        # Service line filter
        if filters.get("service_line"):
            filtered_deals = [
                deal for deal in filtered_deals 
                if deal.get("Service_Line") == filters["service_line"]
            ]
        
        # Date range filter
        if filters.get("date_from") or filters.get("date_to"):
            # Implement date filtering logic
            pass
        
        # Amount range filter
        if filters.get("min_amount") or filters.get("max_amount"):
            # Implement amount filtering logic
            pass
        
        return filtered_deals
    
    async def _calculate_dashboard_metrics(self, deals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate comprehensive dashboard metrics"""
        try:
            if not deals:
                return {
                    "total_deals": 0,
                    "total_pipeline_value": 0,
                    "avg_deal_size": 0,
                    "deals_by_stage": {},
                    "deals_by_territory": {},
                    "health_distribution": {},
                    "calculated_at": datetime.utcnow().isoformat()
                }
            
            total_deals = len(deals)
            total_value = sum(float(deal.get("Amount", 0) or 0) for deal in deals)
            avg_deal_size = total_value / total_deals if total_deals > 0 else 0
            
            # Group by stage
            stage_groups = {}
            for deal in deals:
                stage = deal.get("Stage", "Unknown")
                if stage not in stage_groups:
                    stage_groups[stage] = []
                stage_groups[stage].append(deal)
            
            stage_metrics = {}
            for stage, stage_deals in stage_groups.items():
                stage_metrics[stage] = {
                    "count": len(stage_deals),
                    "total_value": sum(float(d.get("Amount", 0) or 0) for d in stage_deals),
                    "avg_value": sum(float(d.get("Amount", 0) or 0) for d in stage_deals) / len(stage_deals)
                }
            
            # Group by territory
            territory_groups = {}
            for deal in deals:
                territory = deal.get("Territory", "Unknown")
                if territory not in territory_groups:
                    territory_groups[territory] = []
                territory_groups[territory].append(deal)
            
            territory_metrics = {}
            for territory, territory_deals in territory_groups.items():
                territory_metrics[territory] = {
                    "count": len(territory_deals),
                    "total_value": sum(float(d.get("Amount", 0) or 0) for d in territory_deals)
                }
            
            return {
                "total_deals": total_deals,
                "total_pipeline_value": total_value,
                "avg_deal_size": avg_deal_size,
                "deals_by_stage": stage_metrics,
                "deals_by_territory": territory_metrics,
                "calculated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate dashboard metrics: {str(e)}")
            return {"error": str(e), "calculated_at": datetime.utcnow().isoformat()}
    
    # ==================== Cache Management ====================
    
    def _generate_cache_key(self, data_type: str, module_name: str, 
                          fields: List[str] = None, filters: Dict[str, Any] = None) -> str:
        """Generate a unique cache key for data"""
        key_parts = [data_type, module_name]
        
        if fields:
            fields_hash = hashlib.md5(",".join(sorted(fields)).encode()).hexdigest()[:8]
            key_parts.append(f"fields_{fields_hash}")
        
        if filters:
            filters_str = json.dumps(filters, sort_keys=True)
            filters_hash = hashlib.md5(filters_str.encode()).hexdigest()[:8]
            key_parts.append(f"filters_{filters_hash}")
        
        return "_".join(key_parts)
    
    def _cache_data(self, cache_key: str, data: Dict[str, Any], 
                   module_name: str = None, ttl_minutes: int = None) -> None:
        """Cache data with metadata"""
        ttl = ttl_minutes or self.cache_ttl_minutes
        
        self._data_cache[cache_key] = data
        self._cache_metadata[cache_key] = {
            "last_updated": datetime.utcnow(),
            "ttl_minutes": ttl,
            "module_name": module_name,
            "access_count": 0,
            "hit_count": 0,
            "source": "crm"
        }
        
        logger.debug(f"Cached data for key: {cache_key}")
    
    def _update_cache_access(self, cache_key: str, hit: bool) -> None:
        """Update cache access statistics"""
        if cache_key in self._cache_metadata:
            self._cache_metadata[cache_key]["access_count"] += 1
            if hit:
                self._cache_metadata[cache_key]["hit_count"] += 1
    
    # ==================== Performance Monitoring ====================
    
    async def get_performance_metrics(self) -> LiveDataMetrics:
        """Get live data service performance metrics"""
        try:
            cache_hit_ratio = (self._cache_hits / self._request_count) * 100 if self._request_count > 0 else 0
            avg_response_time = self._total_response_time / self._request_count if self._request_count > 0 else 0
            
            # Get latest sync time
            recent_sessions = await self.sync_service.get_recent_sessions(limit=1)
            last_sync_time = None
            if recent_sessions:
                last_sync_time = datetime.fromisoformat(recent_sessions[0]["started_at"])
            
            # Create placeholder freshness info
            freshness_info = DataFreshnessInfo(
                level=DataFreshnessLevel.FRESH,
                last_updated=last_sync_time,
                age_minutes=0.0,
                next_refresh_due=datetime.utcnow() + timedelta(minutes=5),
                cache_hit_ratio=cache_hit_ratio,
                source="service"
            )
            
            return LiveDataMetrics(
                total_requests=self._request_count,
                cache_hits=self._cache_hits,
                cache_misses=self._cache_misses,
                avg_response_time_ms=avg_response_time,
                data_freshness=freshness_info,
                error_count=0,  # TODO: Track errors
                last_sync_time=last_sync_time
            )
            
        except Exception as e:
            logger.error(f"Failed to get performance metrics: {str(e)}")
            raise
    
    async def cleanup_expired_cache(self) -> int:
        """Clean up expired cache entries"""
        try:
            expired_keys = []
            current_time = datetime.utcnow()
            
            for cache_key, metadata in self._cache_metadata.items():
                last_updated = metadata.get("last_updated")
                ttl_minutes = metadata.get("ttl_minutes", self.cache_ttl_minutes)
                
                if last_updated and (current_time - last_updated).total_seconds() > (ttl_minutes * 60):
                    expired_keys.append(cache_key)
            
            # Remove expired entries
            for key in expired_keys:
                if key in self._data_cache:
                    del self._data_cache[key]
                if key in self._cache_metadata:
                    del self._cache_metadata[key]
            
            if expired_keys:
                logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
            
            return len(expired_keys)
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired cache: {str(e)}")
            return 0