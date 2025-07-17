# AWS Deployment Guide - Pipeline Pulse v8 API

## 🎯 **Deployment Overview**

**Branch**: `dev` → AWS Production Environment  
**API Version**: Zoho CRM v8  
**Status**: Ready for deployment with fresh tokens and v8 compatibility

---

## 🔧 **Pre-Deployment Checklist**

### **✅ Code Changes Deployed**
- [x] Enhanced secret loading strategy (env → AWS fallback)
- [x] Zoho API v8 compatibility (fields parameter required)
- [x] Fresh OAuth tokens (valid until next refresh)
- [x] Updated error handling for v8 responses
- [x] Comprehensive test suite (24/24 tests passing)

### **⚠️ AWS Secrets Manager Updates Required**

#### **1. Update Zoho API Credentials**
```bash
# Update Zoho Client Secret
aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/zoho/client-secret" \
  --secret-string "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7"

# Update Zoho Refresh Token  
aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/zoho/refresh-token" \
  --secret-string "1000.9c3015bbe4d6996c6fc3987d19dfe52d.afe4cc9c53d65bdd5bfe800d90d28401"
```

#### **2. Update API Configuration**
```bash
# Update Base URL to v8
aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/zoho/base-url" \
  --secret-string "https://www.zohoapis.in/crm/v8"

# Verify Accounts URL
aws secretsmanager get-secret-value \
  --secret-id "pipeline-pulse/zoho/accounts-url"
# Should be: https://accounts.zoho.in
```

---

## 🚀 **Deployment Steps**

### **Step 1: Update AWS Secrets Manager**
```bash
# Set AWS region and profile if needed
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile

# Update all Zoho secrets
aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/zoho/client-secret" \
  --secret-string "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7"

aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/zoho/refresh-token" \
  --secret-string "1000.9c3015bbe4d6996c6fc3987d19dfe52d.afe4cc9c53d65bdd5bfe800d90d28401"

aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/zoho/base-url" \
  --secret-string "https://www.zohoapis.in/crm/v8"
```

### **Step 2: Deploy Application**
```bash
# Deploy using your existing deployment method
# (ECS, Lambda, EC2, etc.)

# Example for ECS:
aws ecs update-service \
  --cluster pipeline-pulse-cluster \
  --service pipeline-pulse-service \
  --force-new-deployment

# Example for Lambda:
# Update function code with new deployment package
```

### **Step 3: Verify Deployment**
```bash
# Test health endpoint
curl https://1chsalesreports.com/api/health

# Test Zoho API connectivity
curl https://1chsalesreports.com/api/zoho/test-connection

# Test deals endpoint with v8 requirements
curl "https://1chsalesreports.com/api/zoho/deals?limit=3&fields=Deal_Name,Amount,Stage"
```

---

## 🧪 **Post-Deployment Testing**

### **1. Authentication Test**
```bash
# Test token refresh mechanism
curl -X POST https://1chsalesreports.com/api/zoho/test-auth
```

**Expected Response:**
```json
{
  "authenticated": true,
  "organization": "OCH Digitech Private Limited",
  "api_version": "v8",
  "token_expires_in": 3600
}
```

### **2. API Compatibility Test**
```bash
# Test v8 API requirements
curl "https://1chsalesreports.com/api/zoho/deals?per_page=5&fields=Deal_Name,Amount,Stage,Closing_Date"
```

**Expected Response:**
```json
{
  "deals": [...],
  "total": 5,
  "fields_requested": ["Deal_Name", "Amount", "Stage", "Closing_Date"],
  "api_version": "v8"
}
```

### **3. Error Handling Test**
```bash
# Test missing fields parameter (should fail)
curl "https://1chsalesreports.com/api/zoho/deals?per_page=1"
```

**Expected Response:**
```json
{
  "error": "REQUIRED_PARAM_MISSING",
  "message": "fields parameter is required for v8 API"
}
```

---

## 📊 **Monitoring & Validation**

### **Key Metrics to Monitor**
1. **API Response Times**: Should be < 500ms for most requests
2. **Error Rates**: Should be < 1% for normal operations
3. **Token Refresh Success**: Should be 100% successful
4. **Rate Limiting**: Monitor for 429 responses

