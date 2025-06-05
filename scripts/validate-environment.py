#!/usr/bin/env python3
"""
Environment Configuration Validator
Validates and compares configuration across different git branches
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables from backend/.env
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)


def get_current_branch() -> str:
    """Get current git branch"""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__)
        )
        return result.stdout.strip()
    except Exception:
        return "unknown"


def get_config_for_branch(branch: str) -> Dict[str, Any]:
    """Get configuration for specific branch"""
    
    # Import after loading environment
    from app.core.config import settings
    
    config = {
        "branch": branch,
        "timestamp": datetime.now().isoformat(),
        "environment": settings.ENVIRONMENT,
        "zoho_config": {
            "client_id": settings.ZOHO_CLIENT_ID,
            "base_url": settings.ZOHO_BASE_URL,
            "accounts_url": settings.ZOHO_ACCOUNTS_URL,
            "has_client_secret": bool(settings.ZOHO_CLIENT_SECRET),
            "has_refresh_token": bool(settings.ZOHO_REFRESH_TOKEN),
            "client_secret_length": len(settings.ZOHO_CLIENT_SECRET) if settings.ZOHO_CLIENT_SECRET else 0,
            "refresh_token_length": len(settings.ZOHO_REFRESH_TOKEN) if settings.ZOHO_REFRESH_TOKEN else 0
        },
        "api_version": "v8" if "/v8/" in settings.ZOHO_BASE_URL else "v2" if "/v2/" in settings.ZOHO_BASE_URL else "unknown",
        "secrets_strategy": determine_secrets_strategy(),
        "env_file_exists": os.path.exists(backend_env_path),
        "aws_available": check_aws_availability()
    }
    
    return config


def determine_secrets_strategy() -> str:
    """Determine how secrets are being handled"""
    try:
        from app.core.config import settings
        
        # Check if we're using the enhanced config from local-testing
        client_secret = settings.ZOHO_CLIENT_SECRET
        env_secret = os.getenv("ZOHO_CLIENT_SECRET", "")
        
        if env_secret and client_secret == env_secret:
            return "environment_first"
        elif client_secret and not env_secret:
            return "aws_secrets_only"
        elif env_secret and not client_secret:
            return "environment_only"
        else:
            return "unknown"
    except Exception:
        return "error"


def check_aws_availability() -> bool:
    """Check if AWS services are available"""
    try:
        import boto3
        boto3.client('sts').get_caller_identity()
        return True
    except Exception:
        return False


def validate_zoho_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Zoho configuration"""
    
    issues = []
    warnings = []
    
    zoho_config = config["zoho_config"]
    
    # Check required fields
    required_fields = [
        ("client_id", "ZOHO_CLIENT_ID"),
        ("has_client_secret", "ZOHO_CLIENT_SECRET"),
        ("has_refresh_token", "ZOHO_REFRESH_TOKEN"),
        ("base_url", "ZOHO_BASE_URL")
    ]
    
    for field_key, field_name in required_fields:
        if not zoho_config.get(field_key):
            issues.append(f"Missing {field_name}")
    
    # Check API version
    api_version = config["api_version"]
    if api_version == "v2":
        warnings.append("Using deprecated v2 API - should update to v8")
    elif api_version == "unknown":
        issues.append("API version unclear - should use v8")
    elif api_version == "v8":
        pass  # Good!
    
    # Check token lengths (basic validation)
    if zoho_config["refresh_token_length"] > 0 and zoho_config["refresh_token_length"] < 50:
        warnings.append("Refresh token seems too short - may be invalid")
    
    # Check secrets strategy
    secrets_strategy = config["secrets_strategy"]
    branch = config["branch"]
    
    if branch == "local-testing" and secrets_strategy != "environment_first":
        warnings.append("local-testing branch should prioritize environment variables")
    elif branch in ["main", "production"] and secrets_strategy == "environment_only":
        warnings.append("Production branches should use AWS Secrets Manager")
    
    # Check environment file
    if not config["env_file_exists"]:
        warnings.append("No .env file found - may cause configuration issues")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "score": max(0, 100 - len(issues) * 30 - len(warnings) * 10)
    }


def compare_branches(branches: List[str]) -> Dict[str, Any]:
    """Compare configuration across multiple branches"""
    
    current_branch = get_current_branch()
    comparison = {
        "current_branch": current_branch,
        "timestamp": datetime.now().isoformat(),
        "branches": {}
    }
    
    for branch in branches:
        try:
            # Switch to branch temporarily (read-only check)
            result = subprocess.run(
                ['git', 'show', f'{branch}:backend/.env'],
                capture_output=True,
                text=True,
                cwd=os.path.dirname(__file__)
            )
            
            if result.returncode == 0:
                # Parse .env content
                env_content = result.stdout
                branch_config = parse_env_content(env_content)
                branch_config["branch"] = branch
                branch_config["accessible"] = True
            else:
                branch_config = {
                    "branch": branch,
                    "accessible": False,
                    "error": "Could not access .env file"
                }
            
            comparison["branches"][branch] = branch_config
            
        except Exception as e:
            comparison["branches"][branch] = {
                "branch": branch,
                "accessible": False,
                "error": str(e)
            }
    
    return comparison


