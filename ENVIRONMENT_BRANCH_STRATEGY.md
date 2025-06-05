# Environment Branch Strategy & Configuration Management

## 🎯 **Branch-Specific Environment Handling**

### **Current Branch Structure**
```
main (production)     → AWS Secrets Manager + v8 API
├── dev (development) → AWS Secrets Manager + v2 API (needs update)
└── local-testing     → Local .env files + v8 API (working)
```

---

## 🔧 **Key Differences Between Branches**

### **1. Secrets Management**

#### **`local-testing` Branch** ✅ *Working*
```python
# backend/app/core/config.py
@property
def ZOHO_CLIENT_SECRET(self) -> str:
    """Get Zoho client secret from environment or Secrets Manager"""
    # For local testing branch, always use environment variables first
    env_secret = os.getenv("ZOHO_CLIENT_SECRET", "")
    if env_secret:
        return env_secret
    
    # Fall back to Secrets Manager only in production
    if self.ENVIRONMENT == "production":
        try:
            from app.core.secrets import secrets_manager
            return secrets_manager.get_zoho_client_secret()
        except Exception:
            return ""
    return ""
```

#### **`dev` & `main` Branches** ⚠️ *Needs Update*
```python
# Original implementation - AWS Secrets Manager first
@property
def ZOHO_CLIENT_SECRET(self) -> str:
    """Get Zoho client secret from Secrets Manager in production"""
    if self.ENVIRONMENT == "production":
        from app.core.secrets import secrets_manager
        return secrets_manager.get_zoho_client_secret()
    return os.getenv("ZOHO_CLIENT_SECRET", "")
```

### **2. API Version Configuration**

#### **`local-testing` Branch** ✅ *v8 API*
```bash
# backend/.env
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v8
ZOHO_REFRESH_TOKEN=1000.9c3015bbe4d6996... # Fresh token
```

#### **`dev` & `main` Branches** ⚠️ *v2 API (outdated)*
```bash
# backend/.env (if exists)
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2
ZOHO_REFRESH_TOKEN=1000.1f6445ad715711... # Expired token
```

### **3. Environment Variable Loading**

#### **`local-testing` Branch** ✅ *Enhanced Loading*
- Diagnostic scripts load `.env` explicitly
- Configuration prioritizes local environment variables
- Fallback to AWS Secrets Manager only in production

#### **`dev` & `main` Branches** ⚠️ *Standard Loading*
- Standard pydantic-settings loading
- AWS Secrets Manager priority in production
- May not load local `.env` properly

---

## 📋 **Migration Strategy for Each Branch**

### **Phase 1: Update `dev` Branch** 🔄

#### **1.1 Merge Configuration Changes**
```bash
# Merge local-testing config changes to dev
git checkout dev
git merge local-testing --no-commit
# Resolve conflicts, keeping enhanced config
git commit -m "Update config for flexible environment handling"
```

#### **1.2 Update API Version**
```bash
# Update dev environment to v8
# backend/.env (dev branch)
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v8
```

#### **1.3 Refresh Tokens for Dev**
- Use same authorization flow as local-testing
- Update dev environment with fresh tokens
- Test dev environment connectivity

### **Phase 2: Update `main` Branch** 🚀

#### **2.1 Production-Safe Migration**
```python
# Ensure production safety with environment checks
@property
def ZOHO_CLIENT_SECRET(self) -> str:
    """Get Zoho client secret with environment-aware fallback"""
    # Production: Always try Secrets Manager first
    if self.ENVIRONMENT == "production":
        try:
            from app.core.secrets import secrets_manager
            secret = secrets_manager.get_zoho_client_secret()
            if secret:
                return secret
        except Exception as e:
            logger.warning(f"Secrets Manager unavailable: {e}")
    
    # Development/Local: Use environment variables
    return os.getenv("ZOHO_CLIENT_SECRET", "")
```

#### **2.2 Production Token Update**
- Update AWS Secrets Manager with fresh tokens
- Update production API URL to v8
- Gradual rollout with monitoring

---

## 🛡️ **Configuration Management Strategy**

### **1. Environment-Aware Configuration Class**

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing settings ...
    
    @property
    def is_local_development(self) -> bool:
        """Check if running in local development mode"""
        return self.ENVIRONMENT in ["development", "local", "testing"]
    
    @property
    def use_local_secrets(self) -> bool:
        """Determine if should use local environment variables"""
        # Use local secrets for development or when AWS is unavailable
        return self.is_local_development or not self._aws_available()
    
    def _aws_available(self) -> bool:
        """Check if AWS services are available"""
        try:
            import boto3
            # Quick AWS connectivity check
            boto3.client('sts').get_caller_identity()
            return True
        except Exception:
            return False
    
    @property
    def ZOHO_CLIENT_SECRET(self) -> str:
        """Smart secret retrieval based on environment"""
        if self.use_local_secrets:
            return os.getenv("ZOHO_CLIENT_SECRET", "")
        
        # Production: Use AWS Secrets Manager
        try:
            from app.core.secrets import secrets_manager
            return secrets_manager.get_zoho_client_secret()
        except Exception as e:
            logger.warning(f"AWS Secrets unavailable, falling back to env: {e}")
            return os.getenv("ZOHO_CLIENT_SECRET", "")
