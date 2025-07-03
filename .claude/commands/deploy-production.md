# Deploy to Production

Deploy Pipeline Pulse to AWS production environment: $ARGUMENTS

## 🚀 Pre-Deployment Checklist

### Code Quality Validation

```bash
# Run full quality check
/.claude/commands/quality-check.md all

# Ensure all tests pass
cd backend && python -m pytest
cd frontend && npm test

# TypeScript compilation check
cd frontend && npm run build
```

### Environment Configuration

```bash
# Backend production environment
cd backend
# Verify AWS Secrets Manager contains:
# - ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET
# - CURRENCYFREAKS_API_KEY
# - DATABASE_URL (RDS PostgreSQL)

# Frontend production build
cd frontend
cp .env.production .env
npm run build
```

## 🔄 Database Migration

### Production Database Update

```bash
cd backend

# Check current migration status
alembic current

# Preview pending migrations
alembic show

# Apply migrations to production (with backup first)
aws rds create-db-snapshot \
  --db-instance-identifier pipeline-pulse-prod \
  --db-snapshot-identifier pipeline-pulse-backup-$(date +%Y%m%d-%H%M%S)

# Apply migrations
alembic upgrade head

# Verify migration success
python -c "
from app.core.database import get_db
from sqlalchemy import text
db = next(get_db())
result = db.execute(text('SELECT version_num FROM alembic_version')).fetchone()
print(f'Current migration version: {result[0]}')
"
```

## 🏗️ Infrastructure Deployment

### Backend Deployment (ECS Fargate)

```bash
# Build and push Docker image
cd backend
docker build -t pipeline-pulse-backend .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker tag pipeline-pulse-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/pipeline-pulse-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/pipeline-pulse-backend:latest

# Update ECS service
aws ecs update-service \
  --cluster pipeline-pulse-cluster \
  --service pipeline-pulse-backend-service \
  --force-new-deployment

# Monitor deployment
aws ecs wait services-stable \
  --cluster pipeline-pulse-cluster \
  --services pipeline-pulse-backend-service
```

### Frontend Deployment (S3 + CloudFront)

```bash
cd frontend

# Build production bundle
npm run build

# Sync to S3
aws s3 sync dist/ s3://1chsalesreports.com --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Wait for invalidation to complete
aws cloudfront wait invalidation-completed \
  --distribution-id E1234567890ABC \
  --id I1234567890ABC
```

## 🔍 Post-Deployment Verification

### Health Checks

```bash
# Backend health check
curl -f https://api.1chsalesreports.com/health || echo "Backend health check failed"

# Frontend availability
curl -f https://1chsalesreports.com || echo "Frontend not accessible"

# API documentation
curl -f https://api.1chsalesreports.com/docs || echo "API docs not accessible"

# Database connectivity
python -c "
import requests
response = requests.get('https://api.1chsalesreports.com/health/db')
if response.status_code == 200:
    print('Database connectivity: OK')
else:
    print(f'Database connectivity: FAILED ({response.status_code})')
"
```

### Zoho CRM Integration Test

```bash
# Test Zoho OAuth2 flow
python -c "
import requests
import os

# Test token refresh
response = requests.post('https://api.1chsalesreports.com/zoho/refresh-token')
if response.status_code == 200:
    print('Zoho token refresh: OK')
else:
    print(f'Zoho token refresh: FAILED ({response.status_code})')

# Test data fetch
response = requests.get('https://api.1chsalesreports.com/zoho/deals?limit=1')
if response.status_code == 200:
    data = response.json()
    print(f'Zoho data fetch: OK ({len(data.get(\"deals\", []))} deals)')
else:
    print(f'Zoho data fetch: FAILED ({response.status_code})')
"
```

### Performance Validation

```bash
# API response time check
python -c "
import requests
import time

url = 'https://api.1chsalesreports.com/o2r/dashboard'
start = time.time()
response = requests.get(url)
duration = time.time() - start

if response.status_code == 200 and duration < 2.0:
    print(f'API performance: OK ({duration:.2f}s)')
else:
    print(f'API performance: WARN ({duration:.2f}s, status: {response.status_code})')
"

# Frontend load time check
npx lighthouse https://1chsalesreports.com --only-categories=performance --output=json | jq '.categories.performance.score'
```

