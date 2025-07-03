"""
Zoho CRM Health Monitoring Service
Provides comprehensive health checks and alerts for CRM integration
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
from app.services.enhanced_zoho_service import EnhancedZohoService
from app.core.config import settings

logger = logging.getLogger(__name__)

class HealthStatus(Enum):
    HEALTHY = "healthy"
    WARNING = "warning" 
    CRITICAL = "critical"
    UNKNOWN = "unknown"

@dataclass
class HealthCheck:
    name: str
    status: HealthStatus
    message: str
    details: Dict[str, Any] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.details is None:
            self.details = {}

class ZohoHealthMonitor:
    """
    Comprehensive health monitoring for Zoho CRM integration
    """
    
    def __init__(self):
        self.zoho_service = EnhancedZohoService()
        self.health_history = []
        self.max_history = 100
        self.alert_thresholds = {
            "consecutive_failures": 3,
            "error_rate_threshold": 0.1,  # 10%
            "response_time_threshold": 10.0,  # 10 seconds
            "rate_limit_threshold": 0.9  # 90% of rate limit
        }
    
    async def run_comprehensive_health_check(self) -> Dict[str, Any]:
        """
        Run comprehensive health check including all aspects of CRM integration
        """
        health_checks = []
        start_time = datetime.now()
        
        # 1. Authentication Check
        auth_check = await self._check_authentication()
        health_checks.append(auth_check)
        
        # 2. API Connectivity Check
        connectivity_check = await self._check_api_connectivity()
        health_checks.append(connectivity_check)
        
        # 3. Rate Limit Check
        rate_limit_check = await self._check_rate_limits()
        health_checks.append(rate_limit_check)
        
        # 4. Field Configuration Check
        field_check = await self._check_field_configuration()
        health_checks.append(field_check)
        
        # 5. Data Quality Check
        data_quality_check = await self._check_data_quality()
        health_checks.append(data_quality_check)
        
        # 6. Webhook Status Check
        webhook_check = await self._check_webhook_status()
        health_checks.append(webhook_check)
        
        # Calculate overall health
        overall_status = self._calculate_overall_status(health_checks)
        
        health_report = {
            "overall_status": overall_status.value,
            "timestamp": start_time.isoformat(),
            "duration_seconds": (datetime.now() - start_time).total_seconds(),
            "api_version": self.zoho_service.api_version,
            "checks": [
                {
                    "name": check.name,
                    "status": check.status.value,
                    "message": check.message,
                    "details": check.details,
                    "timestamp": check.timestamp.isoformat()
                }
                for check in health_checks
            ],
            "summary": self._generate_health_summary(health_checks)
        }
        
        # Store in history
        self._store_health_report(health_report)
        
        return health_report
    
    async def _check_authentication(self) -> HealthCheck:
        """Check Zoho CRM authentication status"""
        try:
            start_time = datetime.now()
            auth_success = await self.zoho_service.authenticate()
            response_time = (datetime.now() - start_time).total_seconds()
            
            if auth_success:
                return HealthCheck(
                    name="Authentication",
                    status=HealthStatus.HEALTHY,
                    message="Authentication successful",
                    details={
                        "response_time_seconds": response_time,
                        "api_version": self.zoho_service.api_version
                    }
                )
            else:
                return HealthCheck(
                    name="Authentication",
                    status=HealthStatus.CRITICAL,
                    message="Authentication failed",
                    details={"response_time_seconds": response_time}
                )
                
        except Exception as e:
            return HealthCheck(
                name="Authentication",
                status=HealthStatus.CRITICAL,
                message=f"Authentication error: {str(e)}",
                details={"error": str(e)}
            )
    
    async def _check_api_connectivity(self) -> HealthCheck:
        """Check API connectivity and response times"""
        try:
            start_time = datetime.now()
            health_status = await self.zoho_service.get_connection_status()
            response_time = (datetime.now() - start_time).total_seconds()
            
            if health_status.get("status") == "healthy":
                status = HealthStatus.HEALTHY if response_time < self.alert_thresholds["response_time_threshold"] else HealthStatus.WARNING
                message = "API connectivity good"
                if response_time >= self.alert_thresholds["response_time_threshold"]:
                    message += f" (slow response: {response_time:.2f}s)"
                
                return HealthCheck(
                    name="API Connectivity",
                    status=status,
                    message=message,
                    details={
                        "response_time_seconds": response_time,
                        "org_name": health_status.get("org_name"),
                        "connection_details": health_status
                    }
                )
            else:
                return HealthCheck(
                    name="API Connectivity",
                    status=HealthStatus.CRITICAL,
                    message="API connectivity failed",
                    details=health_status
                )
                
        except Exception as e:
            return HealthCheck(
                name="API Connectivity",
                status=HealthStatus.CRITICAL,
                message=f"Connectivity check failed: {str(e)}",
                details={"error": str(e)}
            )
    
    async def _check_rate_limits(self) -> HealthCheck:
        """Check current rate limit usage"""
        try:
            # Access rate limit info from the client
            if hasattr(self.zoho_service.client, 'rate_limit_calls'):
                current_calls = self.zoho_service.client.rate_limit_calls
                rate_limit_usage = current_calls / 100  # Zoho allows 100 calls per minute
                
                if rate_limit_usage < self.alert_thresholds["rate_limit_threshold"]:
                    status = HealthStatus.HEALTHY
                    message = f"Rate limit usage: {current_calls}/100 calls"
                else:
                    status = HealthStatus.WARNING
                    message = f"High rate limit usage: {current_calls}/100 calls"
                
                return HealthCheck(
                    name="Rate Limits",
                    status=status,
                    message=message,
                    details={
                        "current_calls": current_calls,
                        "limit": 100,
                        "usage_percentage": rate_limit_usage * 100,
                        "reset_time": self.zoho_service.client.rate_limit_reset.isoformat()
                    }
                )
            else:
                return HealthCheck(
                    name="Rate Limits",
                    status=HealthStatus.UNKNOWN,
                    message="Rate limit information not available"
                )
                
        except Exception as e:
            return HealthCheck(
                name="Rate Limits",
                status=HealthStatus.WARNING,
                message=f"Rate limit check failed: {str(e)}",
                details={"error": str(e)}
            )
    
    async def _check_field_configuration(self) -> HealthCheck:
        """Check custom field configuration"""
        try:
            validation = await self.zoho_service.validate_custom_fields()
            
            if validation.get("validation_passed"):
                return HealthCheck(
                    name="Field Configuration",
                    status=HealthStatus.HEALTHY,
                    message="All required fields configured",
                    details=validation
                )
            else:
                missing_count = len(validation.get("missing_fields", []))
                coverage = validation.get("coverage_percentage", 0)
                
                if coverage >= 80:
                    status = HealthStatus.WARNING
                    message = f"Missing {missing_count} optional fields"
                else:
                    status = HealthStatus.CRITICAL
                    message = f"Missing {missing_count} required fields"
                
                return HealthCheck(
                    name="Field Configuration",
                    status=status,
                    message=message,
                    details=validation
                )
                
        except Exception as e:
            return HealthCheck(
                name="Field Configuration",
                status=HealthStatus.WARNING,
                message=f"Field validation failed: {str(e)}",
                details={"error": str(e)}
            )
    
    async def _check_data_quality(self) -> HealthCheck:
        """Check data quality and sample data availability"""
        try:
            # Get a small sample of deals to check data quality
            sample_deals = await self.zoho_service.client.get_deals(per_page=10)
            
            if not sample_deals:
                return HealthCheck(
                    name="Data Quality",
                    status=HealthStatus.WARNING,
                    message="No deals found in CRM",
                    details={"sample_size": 0}
                )
            
            # Analyze data quality
            quality_metrics = self._analyze_data_quality(sample_deals)
            
            if quality_metrics["completeness_score"] >= 0.8:
                status = HealthStatus.HEALTHY
                message = f"Good data quality ({quality_metrics['completeness_score']:.1%} complete)"
            elif quality_metrics["completeness_score"] >= 0.6:
                status = HealthStatus.WARNING
                message = f"Fair data quality ({quality_metrics['completeness_score']:.1%} complete)"
            else:
                status = HealthStatus.CRITICAL
                message = f"Poor data quality ({quality_metrics['completeness_score']:.1%} complete)"
            
            return HealthCheck(
                name="Data Quality",
                status=status,
                message=message,
                details={
                    "sample_size": len(sample_deals),
                    "quality_metrics": quality_metrics
                }
            )
            
        except Exception as e:
            return HealthCheck(
                name="Data Quality",
                status=HealthStatus.WARNING,
                message=f"Data quality check failed: {str(e)}",
                details={"error": str(e)}
            )
    
    async def _check_webhook_status(self) -> HealthCheck:
        """Check webhook configuration status"""
        try:
            webhook_configured = bool(
                settings.WEBHOOK_TOKEN and 
                settings.WEBHOOK_TOKEN != "your-webhook-secret-token" and
                settings.APP_BASE_URL
            )
            
            if webhook_configured:
                return HealthCheck(
                    name="Webhook Configuration",
                    status=HealthStatus.HEALTHY,
                    message="Webhooks configured",
                    details={
                        "webhook_url": f"{settings.APP_BASE_URL}/api/zoho/webhook",
                        "token_configured": True
                    }
                )
            else:
                return HealthCheck(
                    name="Webhook Configuration",
                    status=HealthStatus.WARNING,
                    message="Webhooks not configured",
                    details={
                        "webhook_url": f"{settings.APP_BASE_URL}/api/zoho/webhook",
                        "token_configured": False,
                        "recommendation": "Configure WEBHOOK_TOKEN and APP_BASE_URL"
                    }
                )
                
        except Exception as e:
            return HealthCheck(
                name="Webhook Configuration",
                status=HealthStatus.WARNING,
                message=f"Webhook check failed: {str(e)}",
                details={"error": str(e)}
            )
    
    def _analyze_data_quality(self, deals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze data quality metrics"""
        if not deals:
            return {"completeness_score": 0, "issues": ["No data available"]}
        
        required_fields = ["Deal_Name", "Account_Name", "Amount", "Stage", "Owner"]
        total_fields = len(required_fields) * len(deals)
        filled_fields = 0
        issues = []
        
        for deal in deals:
            for field in required_fields:
                value = deal.get(field)
                if value and str(value).strip() and str(value) != "None":
                    filled_fields += 1
                else:
                    issues.append(f"Missing {field} in deal {deal.get('id', 'unknown')}")
        
        completeness_score = filled_fields / total_fields if total_fields > 0 else 0
        
        # Check for duplicate deals
        deal_names = [deal.get("Deal_Name", "") for deal in deals]
        duplicates = len(deal_names) - len(set(deal_names))
        if duplicates > 0:
            issues.append(f"{duplicates} potential duplicate deal names")
        
        return {
            "completeness_score": completeness_score,
            "total_deals": len(deals),
            "filled_fields": filled_fields,
            "total_fields": total_fields,
            "duplicate_names": duplicates,
            "issues": issues[:10]  # Limit to first 10 issues
        }
    
    def _calculate_overall_status(self, health_checks: List[HealthCheck]) -> HealthStatus:
        """Calculate overall health status from individual checks"""
        statuses = [check.status for check in health_checks]
        
        if HealthStatus.CRITICAL in statuses:
            return HealthStatus.CRITICAL
        elif HealthStatus.WARNING in statuses:
            return HealthStatus.WARNING
        elif all(status == HealthStatus.HEALTHY for status in statuses):
            return HealthStatus.HEALTHY
        else:
            return HealthStatus.UNKNOWN
    
    def _generate_health_summary(self, health_checks: List[HealthCheck]) -> Dict[str, Any]:
        """Generate health summary statistics"""
        status_counts = {}
        for status in HealthStatus:
            status_counts[status.value] = sum(1 for check in health_checks if check.status == status)
        
        return {
            "total_checks": len(health_checks),
            "status_breakdown": status_counts,
            "critical_issues": [
                {"check": check.name, "message": check.message} 
                for check in health_checks if check.status == HealthStatus.CRITICAL
            ],
            "warnings": [
                {"check": check.name, "message": check.message}
                for check in health_checks if check.status == HealthStatus.WARNING
            ]
        }
    
    def _store_health_report(self, health_report: Dict[str, Any]):
        """Store health report in history"""
        self.health_history.append(health_report)
        
        # Keep only recent history
        if len(self.health_history) > self.max_history:
            self.health_history = self.health_history[-self.max_history:]
    
    async def get_health_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get health trends over specified time period"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        recent_reports = [
            report for report in self.health_history
            if datetime.fromisoformat(report["timestamp"]) >= cutoff_time
        ]
        
        if not recent_reports:
            return {
                "period_hours": hours,
                "reports_analyzed": 0,
                "message": "No health data available for the specified period"
            }
        
        # Calculate trends
        status_timeline = []
        for report in recent_reports:
            status_timeline.append({
                "timestamp": report["timestamp"],
                "overall_status": report["overall_status"],
                "critical_count": len(report["summary"]["critical_issues"]),
                "warning_count": len(report["summary"]["warnings"])
            })
        
        # Calculate availability percentage
        healthy_reports = sum(1 for report in recent_reports if report["overall_status"] == "healthy")
        availability_percentage = (healthy_reports / len(recent_reports)) * 100
        
        return {
            "period_hours": hours,
            "reports_analyzed": len(recent_reports),
            "availability_percentage": availability_percentage,
            "status_timeline": status_timeline,
            "latest_status": recent_reports[-1]["overall_status"] if recent_reports else "unknown",
            "trend_summary": {
                "improving": self._is_trend_improving(recent_reports),
                "stable": self._is_trend_stable(recent_reports),
                "degrading": self._is_trend_degrading(recent_reports)
            }
        }
    
    def _is_trend_improving(self, reports: List[Dict[str, Any]]) -> bool:
        """Check if health trend is improving"""
        if len(reports) < 3:
            return False
        
        recent_critical = sum(1 for report in reports[-3:] if report["overall_status"] == "critical")
        earlier_critical = sum(1 for report in reports[:-3] if report["overall_status"] == "critical")
        
        return recent_critical < earlier_critical
    
    def _is_trend_stable(self, reports: List[Dict[str, Any]]) -> bool:
        """Check if health trend is stable"""
        if len(reports) < 5:
            return True
        
        statuses = [report["overall_status"] for report in reports[-5:]]
        return len(set(statuses)) <= 2  # At most 2 different statuses in recent reports
    
    def _is_trend_degrading(self, reports: List[Dict[str, Any]]) -> bool:
        """Check if health trend is degrading"""
        if len(reports) < 3:
            return False
        
        recent_critical = sum(1 for report in reports[-3:] if report["overall_status"] == "critical")
        earlier_critical = sum(1 for report in reports[:-3] if report["overall_status"] == "critical")
        
        return recent_critical > earlier_critical
    
    async def _check_token_status(self) -> HealthCheck:
        """Check OAuth token status and expiration"""
        try:
            # Check if SDK can access token information
            sdk_config = self.sdk_manager.get_config()
            
            if not sdk_config:
                return HealthCheck(
                    name="Token Status",
                    status=HealthStatus.WARNING,
                    message="Cannot access token configuration",
                    details={}
                )
            
            # SDK manages token refresh automatically
            # We can only check if the SDK is properly configured
            return HealthCheck(
                name="Token Status",
                status=HealthStatus.HEALTHY,
                message="Token management handled by SDK",
                details={
                    "token_store_type": sdk_config.get("token_store_type", "unknown"),
                    "auto_refresh": True,
                    "sdk_managed": True
                }
            )
            
        except Exception as e:
            return HealthCheck(
                name="Token Status",
                status=HealthStatus.WARNING,
                message=f"Token status check failed: {str(e)}",
                details={"error": str(e)}
            )
    
    async def get_sdk_health_metrics(self) -> Dict[str, Any]:
        """Get comprehensive SDK health metrics"""
        try:
            health_report = await self.run_comprehensive_health_check()
            
            # Extract SDK-specific metrics
            sdk_metrics = {
                "overall_health": health_report["overall_status"],
                "sdk_initialized": self.sdk_manager.is_initialized(),
                "sdk_config": self.sdk_manager.get_config(),
                "last_check_time": health_report["timestamp"],
                "check_duration": health_report["duration_seconds"],
                "total_checks": len(health_report["checks"]),
                "healthy_checks": len([c for c in health_report["checks"] if c["status"] == "healthy"]),
                "warning_checks": len([c for c in health_report["checks"] if c["status"] == "warning"]),
                "critical_checks": len([c for c in health_report["checks"] if c["status"] == "critical"])
            }
            
            return sdk_metrics
            
        except Exception as e:
            logger.error(f"Failed to get SDK health metrics: {e}")
            return {
                "overall_health": "error",
                "error": str(e),
                "sdk_initialized": False
            }

# Global health monitor instance
health_monitor = ZohoHealthMonitor()


def get_health_monitor() -> ZohoHealthMonitor:
    """Get the global health monitor instance"""
    return health_monitor