```

### **2. Branch-Specific Environment Files**

#### **Create Branch-Specific Configs**
```bash
# Different .env files for different purposes
backend/.env.local-testing    # Local development
backend/.env.dev             # Development server
backend/.env.production      # Production overrides
```

#### **Smart Environment Loading**
```python
# backend/app/core/config.py
def load_environment_config():
    """Load environment config based on branch/environment"""
    import subprocess
    
    try:
        # Get current git branch
        branch = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            cwd=os.path.dirname(__file__)
        ).decode().strip()
        
        # Load branch-specific config
        env_file = f".env.{branch}"
        if os.path.exists(env_file):
            load_dotenv(env_file)
            logger.info(f"Loaded branch-specific config: {env_file}")
    except Exception:
        pass
    
    # Always load default .env as fallback
    load_dotenv(".env")
```

### **3. Configuration Validation**

```python
# backend/app/core/config_validator.py
class ConfigValidator:
    """Validate configuration for different environments"""
    
    @staticmethod
    def validate_zoho_config(settings: Settings) -> Dict[str, Any]:
        """Validate Zoho configuration"""
        issues = []
        
        # Check required fields
        required_fields = [
            "ZOHO_CLIENT_ID",
            "ZOHO_CLIENT_SECRET", 
            "ZOHO_REFRESH_TOKEN",
            "ZOHO_BASE_URL"
        ]
        
        for field in required_fields:
            if not getattr(settings, field, None):
                issues.append(f"Missing {field}")
        
        # Check API version compatibility
        if settings.ZOHO_BASE_URL:
            if "/v2/" in settings.ZOHO_BASE_URL:
                issues.append("Using deprecated v2 API - update to v8")
            elif "/v8/" not in settings.ZOHO_BASE_URL:
                issues.append("API version unclear - should use v8")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "environment": settings.ENVIRONMENT,
            "branch": get_current_branch()
        }
```

---

## 📝 **Documentation & Tracking**

### **1. Branch Comparison Matrix**

| Feature | `local-testing` | `dev` | `main` |
|---------|----------------|-------|--------|
| **Secrets Source** | Local .env first | AWS Secrets | AWS Secrets |
| **API Version** | v8 ✅ | v2 ⚠️ | v2 ⚠️ |
| **Token Status** | Fresh ✅ | Expired ⚠️ | Expired ⚠️ |
| **Config Priority** | Env → AWS | AWS → Env | AWS → Env |
| **Testing Status** | Working ✅ | Needs Update | Needs Update |

### **2. Migration Checklist**

#### **For Each Branch Update:**
- [ ] Update `backend/app/core/config.py` with smart secret handling
- [ ] Update `ZOHO_BASE_URL` to v8 API
- [ ] Refresh OAuth tokens using authorization flow
- [ ] Update all API calls to include `fields` parameter
- [ ] Test authentication and basic API calls
- [ ] Update diagnostic scripts for branch
- [ ] Validate production deployment (for main branch)

### **3. Automated Validation**

```bash
# scripts/validate-environment.py
#!/usr/bin/env python3
"""Validate environment configuration for current branch"""

def validate_current_environment():
    """Validate configuration for current git branch"""
    branch = get_current_branch()
    config = load_config_for_branch(branch)
    validation = ConfigValidator.validate_zoho_config(config)
    
    print(f"🔍 Validating {branch} branch configuration...")
    
    if validation["valid"]:
        print("✅ Configuration is valid")
    else:
        print("❌ Configuration issues found:")
        for issue in validation["issues"]:
            print(f"   • {issue}")
    
    return validation["valid"]
```

---

## 🚨 **Risk Mitigation**

### **1. Configuration Drift Prevention**
- **Automated checks**: Validate config on each branch switch
- **Documentation**: Keep this file updated with each change
- **Testing**: Environment-specific test suites

### **2. Secret Management Safety**
- **Never commit secrets**: Use `.env.example` files
- **Rotation tracking**: Document token refresh dates
- **Fallback mechanisms**: Always have local backup options

### **3. Deployment Safety**
- **Gradual rollout**: Test each branch thoroughly
- **Rollback plans**: Keep working configurations
- **Monitoring**: Track API health across environments

---

## 🎯 **Action Items for Implementation**

### **Immediate (Next 30 minutes)**
1. Create this documentation file
2. Add branch-specific validation script
3. Create environment comparison matrix

### **Short-term (Next 2 hours)**
1. Update `dev` branch with local-testing improvements
2. Refresh tokens for dev environment
3. Test dev branch functionality

### **Medium-term (Next day)**
1. Plan production migration strategy
2. Update AWS Secrets Manager
3. Implement automated validation

---

**This strategy ensures we maintain clear separation between environments while preserving the working solutions from `local-testing` branch.**
