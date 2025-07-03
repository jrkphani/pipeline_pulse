"""
SDK Configuration Validator
Validates Zoho SDK configuration settings and provides recommendations
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
from app.core.config import settings
from app.services.zoho_sdk_manager import get_sdk_manager

logger = logging.getLogger(__name__)


class ConfigSeverity(Enum):
    """Configuration issue severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ConfigIssue:
    """Configuration validation issue"""
    field: str
    severity: ConfigSeverity
    message: str
    recommendation: str
    current_value: Any = None
    expected_value: Any = None


class SDKConfigValidator:
    """Validates SDK configuration and provides recommendations"""
    
    def __init__(self):
        self.sdk_manager = get_sdk_manager()
        self.required_settings = [
            'ZOHO_CLIENT_ID',
            'ZOHO_CLIENT_SECRET', 
            'ZOHO_REDIRECT_URI',
            'ZOHO_REFRESH_TOKEN'
        ]
        self.optional_settings = [
            'ZOHO_SDK_DATA_CENTER',
            'ZOHO_SDK_ENVIRONMENT',
            'ZOHO_SDK_TOKEN_STORE_TYPE',
            'ZOHO_SDK_TOKEN_STORE_PATH',
            'ZOHO_SDK_APPLICATION_NAME',
            'ZOHO_SDK_LOG_LEVEL',
            'ZOHO_USER_EMAIL'
        ]
    
    def validate_configuration(self) -> Dict[str, Any]:
        """
        Validate complete SDK configuration
        
        Returns:
            Dictionary with validation results
        """
        issues = []
        
        # Check required settings
        for setting in self.required_settings:
            issue = self._validate_required_setting(setting)
            if issue:
                issues.append(issue)
        
        # Check optional settings
        for setting in self.optional_settings:
            issue = self._validate_optional_setting(setting)
            if issue:
                issues.append(issue)
        
        # Check SDK initialization
        init_issue = self._validate_sdk_initialization()
        if init_issue:
            issues.append(init_issue)
        
        # Check data center configuration
        dc_issue = self._validate_data_center_config()
        if dc_issue:
            issues.append(dc_issue)
        
        # Check token store configuration
        token_issue = self._validate_token_store_config()
        if token_issue:
            issues.append(token_issue)
        
        # Generate overall status
        critical_count = len([i for i in issues if i.severity == ConfigSeverity.CRITICAL])
        error_count = len([i for i in issues if i.severity == ConfigSeverity.ERROR])
        warning_count = len([i for i in issues if i.severity == ConfigSeverity.WARNING])
        
        if critical_count > 0:
            overall_status = "critical"
        elif error_count > 0:
            overall_status = "error"
        elif warning_count > 0:
            overall_status = "warning"
        else:
            overall_status = "valid"
        
        return {
            "overall_status": overall_status,
            "total_issues": len(issues),
            "critical_issues": critical_count,
            "error_issues": error_count,
            "warning_issues": warning_count,
            "info_issues": len([i for i in issues if i.severity == ConfigSeverity.INFO]),
            "issues": [
                {
                    "field": issue.field,
                    "severity": issue.severity.value,
                    "message": issue.message,
                    "recommendation": issue.recommendation,
                    "current_value": self._mask_sensitive_value(issue.field, issue.current_value),
                    "expected_value": issue.expected_value
                }
                for issue in issues
            ],
            "sdk_initialized": self.sdk_manager.is_initialized(),
            "validation_timestamp": logger.info.__module__  # Placeholder for timestamp
        }
    
    def _validate_required_setting(self, setting_name: str) -> Optional[ConfigIssue]:
        """Validate a required setting"""
        value = getattr(settings, setting_name, None)
        
        if not value:
            return ConfigIssue(
                field=setting_name,
                severity=ConfigSeverity.CRITICAL,
                message=f"Required setting {setting_name} is not configured",
                recommendation=f"Set {setting_name} in environment variables or .env file",
                current_value=value
            )
        
        # Validate specific setting formats
        if setting_name == 'ZOHO_CLIENT_ID' and len(str(value)) < 10:
            return ConfigIssue(
                field=setting_name,
                severity=ConfigSeverity.ERROR,
                message="Client ID appears to be too short",
                recommendation="Verify the client ID from Zoho Developer Console",
                current_value=value
            )
        
        if setting_name == 'ZOHO_REDIRECT_URI' and not str(value).startswith(('http://', 'https://')):
            return ConfigIssue(
                field=setting_name,
                severity=ConfigSeverity.ERROR,
                message="Redirect URI must be a valid URL",
                recommendation="Use a complete URL like 'http://localhost:8000/oauth/callback'",
                current_value=value
            )
        
        return None
    
    def _validate_optional_setting(self, setting_name: str) -> Optional[ConfigIssue]:
        """Validate an optional setting"""
        value = getattr(settings, setting_name, None)
        
        if setting_name == 'ZOHO_SDK_DATA_CENTER':
            if value and value not in ['US', 'EU', 'IN', 'AU']:
                return ConfigIssue(
                    field=setting_name,
                    severity=ConfigSeverity.WARNING,
                    message=f"Invalid data center: {value}",
                    recommendation="Use one of: US, EU, IN, AU",
                    current_value=value,
                    expected_value="IN"
                )
        
        if setting_name == 'ZOHO_SDK_ENVIRONMENT':
            if value and value not in ['PRODUCTION', 'SANDBOX']:
                return ConfigIssue(
                    field=setting_name,
                    severity=ConfigSeverity.WARNING,
                    message=f"Invalid environment: {value}",
                    recommendation="Use 'PRODUCTION' or 'SANDBOX'",
                    current_value=value,
                    expected_value="PRODUCTION"
                )
        
        if setting_name == 'ZOHO_SDK_TOKEN_STORE_TYPE':
            if value and value not in ['FILE', 'DB']:
                return ConfigIssue(
                    field=setting_name,
                    severity=ConfigSeverity.WARNING,
                    message=f"Invalid token store type: {value}",
                    recommendation="Use 'FILE' or 'DB'",
                    current_value=value,
                    expected_value="FILE"
                )
        
        return None
    
    def _validate_sdk_initialization(self) -> Optional[ConfigIssue]:
        """Validate SDK initialization status"""
        if not self.sdk_manager.is_initialized():
            return ConfigIssue(
                field="SDK_INITIALIZATION",
                severity=ConfigSeverity.CRITICAL,
                message="SDK is not initialized",
                recommendation="Ensure all required settings are configured and call initialize_sdk()",
                current_value=False,
                expected_value=True
            )
        
        return None
    
    def _validate_data_center_config(self) -> Optional[ConfigIssue]:
        """Validate data center configuration consistency"""
        api_url = getattr(settings, 'ZOHO_BASE_URL', '')
        data_center = getattr(settings, 'ZOHO_SDK_DATA_CENTER', 'IN')
        
        # Check if API URL matches data center
        url_dc_mapping = {
            'IN': 'zohoapis.in',
            'US': 'zohoapis.com',
            'EU': 'zohoapis.eu',
            'AU': 'zohoapis.com.au'
        }
        
        expected_domain = url_dc_mapping.get(data_center)
        if expected_domain and expected_domain not in api_url:
            return ConfigIssue(
                field="DATA_CENTER_CONSISTENCY",
                severity=ConfigSeverity.WARNING,
                message=f"API URL doesn't match data center {data_center}",
                recommendation=f"Update ZOHO_BASE_URL to use {expected_domain}",
                current_value=api_url,
                expected_value=f"https://www.{expected_domain}/crm/v8"
            )
        
        return None
    
    def _validate_token_store_config(self) -> Optional[ConfigIssue]:
        """Validate token store configuration"""
        store_type = getattr(settings, 'ZOHO_SDK_TOKEN_STORE_TYPE', 'FILE')
        store_path = getattr(settings, 'ZOHO_SDK_TOKEN_STORE_PATH', './zoho_tokens.txt')
        
        if store_type == 'FILE':
            import os
            store_dir = os.path.dirname(store_path)
            
            if store_dir and not os.path.exists(store_dir):
                return ConfigIssue(
                    field="TOKEN_STORE_PATH",
                    severity=ConfigSeverity.WARNING,
                    message=f"Token store directory doesn't exist: {store_dir}",
                    recommendation="Create the directory or use a valid path",
                    current_value=store_path
                )
        
        return None
    
    def _mask_sensitive_value(self, field: str, value: Any) -> Any:
        """Mask sensitive configuration values for logging"""
        sensitive_fields = [
            'ZOHO_CLIENT_SECRET',
            'ZOHO_REFRESH_TOKEN'
        ]
        
        if field in sensitive_fields and value:
            return f"{'*' * (len(str(value)) - 4)}{str(value)[-4:]}"
        
        return value
    
    def get_configuration_recommendations(self) -> List[Dict[str, Any]]:
        """Get configuration recommendations for optimal SDK usage"""
        recommendations = []
        
        # Performance recommendations
        recommendations.append({
            "category": "performance",
            "title": "Use FILE token store for single-instance deployments",
            "description": "FILE token store is simpler and faster for single-instance applications",
            "priority": "medium",
            "current_setting": getattr(settings, 'ZOHO_SDK_TOKEN_STORE_TYPE', 'FILE'),
            "recommended_setting": "FILE"
        })
        
        # Security recommendations
        recommendations.append({
            "category": "security",
            "title": "Use environment variables for sensitive data",
            "description": "Store client secrets and refresh tokens in environment variables, not in code",
            "priority": "high",
            "current_setting": "check_env_vars",
            "recommended_setting": "environment_variables"
        })
        
        # Reliability recommendations
        recommendations.append({
            "category": "reliability",
            "title": "Set appropriate log level",
            "description": "Use INFO for production, DEBUG for development",
            "priority": "low",
            "current_setting": getattr(settings, 'ZOHO_SDK_LOG_LEVEL', 'INFO'),
            "recommended_setting": "INFO"
        })
        
        return recommendations
    
    def validate_runtime_config(self) -> Dict[str, Any]:
        """Validate runtime configuration after SDK initialization"""
        try:
            sdk_config = self.sdk_manager.get_config()
            validation_result = self.sdk_manager.validate_initialization()
            
            runtime_issues = []
            
            if not sdk_config:
                runtime_issues.append({
                    "component": "sdk_config",
                    "status": "error",
                    "message": "SDK configuration not available"
                })
            
            if validation_result.get("status") != "success":
                runtime_issues.append({
                    "component": "sdk_validation",
                    "status": "error",
                    "message": validation_result.get("message", "SDK validation failed")
                })
            
            return {
                "runtime_status": "healthy" if not runtime_issues else "issues",
                "sdk_config": sdk_config,
                "validation_result": validation_result,
                "runtime_issues": runtime_issues,
                "timestamp": "current_time"  # Placeholder
            }
            
        except Exception as e:
            logger.error(f"Runtime config validation failed: {e}")
            return {
                "runtime_status": "error",
                "error": str(e),
                "timestamp": "current_time"
            }


# Global validator instance
_config_validator = None


def get_config_validator() -> SDKConfigValidator:
    """Get or create the global config validator instance"""
    global _config_validator
    if _config_validator is None:
        _config_validator = SDKConfigValidator()
    return _config_validator


def validate_sdk_config() -> Dict[str, Any]:
    """Convenience function to validate SDK configuration"""
    validator = get_config_validator()
    return validator.validate_configuration()


def get_config_recommendations() -> List[Dict[str, Any]]:
    """Convenience function to get configuration recommendations"""
    validator = get_config_validator()
    return validator.get_configuration_recommendations()