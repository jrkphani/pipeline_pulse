# Pipeline Pulse Deployment Guide

## 🎯 Overview

This comprehensive guide covers the complete deployment process for Pipeline Pulse, including AWS infrastructure setup, secrets management, and post-deployment verification.

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] **AWS Account**: Active AWS account with appropriate permissions
- [ ] **Domain**: Control over production domain (`1chsalesreports.com`)
- [ ] **SSL Certificate**: Valid wildcard certificate for the domain
- [ ] **Database**: AWS RDS PostgreSQL instance configured
- [ ] **S3 Buckets**: Frontend hosting and data storage buckets created

### Configuration Prerequisites
- [ ] **Environment Variables**: All required environment variables defined
- [ ] **Secrets Manager**: AWS Secrets Manager configured with application secrets
- [ ] **Zoho Integration**: Zoho CRM API credentials and SAML configuration ready
- [ ] **IAM Policies**: Proper IAM roles and policies for Lambda and RDS access

### Code Readiness
- [ ] **Backend Tests**: All backend tests passing
- [ ] **Frontend Build**: Frontend builds successfully without errors
- [ ] **Database Migrations**: All Alembic migrations are current and tested
- [ ] **Dependencies**: All package dependencies resolved and compatible

## 🚀 Deployment Process

### Phase 1: Backend Deployment

#### 1. Environment Setup
```bash
# Set deployment environment
export ENVIRONMENT=production
export AWS_REGION=ap-southeast-1
export DOMAIN=1chsalesreports.com

# Configure AWS CLI
aws configure set region $AWS_REGION
```

#### 2. Update AWS Secrets Manager
```bash
# Update backend configuration secrets
aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/backend/config" \
  --secret-string '{
    "ZOHO_CLIENT_ID": "your_client_id",
    "ZOHO_CLIENT_SECRET": "your_client_secret",
    "ZOHO_REFRESH_TOKEN": "your_refresh_token",
    "DATABASE_URL": "postgresql://user:pass@host:5432/dbname",
    "JWT_SECRET_KEY": "your_jwt_secret",
    "ENCRYPTION_KEY": "your_encryption_key"
  }'

# Update database credentials
aws secretsmanager update-secret \
  --secret-id "pipeline-pulse/database/credentials" \
  --secret-string '{
    "username": "your_db_user",
    "password": "your_db_password",
    "host": "your_rds_endpoint",
    "port": 5432,
    "database": "pipeline_pulse"
  }'
```

#### 3. Deploy Lambda Function
```bash
# Build deployment package
cd backend
pip install -r requirements.txt -t ./package
cp -r app package/
cp main.py package/

# Create deployment ZIP
cd package
zip -r ../deployment-package.zip .
cd ..

# Deploy to Lambda
aws lambda update-function-code \
  --function-name pipeline-pulse-api \
  --zip-file fileb://deployment-package.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name pipeline-pulse-api \
  --environment Variables='{
    "ENVIRONMENT": "production",
    "AWS_REGION": "ap-southeast-1",
    "SECRETS_MANAGER_ENABLED": "true"
  }'
```

#### 4. Database Migration
```bash
# Run Alembic migrations
export DATABASE_URL="postgresql://user:pass@host:5432/pipeline_pulse"
alembic upgrade head

# Verify migration status
alembic current
alembic history --verbose
```

#### 5. API Gateway Configuration
```bash
# Deploy API Gateway stage
aws apigateway create-deployment \
  --rest-api-id your-api-id \
  --stage-name production

# Update custom domain mapping
aws apigateway update-domain-name \
  --domain-name api.1chsalesreports.com \
  --patch-ops op=replace,path=/certificateArn,value=arn:aws:acm:region:account:certificate/cert-id
```

### Phase 2: Frontend Deployment

#### 1. Build Frontend
```bash
cd frontend
npm ci
npm run build

# Verify build integrity
ls -la dist/
```

#### 2. Deploy to S3
```bash
# Sync build files to S3
aws s3 sync dist/ s3://1chsalesreports.com \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "*.html" \
  --exclude "service-worker.js"

# Upload HTML files with no-cache
aws s3 sync dist/ s3://1chsalesreports.com \
  --exclude "*" \
  --include "*.html" \
  --include "service-worker.js" \
  --cache-control "no-cache"
```

#### 3. CloudFront Invalidation
```bash
# Invalidate CloudFront distribution
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

# Monitor invalidation status
aws cloudfront get-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --id INVALIDATION_ID
```

### Phase 3: Configuration Updates

#### 1. Update CORS Settings
```bash
# Update API Gateway CORS
aws apigateway put-method-response \
  --rest-api-id your-api-id \
  --resource-id your-resource-id \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": true,
    "method.response.header.Access-Control-Allow-Methods": true,
    "method.response.header.Access-Control-Allow-Headers": true
  }'
```

#### 2. SSL Certificate Verification
```bash
# Verify SSL certificate
openssl s_client -connect 1chsalesreports.com:443 -servername 1chsalesreports.com
openssl s_client -connect api.1chsalesreports.com:443 -servername api.1chsalesreports.com

# Check certificate expiration
echo | openssl s_client -connect 1chsalesreports.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### 3. DNS Verification
```bash
# Verify DNS records
nslookup 1chsalesreports.com
nslookup api.1chsalesreports.com

# Check CNAME records
dig CNAME 1chsalesreports.com
dig CNAME api.1chsalesreports.com
```

## ✅ Post-Deployment Verification

### 1. Health Checks

#### Backend Health Check
```bash
# API health endpoint
curl -v https://api.1chsalesreports.com/health
curl -v https://api.1chsalesreports.com/health/database
curl -v https://api.1chsalesreports.com/health/zoho

