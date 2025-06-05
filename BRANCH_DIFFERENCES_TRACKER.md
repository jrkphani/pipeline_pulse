# Branch Differences Tracker

## 🎯 **Critical Differences to Remember**

### **Configuration Strategy Differences**

| Branch | Secret Loading | API Version | Token Status | Config File |
|--------|---------------|-------------|--------------|-------------|
| `local-testing` | **Env First** → AWS Fallback | **v8** ✅ | **Fresh** ✅ | Enhanced |
| `dev` | AWS First → Env Fallback | **v2** ⚠️ | **Expired** ❌ | Standard |
| `main` | AWS First → Env Fallback | **v2** ⚠️ | **Expired** ❌ | Standard |

---

## 🔧 **Key Code Differences**

### **1. Secret Loading Strategy**

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

#### **`dev` & `main` Branches** ⚠️ *Original*
```python
# backend/app/core/config.py
@property
def ZOHO_CLIENT_SECRET(self) -> str:
    """Get Zoho client secret from Secrets Manager in production"""
    if self.ENVIRONMENT == "production":
        from app.core.secrets import secrets_manager
        return secrets_manager.get_zoho_client_secret()
    return os.getenv("ZOHO_CLIENT_SECRET", "")
```

### **2. Environment Variables**

#### **`local-testing` Branch** ✅ *Updated*
```bash
# backend/.env
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v8
ZOHO_REFRESH_TOKEN=1000.9c3015bbe4d6996c6fc3987d19dfe52d.afe4cc9c53d65bdd5bfe800d90d28401
```

#### **`dev` & `main` Branches** ⚠️ *Outdated*
```bash
# backend/.env (if exists)
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2
ZOHO_REFRESH_TOKEN=1000.1f6445ad715711237fbf078342cc1975.efec29cda25213ee26264296c04dd176
```

---

## 📋 **Migration Checklist for Each Branch**

### **When Working on `dev` Branch:**
- [ ] **REMEMBER**: Merge config changes from `local-testing`
- [ ] **UPDATE**: API URL from v2 to v8
- [ ] **REFRESH**: OAuth tokens using authorization flow
- [ ] **TEST**: All API calls include `fields` parameter
- [ ] **VALIDATE**: Environment configuration

### **When Working on `main` Branch:**
- [ ] **REMEMBER**: Production uses AWS Secrets Manager
- [ ] **UPDATE**: AWS Secrets with fresh tokens
- [ ] **UPDATE**: API URL to v8 in production
- [ ] **TEST**: Production deployment thoroughly
- [ ] **MONITOR**: API health after changes

---

## 🚨 **Critical Reminders**

### **1. Secret Management**
- **`local-testing`**: Uses `.env` file first, AWS as fallback
- **`dev`/`main`**: Uses AWS Secrets Manager first, `.env` as fallback
- **Migration**: Must update both strategies when moving between branches

### **2. API Version**
- **`local-testing`**: v8 API (working)
- **`dev`/`main`**: v2 API (broken - needs update)
- **Breaking Change**: v8 requires `fields` parameter for module data

### **3. Token Status**
- **`local-testing`**: Fresh tokens (working)
- **`dev`/`main`**: Expired tokens (need refresh)
- **Refresh Process**: Use `scripts/refresh-zoho-tokens.py`

---

## 🛠️ **Quick Commands for Branch Switching**

### **Switching TO `local-testing`**
```bash
git checkout local-testing
# Configuration is ready - no changes needed
python scripts/test-local-zoho-api.py  # Verify it works
```

### **Switching TO `dev`**
```bash
git checkout dev
# REMEMBER: Need to apply local-testing improvements
git merge local-testing --no-commit  # Review changes carefully
# Update .env file with v8 API and fresh tokens
# Test thoroughly
```

### **Switching TO `main`**
```bash
git checkout main
# REMEMBER: Production environment
# Update AWS Secrets Manager with fresh tokens
# Update production API URL to v8
# Deploy with monitoring
```

---

## 📊 **Environment Validation Commands**

### **Quick Status Check**
```bash
# Check current branch and basic config
git branch --show-current
grep "ZOHO_BASE_URL" backend/.env
```

### **Full Validation**
```bash
# Run comprehensive validation
python scripts/validate-environment.py
```

### **API Connectivity Test**
```bash
# Test current environment
python scripts/test-local-zoho-api.py
```

---

## 🎯 **Success Indicators**

### **`local-testing` Branch** ✅
- Environment variables load from `.env` file
- API calls use v8 endpoints
- Authentication works with fresh tokens
- All diagnostic scripts pass

### **`dev` Branch** (After Migration)
- Config merges local-testing improvements
- API updated to v8
- Fresh tokens configured
- Tests pass

### **`main` Branch** (After Migration)
- AWS Secrets Manager updated
- Production API uses v8
- Monitoring shows healthy API calls
- No authentication errors

---

## 🔄 **Merge Strategy**

### **Safe Merge from `local-testing` to `dev`**
```bash
git checkout dev
git merge local-testing --no-ff --no-commit
# Review all changes carefully
# Ensure production safety
git commit -m "Merge local-testing improvements to dev

- Enhanced secret loading strategy
- Updated to Zoho API v8
- Fresh OAuth tokens
- Improved error handling"
```

### **Production Deployment from `dev` to `main`**
```bash
# Only after thorough testing in dev
git checkout main
git merge dev --no-ff
# Update AWS Secrets Manager
# Deploy with monitoring
```

---

## 📝 **Documentation Updates**

### **When Making Changes**
1. **Update this file** with any new differences
2. **Update environment validation script**
3. **Document token refresh dates**
4. **Record any new configuration requirements**

### **Regular Maintenance**
- **Weekly**: Check token expiration dates
- **Monthly**: Validate all branch configurations
- **Before deployment**: Run full validation suite

---

**🎯 Key Takeaway**: Always remember that `local-testing` has the working configuration with environment-first secret loading and v8 API, while other branches need these improvements merged in.**
