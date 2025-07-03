"""
SDK Analytics Service - Optimized analytics and health calculations using SDK data
Processes large datasets efficiently with bulk operations and caching.
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, date, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict
import json

from app.services.async_zoho_wrapper import AsyncZohoWrapper
from app.services.sdk_response_transformer import get_response_transformer
from app.services.currency_service import currency_service
from app.services.zoho_sdk_manager import get_sdk_manager
from app.models.o2r.opportunity import HealthSignalType, OpportunityPhase
from app.core.database import get_db

logger = logging.getLogger(__name__)


@dataclass
class HealthMetrics:
    """Health metrics for a deal or portfolio"""
    total_deals: int
    healthy_deals: int
    at_risk_deals: int
    critical_deals: int
    blocked_deals: int
    overdue_deals: int
    total_value_sgd: float
    at_risk_value_sgd: float
    health_score: float  # 0-100


@dataclass
class PhaseMetrics:
    """Metrics for a specific O2R phase"""
    phase: str
    deal_count: int
    total_value_sgd: float
    avg_days_in_phase: float
    completion_rate: float
    at_risk_count: int


@dataclass
class TerritoryMetrics:
    """Metrics for a territory/region"""
    territory: str
    deal_count: int
    total_value_sgd: float
    health_metrics: HealthMetrics
    top_deals: List[Dict[str, Any]]


class SDKAnalyticsService:
    """
    SDK-powered analytics service with optimized calculations for large datasets
    """
    
    def __init__(self):
        self.sdk_manager = get_sdk_manager()
        self.transformer = get_response_transformer()
        self.cache_duration = 300  # 5 minutes cache
        self._cache = {}
        
    def _get_cache_key(self, prefix: str, params: Dict[str, Any]) -> str:
        """Generate cache key from parameters"""
        sorted_params = sorted(params.items())
        params_str = json.dumps(sorted_params, default=str)
        return f"{prefix}:{hash(params_str)}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cache entry is still valid"""
        if cache_key not in self._cache:
            return False
        
        cached_time = self._cache[cache_key].get("timestamp")
        if not cached_time:
            return False
        
        return (datetime.now() - cached_time).seconds < self.cache_duration
    
    def _cache_result(self, cache_key: str, result: Any):
        """Cache a result with timestamp"""
        self._cache[cache_key] = {
            "result": result,
            "timestamp": datetime.now()
        }
    
    def _get_cached_result(self, cache_key: str) -> Optional[Any]:
        """Get cached result if valid"""
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]["result"]
        return None
    
    async def get_portfolio_health_metrics(
        self, 
        filters: Optional[Dict[str, Any]] = None,
        use_cache: bool = True
    ) -> HealthMetrics:
        """
        Calculate comprehensive health metrics for the entire portfolio
        
        Args:
            filters: Optional filters to apply
            use_cache: Whether to use cached results
            
        Returns:
            HealthMetrics object with portfolio health data
        """
        cache_key = self._get_cache_key("portfolio_health", filters or {})
        
        if use_cache:
            cached_result = self._get_cached_result(cache_key)
            if cached_result:
                logger.debug("Returning cached portfolio health metrics")
                return cached_result
        
        try:
            logger.info("🔍 Calculating portfolio health metrics using SDK")
            
            # Fetch all deals using SDK
            deals = await self._fetch_deals_for_analysis(filters)
            
            if not deals:
                return HealthMetrics(
                    total_deals=0, healthy_deals=0, at_risk_deals=0,
                    critical_deals=0, blocked_deals=0, overdue_deals=0,
                    total_value_sgd=0.0, at_risk_value_sgd=0.0, health_score=0.0
                )
            
            # Calculate health metrics efficiently
            health_metrics = self._calculate_bulk_health_metrics(deals)
            
            # Cache the result
            if use_cache:
                self._cache_result(cache_key, health_metrics)
            
            logger.info(f"📊 Portfolio health calculated: {health_metrics.total_deals} deals, score: {health_metrics.health_score:.1f}")
            return health_metrics
            
        except Exception as e:
            logger.error(f"Failed to calculate portfolio health metrics: {e}")
            # Return empty metrics on error
            return HealthMetrics(
                total_deals=0, healthy_deals=0, at_risk_deals=0,
                critical_deals=0, blocked_deals=0, overdue_deals=0,
                total_value_sgd=0.0, at_risk_value_sgd=0.0, health_score=0.0
            )
    
    async def get_phase_metrics(
        self, 
        filters: Optional[Dict[str, Any]] = None,
        use_cache: bool = True
    ) -> List[PhaseMetrics]:
        """
        Calculate metrics for each O2R phase
        
        Args:
            filters: Optional filters to apply
            use_cache: Whether to use cached results
            
        Returns:
            List of PhaseMetrics for each phase
        """
        cache_key = self._get_cache_key("phase_metrics", filters or {})
        
        if use_cache:
            cached_result = self._get_cached_result(cache_key)
            if cached_result:
                logger.debug("Returning cached phase metrics")
                return cached_result
        
        try:
            logger.info("📈 Calculating phase metrics using SDK")
            
            deals = await self._fetch_deals_for_analysis(filters)
            phase_metrics = self._calculate_phase_metrics(deals)
            
            if use_cache:
                self._cache_result(cache_key, phase_metrics)
            
            logger.info(f"📊 Phase metrics calculated for {len(phase_metrics)} phases")
            return phase_metrics
            
        except Exception as e:
            logger.error(f"Failed to calculate phase metrics: {e}")
            return []
    
    async def get_territory_metrics(
        self, 
        filters: Optional[Dict[str, Any]] = None,
        use_cache: bool = True
    ) -> List[TerritoryMetrics]:
        """
        Calculate metrics by territory/region
        
        Args:
            filters: Optional filters to apply
            use_cache: Whether to use cached results
            
        Returns:
            List of TerritoryMetrics for each territory
        """
        cache_key = self._get_cache_key("territory_metrics", filters or {})
        
        if use_cache:
            cached_result = self._get_cached_result(cache_key)
            if cached_result:
                logger.debug("Returning cached territory metrics")
                return cached_result
        
        try:
            logger.info("🌍 Calculating territory metrics using SDK")
            
            deals = await self._fetch_deals_for_analysis(filters)
            territory_metrics = self._calculate_territory_metrics(deals)
            
            if use_cache:
                self._cache_result(cache_key, territory_metrics)
            
            logger.info(f"📊 Territory metrics calculated for {len(territory_metrics)} territories")
            return territory_metrics
            
        except Exception as e:
            logger.error(f"Failed to calculate territory metrics: {e}")
            return []
    
    async def get_health_signals_bulk(
        self, 
        deal_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculate health signals for multiple deals efficiently
        
        Args:
            deal_ids: List of deal IDs to calculate health for
            
        Returns:
            Dict mapping deal_id to health signal data
        """
        try:
            logger.info(f"🏥 Calculating health signals for {len(deal_ids)} deals")
            
            # Fetch deals by IDs using SDK
            deals = await self._fetch_deals_by_ids(deal_ids)
            
            # Calculate health signals in bulk
            health_signals = {}
            for deal in deals:
                deal_id = deal.get("id")
                if deal_id:
                    health_signal = self._calculate_deal_health_signal(deal)
                    health_signals[deal_id] = health_signal
            
            logger.info(f"📊 Health signals calculated for {len(health_signals)} deals")
            return health_signals
            
        except Exception as e:
            logger.error(f"Failed to calculate bulk health signals: {e}")
            return {}
    
    async def update_health_signals_in_crm(
        self, 
        health_updates: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Update calculated health signals back to CRM in bulk
        
        Args:
            health_updates: Dict mapping deal_id to health signal updates
            
        Returns:
            Update results
        """
        try:
            logger.info(f"🔄 Updating health signals in CRM for {len(health_updates)} deals")
            
            if not self.sdk_manager.is_initialized():
                raise Exception("SDK not initialized")
            
            # Prepare bulk update data
            updates_data = []
            for deal_id, health_data in health_updates.items():
                update_record = {
                    "id": deal_id,
                    "O2R_Health_Signal": health_data.get("signal", "Unknown"),
                    "O2R_Health_Reason": health_data.get("reason", ""),
                    "O2R_Last_Updated": datetime.now().strftime("%Y-%m-%d"),
                    "O2R_Risk_Level": health_data.get("risk_level", "Low")
                }
                updates_data.append(update_record)
            
            # Transform to SDK format
            sdk_updates = []
            for update in updates_data:
                sdk_update = self.transformer.transform_outbound_data(update)
                sdk_updates.append(sdk_update)
            
            # Update in batches
            batch_size = 100  # SDK limit
            successful_updates = 0
            failed_updates = 0
            
            async with AsyncZohoWrapper() as wrapper:
                for i in range(0, len(sdk_updates), batch_size):
                    batch = sdk_updates[i:i + batch_size]
                    
                    try:
                        response = await wrapper.update_records("Deals", batch)
                        
                        if response.get("status") == "success":
                            data = response.get("data", [])
                            batch_success = sum(1 for item in data if item.get("status") == "success")
                            successful_updates += batch_success
                            failed_updates += len(batch) - batch_success
                        else:
                            failed_updates += len(batch)
                        
                        # Small delay between batches
                        await asyncio.sleep(0.1)
                        
                    except Exception as e:
                        logger.error(f"Batch health update failed: {e}")
                        failed_updates += len(batch)
            
            logger.info(f"✅ Health signals update completed: {successful_updates} success, {failed_updates} failed")
            
            return {
                "status": "success" if failed_updates == 0 else "partial",
                "successful_updates": successful_updates,
                "failed_updates": failed_updates,
                "total_updates": len(health_updates)
            }
            
        except Exception as e:
            logger.error(f"Failed to update health signals in CRM: {e}")
            return {
                "status": "error",
                "message": str(e),
                "successful_updates": 0,
                "failed_updates": len(health_updates)
            }
    
    async def _fetch_deals_for_analysis(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Fetch deals from SDK for analysis"""
        try:
            if not self.sdk_manager.is_initialized():
                raise Exception("SDK not initialized")
            
            # Build field list for analytics
            analytics_fields = [
                "id", "Deal_Name", "Account_Name", "Amount", "Currency",
                "Stage", "Closing_Date", "Owner", "Modified_Time", "Created_Time",
                "Territory", "Service_Line", "Strategic_Account", "AWS_Funded",
                "Probability", "Country", "Type",
                "Proposal_Date", "PO_Date", "Kickoff_Date", "Invoice_Date",
                "Payment_Date", "Revenue_Date"
            ]
            
            all_deals = []
            page = 1
            per_page = 200
            
            async with AsyncZohoWrapper() as wrapper:
                while True:
                    try:
                        response = await wrapper.get_records(
                            module_name="Deals",
                            page=page,
                            per_page=per_page,
                            fields=analytics_fields,
                            sort_by="Modified_Time",
                            sort_order="desc"
                        )
                        
                        if response.get("status") != "success":
                            break
                        
                        deals = response.get("data", [])
                        if not deals:
                            break
                        
                        # Transform to Pipeline Pulse format
                        transformed_response = self.transformer.transform_records_response(response)
                        if transformed_response.get("status") == "success":
                            transformed_deals = transformed_response.get("data", [])
                            
                            # Apply filters if provided
                            if filters:
                                transformed_deals = self._apply_filters(transformed_deals, filters)
                            
                            all_deals.extend(transformed_deals)
                        
                        if len(deals) < per_page:
                            break
                        
                        page += 1
                        await asyncio.sleep(0.1)
                        
                    except Exception as e:
                        logger.error(f"Error fetching deals page {page}: {e}")
                        break
            
            # Process currency conversion in bulk
            if all_deals:
                db = next(get_db())
                try:
                    all_deals = currency_service.process_sdk_deals_currency(all_deals, db)
                finally:
                    db.close()
            
            logger.debug(f"Fetched {len(all_deals)} deals for analysis")
            return all_deals
            
        except Exception as e:
            logger.error(f"Failed to fetch deals for analysis: {e}")
            return []
    
    async def _fetch_deals_by_ids(self, deal_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetch specific deals by IDs"""
        try:
            deals = []
            
            # Fetch deals individually (SDK doesn't have bulk get by IDs)
            async with AsyncZohoWrapper() as wrapper:
                for deal_id in deal_ids:
                    try:
                        response = await wrapper.get_record("Deals", deal_id)
                        if response.get("status") == "success":
                            deal_data = response.get("data")
                            if deal_data:
                                # Transform to Pipeline Pulse format
                                transformed_response = self.transformer.transform_records_response({
                                    "status": "success",
                                    "data": [deal_data]
                                })
                                if transformed_response.get("status") == "success":
                                    transformed_deals = transformed_response.get("data", [])
                                    deals.extend(transformed_deals)
                        
                        await asyncio.sleep(0.05)  # Small delay
                        
                    except Exception as e:
                        logger.warning(f"Failed to fetch deal {deal_id}: {e}")
            
            return deals
            
        except Exception as e:
            logger.error(f"Failed to fetch deals by IDs: {e}")
            return []
    
    def _apply_filters(self, deals: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters to deals list"""
        filtered_deals = deals
        
        if "territory" in filters and filters["territory"]:
            filtered_deals = [d for d in filtered_deals if d.get("territory") == filters["territory"]]
        
        if "service_line" in filters and filters["service_line"]:
            filtered_deals = [d for d in filtered_deals if d.get("service_line") == filters["service_line"]]
        
        if "stage" in filters and filters["stage"]:
            filtered_deals = [d for d in filtered_deals if d.get("stage") == filters["stage"]]
        
        if "min_amount" in filters and filters["min_amount"]:
            min_amount = float(filters["min_amount"])
            filtered_deals = [d for d in filtered_deals if d.get("sgd_amount", 0) >= min_amount]
        
        return filtered_deals
    
    def _calculate_bulk_health_metrics(self, deals: List[Dict[str, Any]]) -> HealthMetrics:
        """Calculate health metrics for a list of deals"""
        total_deals = len(deals)
        
        if total_deals == 0:
            return HealthMetrics(
                total_deals=0, healthy_deals=0, at_risk_deals=0,
                critical_deals=0, blocked_deals=0, overdue_deals=0,
                total_value_sgd=0.0, at_risk_value_sgd=0.0, health_score=0.0
            )
        
        # Initialize counters
        healthy_deals = 0
        at_risk_deals = 0
        critical_deals = 0
        blocked_deals = 0
        overdue_deals = 0
        
        total_value_sgd = 0.0
        at_risk_value_sgd = 0.0
        
        # Process each deal
        for deal in deals:
            sgd_amount = deal.get("sgd_amount", 0.0)
            total_value_sgd += sgd_amount
            
            # Calculate health signal
            health_signal = self._calculate_deal_health_signal(deal)
            signal_type = health_signal.get("signal")
            
            if signal_type == "healthy":
                healthy_deals += 1
            elif signal_type == "at_risk":
                at_risk_deals += 1
                at_risk_value_sgd += sgd_amount
            elif signal_type == "critical":
                critical_deals += 1
                at_risk_value_sgd += sgd_amount
            elif signal_type == "blocked":
                blocked_deals += 1
                at_risk_value_sgd += sgd_amount
            
            # Check if overdue
            if self._is_deal_overdue(deal):
                overdue_deals += 1
        
        # Calculate overall health score (0-100)
        health_score = (healthy_deals / total_deals) * 100 if total_deals > 0 else 0
        
        return HealthMetrics(
            total_deals=total_deals,
            healthy_deals=healthy_deals,
            at_risk_deals=at_risk_deals,
            critical_deals=critical_deals,
            blocked_deals=blocked_deals,
            overdue_deals=overdue_deals,
            total_value_sgd=total_value_sgd,
            at_risk_value_sgd=at_risk_value_sgd,
            health_score=health_score
        )
    
    def _calculate_deal_health_signal(self, deal: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate health signal for a single deal"""
        try:
            closing_date_str = deal.get("closing_date")
            stage = deal.get("stage", "").lower()
            probability = deal.get("probability", 0)
            amount = deal.get("sgd_amount", 0)
            
            # Default to healthy
            signal = "healthy"
            reason = "Deal is on track"
            risk_level = "Low"
            
            if not closing_date_str:
                return {
                    "signal": "unknown",
                    "reason": "No closing date set",
                    "risk_level": "Medium"
                }
            
            # Parse closing date
            try:
                if isinstance(closing_date_str, str):
                    closing_date = datetime.fromisoformat(closing_date_str.replace('Z', '+00:00')).date()
                else:
                    closing_date = closing_date_str
                
                days_to_close = (closing_date - date.today()).days
                
                # Health logic based on Pipeline Pulse requirements
                if days_to_close < 0:  # Past due
                    signal = "critical"
                    reason = f"Deal is {abs(days_to_close)} days overdue"
                    risk_level = "High"
                elif days_to_close <= 7:  # Within 7 days
                    if probability < 75:
                        signal = "critical"
                        reason = f"Closing in {days_to_close} days but low probability ({probability}%)"
                        risk_level = "High"
                    elif probability < 90:
                        signal = "at_risk"
                        reason = f"Closing soon but probability could be higher ({probability}%)"
                        risk_level = "Medium"
                elif days_to_close <= 30:  # Within 30 days
                    if probability < 50:
                        signal = "at_risk"
                        reason = f"Low probability ({probability}%) for deal closing in {days_to_close} days"
                        risk_level = "Medium"
                elif days_to_close > 90:  # Far future
                    if amount > 1000000:  # Large deal
                        signal = "at_risk"
                        reason = f"Large deal ({amount:.0f} SGD) with distant close date"
                        risk_level = "Medium"
                
                # Stage-based adjustments
                if "lost" in stage or "dead" in stage:
                    signal = "blocked"
                    reason = "Deal appears to be lost or inactive"
                    risk_level = "High"
                elif "negotiation" in stage and days_to_close <= 14:
                    signal = "at_risk"
                    reason = "Still in negotiation close to closing date"
                    risk_level = "Medium"
                
                return {
                    "signal": signal,
                    "reason": reason,
                    "risk_level": risk_level,
                    "days_to_close": days_to_close,
                    "probability": probability
                }
                
            except Exception:
                return {
                    "signal": "unknown",
                    "reason": "Invalid closing date format",
                    "risk_level": "Medium"
                }
                
        except Exception as e:
            logger.warning(f"Health calculation failed for deal: {e}")
            return {
                "signal": "unknown",
                "reason": f"Health calculation error: {str(e)}",
                "risk_level": "Medium"
            }
    
    def _is_deal_overdue(self, deal: Dict[str, Any]) -> bool:
        """Check if deal is overdue"""
        try:
            closing_date_str = deal.get("closing_date")
            stage = deal.get("stage", "").lower()
            
            if not closing_date_str or "closed" in stage or "won" in stage:
                return False
            
            if isinstance(closing_date_str, str):
                closing_date = datetime.fromisoformat(closing_date_str.replace('Z', '+00:00')).date()
            else:
                closing_date = closing_date_str
            
            return closing_date < date.today()
            
        except Exception:
            return False
    
    def _calculate_phase_metrics(self, deals: List[Dict[str, Any]]) -> List[PhaseMetrics]:
        """Calculate metrics by O2R phase"""
        phase_data = defaultdict(lambda: {
            "deals": [],
            "total_value": 0.0,
            "at_risk_count": 0
        })
        
        # Group deals by phase
        for deal in deals:
            phase = self._determine_deal_phase(deal)
            phase_data[phase]["deals"].append(deal)
            phase_data[phase]["total_value"] += deal.get("sgd_amount", 0.0)
            
            # Check if at risk
            health_signal = self._calculate_deal_health_signal(deal)
            if health_signal.get("signal") in ["at_risk", "critical", "blocked"]:
                phase_data[phase]["at_risk_count"] += 1
        
        # Calculate metrics for each phase
        metrics = []
        for phase, data in phase_data.items():
            deal_count = len(data["deals"])
            if deal_count > 0:
                # Calculate average days in phase (simplified)
                avg_days = self._calculate_avg_days_in_phase(data["deals"])
                
                # Calculate completion rate (deals that have progressed past this phase)
                completion_rate = self._calculate_phase_completion_rate(phase, deals)
                
                metrics.append(PhaseMetrics(
                    phase=phase,
                    deal_count=deal_count,
                    total_value_sgd=data["total_value"],
                    avg_days_in_phase=avg_days,
                    completion_rate=completion_rate,
                    at_risk_count=data["at_risk_count"]
                ))
        
        return sorted(metrics, key=lambda x: x.phase)
    
    def _determine_deal_phase(self, deal: Dict[str, Any]) -> str:
        """Determine O2R phase for a deal"""
        # Check milestone dates to determine phase
        if deal.get("revenue_date"):
            return "Phase 4: Revenue Realization"
        elif deal.get("invoice_date") or deal.get("payment_date"):
            return "Phase 3: Execution"
        elif deal.get("po_date") or deal.get("kickoff_date"):
            return "Phase 2: Proposal to Commitment"
        elif deal.get("proposal_date"):
            return "Phase 1: Opportunity to Proposal"
        else:
            return "Phase 0: Opportunity"
    
    def _calculate_avg_days_in_phase(self, deals: List[Dict[str, Any]]) -> float:
        """Calculate average days deals have been in current phase"""
        total_days = 0
        count = 0
        
        for deal in deals:
            modified_time = deal.get("modified_time")
            if modified_time:
                try:
                    if isinstance(modified_time, str):
                        modified_date = datetime.fromisoformat(modified_time.replace('Z', '+00:00')).date()
                    else:
                        modified_date = modified_time
                    
                    days_in_phase = (date.today() - modified_date).days
                    total_days += days_in_phase
                    count += 1
                except Exception:
                    continue
        
        return total_days / count if count > 0 else 0.0
    
    def _calculate_phase_completion_rate(self, phase: str, all_deals: List[Dict[str, Any]]) -> float:
        """Calculate what percentage of deals have completed this phase"""
        phase_order = {
            "Phase 0: Opportunity": 0,
            "Phase 1: Opportunity to Proposal": 1,
            "Phase 2: Proposal to Commitment": 2,
            "Phase 3: Execution": 3,
            "Phase 4: Revenue Realization": 4
        }
        
        current_phase_level = phase_order.get(phase, 0)
        
        total_deals = len(all_deals)
        completed_deals = 0
        
        for deal in all_deals:
            deal_phase = self._determine_deal_phase(deal)
            deal_phase_level = phase_order.get(deal_phase, 0)
            
            if deal_phase_level > current_phase_level:
                completed_deals += 1
        
        return (completed_deals / total_deals) * 100 if total_deals > 0 else 0.0
    
    def _calculate_territory_metrics(self, deals: List[Dict[str, Any]]) -> List[TerritoryMetrics]:
        """Calculate metrics by territory"""
        territory_data = defaultdict(list)
        
        # Group deals by territory
        for deal in deals:
            territory = deal.get("territory", "Unknown")
            territory_data[territory].append(deal)
        
        # Calculate metrics for each territory
        metrics = []
        for territory, territory_deals in territory_data.items():
            if territory_deals:
                # Calculate health metrics for this territory
                health_metrics = self._calculate_bulk_health_metrics(territory_deals)
                
                # Get top deals (by value)
                top_deals = sorted(
                    territory_deals,
                    key=lambda x: x.get("sgd_amount", 0),
                    reverse=True
                )[:5]  # Top 5 deals
                
                # Simplify top deals data
                simplified_top_deals = []
                for deal in top_deals:
                    simplified_top_deals.append({
                        "deal_name": deal.get("deal_name", "Unknown"),
                        "account_name": deal.get("account_name", "Unknown"),
                        "sgd_amount": deal.get("sgd_amount", 0),
                        "stage": deal.get("stage", "Unknown"),
                        "closing_date": deal.get("closing_date")
                    })
                
                metrics.append(TerritoryMetrics(
                    territory=territory,
                    deal_count=len(territory_deals),
                    total_value_sgd=sum(d.get("sgd_amount", 0) for d in territory_deals),
                    health_metrics=health_metrics,
                    top_deals=simplified_top_deals
                ))
        
        return sorted(metrics, key=lambda x: x.total_value_sgd, reverse=True)
    
    def clear_cache(self):
        """Clear all cached results"""
        self._cache.clear()
        logger.info("🧹 Analytics cache cleared")


# Global instance
sdk_analytics_service = SDKAnalyticsService()


# Convenience functions
async def get_portfolio_health() -> HealthMetrics:
    """Get portfolio health metrics"""
    return await sdk_analytics_service.get_portfolio_health_metrics()


async def get_phase_analytics() -> List[PhaseMetrics]:
    """Get phase analytics"""
    return await sdk_analytics_service.get_phase_metrics()


async def get_territory_analytics() -> List[TerritoryMetrics]:
    """Get territory analytics"""
    return await sdk_analytics_service.get_territory_metrics()


async def update_all_health_signals() -> Dict[str, Any]:
    """Update health signals for all deals in CRM"""
    # This would be called by a background job
    try:
        # Fetch all deals
        deals = await sdk_analytics_service._fetch_deals_for_analysis()
        
        # Calculate health signals
        health_updates = {}
        for deal in deals:
            deal_id = deal.get("id")
            if deal_id:
                health_signal = sdk_analytics_service._calculate_deal_health_signal(deal)
                health_updates[deal_id] = health_signal
        
        # Update in CRM
        return await sdk_analytics_service.update_health_signals_in_crm(health_updates)
        
    except Exception as e:
        logger.error(f"Failed to update all health signals: {e}")
        return {"status": "error", "message": str(e)}