### **Health Check Endpoints**
- `/health` - Basic application health
- `/api/zoho/health` - Zoho API connectivity
- `/api/zoho/test-connection` - Full authentication test

### **Log Monitoring**
```bash
# Monitor application logs for errors
aws logs tail /aws/ecs/pipeline-pulse --follow

# Look for these success indicators:
# ✅ "Zoho API v8 connection successful"
# ✅ "Token refresh completed"
# ✅ "Deal data retrieved with fields parameter"

# Watch for these error patterns:
# ❌ "REQUIRED_PARAM_MISSING"
# ❌ "Token refresh failed"
# ❌ "Rate limit exceeded"
```

---

## 🔒 **Security Considerations**

### **Secrets Management**
- ✅ All sensitive data stored in AWS Secrets Manager
- ✅ No secrets in environment variables or code
- ✅ Proper IAM roles for secret access
- ✅ Secrets rotation capability maintained

### **API Security**
- ✅ HTTPS enforced for all communications
- ✅ Rate limiting properly handled
- ✅ Input validation on all endpoints
- ✅ Error messages don't expose sensitive data

---

## 🚨 **Rollback Plan**

### **If Deployment Fails**
1. **Immediate Rollback**:
   ```bash
   # Rollback to previous ECS task definition
   aws ecs update-service \
     --cluster pipeline-pulse-cluster \
     --service pipeline-pulse-service \
     --task-definition pipeline-pulse:PREVIOUS_REVISION
   ```

2. **Revert Secrets** (if needed):
   ```bash
   # Revert to v2 API temporarily
   aws secretsmanager update-secret \
     --secret-id "pipeline-pulse/zoho/base-url" \
     --secret-string "https://www.zohoapis.in/crm/v2"
   ```

3. **Monitor Recovery**:
   - Check health endpoints return to normal
   - Verify API calls are working
   - Monitor error rates return to baseline

---

## 📋 **Environment Differences Summary**

| Aspect | Local-Testing | Dev | Production (AWS) |
|--------|---------------|-----|------------------|
| **Secret Loading** | Env First | Env → AWS | AWS → Env |
| **API Version** | v8 ✅ | v8 ✅ | v8 (after update) |
| **Token Status** | Fresh ✅ | Fresh ✅ | Fresh (after update) |
| **Config Source** | .env file | .env + AWS | AWS Secrets |
| **Testing** | Local scripts | Local + AWS | Production monitoring |

---

## 🎯 **Success Criteria**

### **Deployment Successful When:**
- ✅ Health endpoints return 200 OK
- ✅ Zoho API authentication working
- ✅ Deal data retrieval with v8 fields parameter
- ✅ Error handling properly rejecting invalid requests
- ✅ Response times within acceptable limits
- ✅ No increase in error rates

### **Ready for Production When:**
- ✅ All post-deployment tests passing
- ✅ Monitoring shows stable metrics
- ✅ No critical errors in logs
- ✅ Rate limiting handled gracefully
- ✅ Token refresh mechanism working

---

## 📞 **Support & Troubleshooting**

### **Common Issues & Solutions**

#### **Issue: Token Refresh Fails**
```bash
# Check secret values
aws secretsmanager get-secret-value --secret-id "pipeline-pulse/zoho/refresh-token"

# Verify client credentials
aws secretsmanager get-secret-value --secret-id "pipeline-pulse/zoho/client-secret"

# Test manual token refresh
curl -X POST https://1chsalesreports.com/api/zoho/refresh-token
```

#### **Issue: API Calls Fail with REQUIRED_PARAM_MISSING**
- ✅ **Expected**: This confirms v8 API is working correctly
- ✅ **Solution**: Ensure all API calls include `fields` parameter
- ✅ **Verify**: Check application code uses updated endpoints

#### **Issue: Rate Limiting (429 Errors)**
- ✅ **Expected**: Normal Zoho API behavior
- ✅ **Solution**: Implement exponential backoff
- ✅ **Monitor**: Track rate limit headers in responses

### **Emergency Contacts**
- **AWS Support**: Use AWS Support Center
- **Zoho API Support**: https://help.zoho.com/portal/en/community
- **Application Logs**: CloudWatch Logs `/aws/ecs/pipeline-pulse`

---

**🚀 Ready for AWS deployment with full v8 API compatibility!**
