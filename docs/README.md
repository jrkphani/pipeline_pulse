# Pipeline Pulse Documentation

This directory contains comprehensive documentation for the Pipeline Pulse application.

🌐 **Live Application**: https://1chsalesreports.com

## 📚 Documentation Index

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Configuration Reference](CONFIGURATION_REFERENCE.md) - Environment variables and settings
- [AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md) - Production deployment on AWS

### Development & Testing
- [Local Development Setup](../README.md#-local-development) - Development environment
- [Testing Guide](../README.md#-testing) - Playwright and backend testing
- [API Documentation](../README.md#-api-endpoints) - Complete API reference

### Deployment & Operations
- [Production Deployment](DEPLOYMENT.md) - Deployment procedures
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification
- [Monitoring & Logs](../README.md#-monitoring--logs) - CloudWatch integration

### Integration & Configuration
- [Zoho CRM Integration](ZOHO_INTEGRATION.md) - CRM setup and SAML configuration
- [Environment Configuration](../README.md#-configuration) - Production settings

## 🚀 Quick Start

### Prerequisites
- AWS CLI v2 configured
- Node.js 18+ and Python 3.9+
- PostgreSQL 13+ for local development
- Zoho CRM and Directory access

### Production Deployment
The application is already deployed and running at https://1chsalesreports.com

### Local Development
```bash
git clone https://github.com/jrkphani/pipeline_pulse.git
cd pipeline-pulse

# Setup local environment (see main README for details)
./scripts/setup-local-postgres.sh
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │       ALB        │    │   ECS Fargate   │
│   (Global CDN)  │────│  (Load Balancer) │────│   (Backend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │                                               │
┌─────────────────┐                              ┌─────────────────┐
│       S3        │                              │  RDS PostgreSQL │
│   (Frontend)    │                              │   (Database)    │
└─────────────────┘                              └─────────────────┘
```

### Production Components

- **Frontend:** React 18 + TypeScript, served from S3 via CloudFront CDN
- **Backend:** FastAPI with Python 3.11, containerized on ECS Fargate
- **Database:** PostgreSQL 13+ on RDS with automated backups
- **Authentication:** Zoho Directory SAML SSO integration
- **API Integration:** Zoho CRM REST API with server-based OAuth
- **CDN:** CloudFront for global content delivery
- **Load Balancer:** Application Load Balancer with health checks
- **DNS:** Route 53 with custom domain (1chsalesreports.com)
- **SSL:** AWS Certificate Manager with wildcard certificates
- **Monitoring:** CloudWatch logs and metrics

## 🔧 Production Configuration

### Infrastructure Details

| Component | Value | Status |
|-----------|-------|--------|
| **AWS Region** | `ap-southeast-1` (Singapore) | ✅ Active |
| **ECS Cluster** | `pipeline-pulse-prod` | ✅ Active |
| **ECS Service** | `pipeline-pulse-prod-service-v2` | ✅ Active |
| **CloudFront Distribution** | `E15EC47TVWETI2` | ✅ Active |
| **S3 Bucket** | `pipeline-pulse-frontend-prod` | ✅ Active |
| **RDS Instance** | `pipeline-pulse-db-dev` | ✅ Active |
| **Load Balancer** | `pipeline-pulse-alb-1144051995` | ✅ Active |
| **Domain** | `1chsalesreports.com` | ✅ Active |

### Production Endpoints

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | `https://1chsalesreports.com` | ✅ Live |
| **API** | `https://api.1chsalesreports.com` | ✅ Live |
| **Health Check** | `https://api.1chsalesreports.com/api/zoho/auth/status` | ✅ Live |

## 🔐 Security & Authentication

### SAML SSO Flow
1. **User Access:** User visits `https://1chsalesreports.com`
2. **SAML Redirect:** Application redirects to Zoho Directory
3. **Authentication:** User authenticates with Zoho credentials
4. **SAML Response:** Zoho sends SAML assertion back to application
5. **Role Assignment:** Application determines user role based on Zoho Directory attributes
6. **Session Creation:** Secure session established for application access

### API Integration Security
- **Zoho CRM:** Server-based OAuth application with refresh tokens
- **Currency API:** Secure API key management via environment variables
- **CORS:** Restricted to production domains only
- **HTTPS:** All traffic encrypted with SSL certificates

## 📊 Key Features Documented

### ✅ Production Features
- [x] **SAML SSO Authentication** via Zoho Directory
- [x] **Live Currency Conversion** using CurrencyFreaks API
- [x] **Bulk Update Functionality** for CRM opportunities
- [x] **O2R Tracking** (Opportunity to Revenue)
- [x] **Country Drill-down Analytics** with pivot tables
- [x] **Account Manager Performance** analytics
- [x] **File Management System** with upload history and duplicate detection
- [x] **Global CDN Delivery** via CloudFront
- [x] **Auto-scaling Backend** on ECS Fargate

## 🔍 Monitoring & Health Checks

### Production Health Checks
```bash
# Frontend health
curl -I https://1chsalesreports.com

# API health
curl https://api.1chsalesreports.com/api/zoho/auth/status

# Backend health (ALB)
curl http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com/health

# CloudFront distribution status
aws cloudfront get-distribution --id E15EC47TVWETI2 --query "Distribution.Status"
```

### CloudWatch Logs
```bash
# Application logs
aws logs describe-log-streams --log-group-name /ecs/pipeline-pulse-prod --region ap-southeast-1

# Recent errors
aws logs filter-log-events --log-group-name /ecs/pipeline-pulse-prod --filter-pattern "ERROR" --start-time $(date -d '1 hour ago' +%s)000 --region ap-southeast-1
```

## 🚀 Deployment Commands

### Backend Deployment
```bash
# Deploy backend to ECS Fargate
./scripts/deploy-environment-fixes.sh
```

### Frontend Deployment
```bash
# Build and deploy frontend to S3/CloudFront
cd frontend
npm run build
aws s3 sync dist/ s3://pipeline-pulse-frontend-prod --delete
```

### Testing Deployment
```bash
# Run comprehensive production tests
./scripts/test-production-deployment.sh

# Run Playwright end-to-end tests
npm test
```

## 🆘 Troubleshooting

### Common Issues & Solutions

| Issue | Solution | Quick Check |
|-------|----------|-------------|
| **Frontend Not Loading** | Check CloudFront deployment status | `aws cloudfront get-distribution --id E15EC47TVWETI2` |
| **API Not Responding** | Check ECS service health | `curl https://api.1chsalesreports.com/api/zoho/auth/status` |
| **CORS Errors** | Verify CloudFront deployment complete | Wait 10-15 minutes for deployment |
| **SAML Login Issues** | Check Zoho Directory configuration | [ZOHO_INTEGRATION.md](./ZOHO_INTEGRATION.md) |
| **Database Connectivity** | Check RDS instance status | [CONFIGURATION_REFERENCE.md](./CONFIGURATION_REFERENCE.md) |

### Quick Diagnostics
```bash
# Overall system health
./scripts/test-production-deployment.sh

# ECS service status
aws ecs describe-services --cluster pipeline-pulse-prod --services pipeline-pulse-prod-service-v2 --region ap-southeast-1

# Recent application errors
aws logs filter-log-events --log-group-name /ecs/pipeline-pulse-prod --filter-pattern "ERROR" --start-time $(date -d '1 hour ago' +%s)000 --region ap-southeast-1
```

## 📞 Support

### Getting Help
1. **Check System Status**: Run `./scripts/test-production-deployment.sh`
2. **Review Documentation**: Check relevant sections above
3. **Check CloudWatch Logs**: Look for error patterns
4. **Create GitHub Issue**: Include error logs and system status

### Key AWS Resources
- **CloudFront Distribution**: E15EC47TVWETI2
- **ECS Cluster**: pipeline-pulse-prod
- **S3 Bucket**: pipeline-pulse-frontend-prod
- **RDS Instance**: pipeline-pulse-db-dev
- **ALB**: pipeline-pulse-alb-1144051995

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Zoho CRM API](https://www.zoho.com/crm/developer/docs/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

---

**Last Updated**: December 2024
**Production Status**: ✅ Live and Operational
**Live Application**: https://1chsalesreports.com