## 🔐 Security Validation

### SSL Certificate Check

```bash
# Check SSL certificate validity
echo | openssl s_client -servername 1chsalesreports.com -connect 1chsalesreports.com:443 2>/dev/null | openssl x509 -noout -dates

# Check API SSL
echo | openssl s_client -servername api.1chsalesreports.com -connect api.1chsalesreports.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Security Headers Check

```bash
# Check security headers
curl -I https://1chsalesreports.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"
curl -I https://api.1chsalesreports.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"
```

## 📊 Monitoring Setup

### CloudWatch Alarms

```bash
# Create high error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "PipelinePulse-HighErrorRate" \
  --alarm-description "High error rate in Pipeline Pulse API" \
  --metric-name "4XXError" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Sum" \
  --period 300 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2

# Create high response time alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "PipelinePulse-HighResponseTime" \
  --alarm-description "High response time in Pipeline Pulse API" \
  --metric-name "TargetResponseTime" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Average" \
  --period 300 \
  --threshold 2.0 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2
```

### Log Monitoring

```bash
# Check recent logs for errors
aws logs filter-log-events \
  --log-group-name "/ecs/pipeline-pulse-backend" \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ERROR"

# Check application startup
aws logs filter-log-events \
  --log-group-name "/ecs/pipeline-pulse-backend" \
  --start-time $(date -d "10 minutes ago" +%s)000 \
  --filter-pattern "Application startup complete"
```

## 🔄 Rollback Procedures

### Emergency Rollback

```bash
# Backend rollback (previous task definition)
aws ecs update-service \
  --cluster pipeline-pulse-cluster \
  --service pipeline-pulse-backend-service \
  --task-definition pipeline-pulse-backend:PREVIOUS_REVISION

# Frontend rollback (Git-based)
cd frontend
git checkout HEAD~1  # Or specific commit
npm run build
aws s3 sync dist/ s3://1chsalesreports.com --delete
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"

# Database rollback (if needed)
alembic downgrade -1  # Rollback one migration
```

### Verification After Rollback

```bash
# Verify services are healthy
curl -f https://api.1chsalesreports.com/health
curl -f https://1chsalesreports.com

# Check error rates in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace "AWS/ApplicationELB" \
  --metric-name "HTTPCode_Target_4XX_Count" \
  --start-time $(date -d "10 minutes ago" -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## 📋 Deployment Checklist

### Pre-Deployment ✅

- [ ] All tests passing (backend + frontend + E2E)
- [ ] Code quality checks passed
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] AWS credentials valid
- [ ] Backup created

### During Deployment ✅

- [ ] Docker image built and pushed
- [ ] ECS service updated successfully
- [ ] Frontend built and deployed to S3
- [ ] CloudFront cache invalidated
- [ ] Database migrations applied

### Post-Deployment ✅

- [ ] Health checks passing
- [ ] Zoho CRM integration functional
- [ ] Performance within acceptable limits
- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Monitoring alarms active
- [ ] Logs showing no errors

### Production Validation ✅

- [ ] Dashboard loads correctly
- [ ] O2R tracker functional
- [ ] Currency conversion working
- [ ] Data synchronization with CRM
- [ ] Export functionality working
- [ ] All user flows tested

## 🚨 Emergency Contacts

If deployment fails or issues arise:

1. **Check CloudWatch logs** for immediate error diagnosis
2. **Monitor CloudWatch alarms** for system health
3. **Use rollback procedures** if critical issues detected
4. **Verify Zoho CRM connectivity** if integration issues
5. **Check AWS service status** for infrastructure issues

## 📊 Success Metrics

**Deployment is successful when:**

- API health endpoint returns 200 OK
- Frontend loads without errors
- Database migrations completed successfully
- Zoho CRM integration functional
- Performance metrics within acceptable ranges
- Security checks pass
- Monitoring alarms configured and active

Usage: `/deploy [environment]` where environment is `staging` or `production`