# Expected response
{
  "status": "healthy",
  "version": "3.0.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "zoho": "authenticated",
    "secrets_manager": "accessible"
  }
}
```

#### Frontend Verification
```bash
# Frontend accessibility
curl -I https://1chsalesreports.com
curl -I https://1chsalesreports.com/dashboard

# Check for proper caching headers
curl -I https://1chsalesreports.com/assets/index.js
```

### 2. Authentication Flow Testing

#### SAML Authentication
```bash
# Test SAML login redirect
curl -I https://1chsalesreports.com/login

# Verify SAML metadata endpoint
curl https://api.1chsalesreports.com/auth/saml/metadata
```

#### Zoho OAuth
```bash
# Test Zoho OAuth status
curl https://api.1chsalesreports.com/oauth/zoho/status

# Expected response
{
  "status": "connected",
  "token_valid": true,
  "last_refresh": "2024-12-03T10:30:00Z"
}
```

### 3. Data Integration Testing

#### CRM Data Retrieval
```bash
# Test deals endpoint
curl -H "Authorization: Bearer $TOKEN" https://api.1chsalesreports.com/deals?limit=5

# Test live sync
curl -H "Authorization: Bearer $TOKEN" https://api.1chsalesreports.com/sync/live-dashboard-data
```

#### Database Connectivity
```bash
# Test database connection through API
curl -H "Authorization: Bearer $TOKEN" https://api.1chsalesreports.com/health/database

# Verify data sync status
curl -H "Authorization: Bearer $TOKEN" https://api.1chsalesreports.com/sync/status
```

### 4. Performance Verification

#### Response Time Testing
```bash
# Test API response times
time curl https://api.1chsalesreports.com/health
time curl https://api.1chsalesreports.com/deals

# Frontend load time
time curl https://1chsalesreports.com
```

#### Load Testing (Optional)
```bash
# Simple load test with Apache Bench
ab -n 100 -c 10 https://api.1chsalesreports.com/health
ab -n 50 -c 5 https://1chsalesreports.com/
```

## 🔧 Environment-Specific Configuration

### Production Environment
```bash
# Production-specific settings
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
RATE_LIMITING_ENABLED=true
MONITORING_ENABLED=true
```

### Staging Environment
```bash
# Staging-specific settings
ENVIRONMENT=staging
DEBUG=true
LOG_LEVEL=DEBUG
RATE_LIMITING_ENABLED=false
MONITORING_ENABLED=true
```

### Development Environment
```bash
# Development-specific settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
RATE_LIMITING_ENABLED=false
MONITORING_ENABLED=false
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. Lambda Function Timeout
**Symptoms**: 502 Bad Gateway errors, timeout exceptions
**Solutions**:
```bash
# Increase Lambda timeout
aws lambda update-function-configuration \
  --function-name pipeline-pulse-api \
  --timeout 30

# Increase memory allocation
aws lambda update-function-configuration \
  --function-name pipeline-pulse-api \
  --memory-size 512
```

#### 2. Database Connection Issues
**Symptoms**: Database connection errors, authentication failures
**Solutions**:
```bash
# Verify RDS security groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxx

# Test database connectivity
psql -h your-rds-endpoint -U your-username -d pipeline_pulse

# Check IAM database authentication
aws rds generate-db-auth-token \
  --hostname your-rds-endpoint \
  --port 5432 \
  --username your-iam-user
```

#### 3. CORS Issues
**Symptoms**: Cross-origin request blocked, preflight failures
**Solutions**:
```bash
# Update API Gateway CORS
aws apigateway put-integration-response \
  --rest-api-id your-api-id \
  --resource-id your-resource-id \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": "'*'",
    "method.response.header.Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization'"
  }'
```

#### 4. SSL Certificate Issues
**Symptoms**: SSL handshake failures, certificate warnings
**Solutions**:
```bash
# Verify certificate chain
openssl s_client -connect 1chsalesreports.com:443 -showcerts

# Check certificate in AWS Certificate Manager
aws acm describe-certificate --certificate-arn your-cert-arn

# Renew certificate if expired
aws acm request-certificate \
  --domain-name 1chsalesreports.com \
  --subject-alternative-names "*.1chsalesreports.com" \
  --validation-method DNS
```

## 📊 Monitoring and Maintenance

### CloudWatch Monitoring
```bash
# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "PipelinePulse-API-Errors" \
  --alarm-description "Monitor API error rate" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# Monitor Lambda performance
aws logs filter-log-events \
  --log-group-name /aws/lambda/pipeline-pulse-api \
  --start-time $(date -d '1 hour ago' +%s)000
```

### Regular Maintenance Tasks
- **Weekly**: Review CloudWatch logs and metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: SSL certificate renewal check
- **Annually**: AWS cost optimization review

## 🔄 Rollback Procedures

### Emergency Rollback
```bash
# Rollback Lambda function
aws lambda update-function-code \
  --function-name pipeline-pulse-api \
  --zip-file fileb://previous-deployment.zip

# Rollback frontend
aws s3 sync s3://1chsalesreports.com-backup/ s3://1chsalesreports.com/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Database Rollback
```bash
# Rollback database migration
alembic downgrade -1

# Restore from backup if needed
pg_restore -h your-rds-endpoint -U your-username -d pipeline_pulse backup.sql
```

---

**Last Updated**: December 2024  
**Version**: 3.0.0  
**Environment**: Production

*This deployment guide consolidates all deployment procedures and provides comprehensive coverage for Pipeline Pulse production deployment.*