def parse_env_content(env_content: str) -> Dict[str, Any]:
    """Parse .env file content"""
    config = {}
    
    for line in env_content.split('\n'):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            config[key] = value
    
    return {
        "zoho_base_url": config.get("ZOHO_BASE_URL", ""),
        "has_client_id": bool(config.get("ZOHO_CLIENT_ID", "")),
        "has_client_secret": bool(config.get("ZOHO_CLIENT_SECRET", "")),
        "has_refresh_token": bool(config.get("ZOHO_REFRESH_TOKEN", "")),
        "api_version": "v8" if "/v8/" in config.get("ZOHO_BASE_URL", "") else "v2" if "/v2/" in config.get("ZOHO_BASE_URL", "") else "unknown"
    }


def main():
    """Main validation function"""
    
    print("🔍 Environment Configuration Validator")
    print("=" * 60)
    
    current_branch = get_current_branch()
    print(f"Current Branch: {current_branch}")
    print(f"Validation Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Validate current configuration
    print("📋 Current Configuration Validation:")
    print("-" * 40)
    
    config = get_config_for_branch(current_branch)
    validation = validate_zoho_config(config)
    
    print(f"Environment: {config['environment']}")
    print(f"API Version: {config['api_version']}")
    print(f"Secrets Strategy: {config['secrets_strategy']}")
    print(f"AWS Available: {config['aws_available']}")
    print(f"Configuration Score: {validation['score']}/100")
    print()
    
    if validation["valid"]:
        print("✅ Configuration is valid")
    else:
        print("❌ Configuration issues found:")
        for issue in validation["issues"]:
            print(f"   • {issue}")
    
    if validation["warnings"]:
        print("⚠️ Warnings:")
        for warning in validation["warnings"]:
            print(f"   • {warning}")
    
    print()
    
    # Compare with other branches
    print("🔄 Branch Comparison:")
    print("-" * 40)
    
    branches_to_compare = ["local-testing", "dev", "main"]
    if current_branch not in branches_to_compare:
        branches_to_compare.append(current_branch)
    
    comparison = compare_branches(branches_to_compare)
    
    print(f"{'Branch':<15} {'API Ver':<8} {'Secrets':<10} {'Status':<10}")
    print("-" * 50)
    
    for branch_name, branch_data in comparison["branches"].items():
        if branch_data.get("accessible"):
            api_ver = branch_data.get("api_version", "unknown")
            secrets_status = "✅" if branch_data.get("has_refresh_token") else "❌"
            status = "✅ Ready" if api_ver == "v8" and branch_data.get("has_refresh_token") else "⚠️ Needs Update"
        else:
            api_ver = "N/A"
            secrets_status = "❌"
            status = "❌ Error"
        
        current_marker = " (current)" if branch_name == current_branch else ""
        print(f"{branch_name + current_marker:<15} {api_ver:<8} {secrets_status:<10} {status:<10}")
    
    print()
    
    # Recommendations
    print("💡 Recommendations:")
    print("-" * 40)
    
    if current_branch == "local-testing":
        if validation["valid"]:
            print("✅ local-testing branch is properly configured")
            print("   • Ready for development and testing")
            print("   • Consider merging improvements to dev branch")
        else:
            print("❌ local-testing branch needs fixes")
    
    elif current_branch == "dev":
        if config["api_version"] != "v8":
            print("⚠️ dev branch needs API version update")
            print("   • Update ZOHO_BASE_URL to v8")
            print("   • Refresh OAuth tokens")
        if config["secrets_strategy"] != "environment_first":
            print("⚠️ dev branch needs config update")
            print("   • Merge local-testing configuration improvements")
    
    elif current_branch == "main":
        if config["api_version"] != "v8":
            print("🚨 main branch needs careful API migration")
            print("   • Plan production API update")
            print("   • Update AWS Secrets Manager")
            print("   • Test thoroughly before deployment")
    
    else:
        print(f"ℹ️ Unknown branch: {current_branch}")
        print("   • Compare with local-testing for reference")
    
    # Save validation report
    report_file = f"environment_validation_{current_branch}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    report_data = {
        "config": config,
        "validation": validation,
        "comparison": comparison
    }
    
    with open(report_file, 'w') as f:
        json.dump(report_data, f, indent=2, default=str)
    
    print(f"\n📄 Detailed report saved to: {report_file}")


if __name__ == "__main__":
    main()
