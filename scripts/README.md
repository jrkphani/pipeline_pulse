# Pipeline Pulse Scripts Documentation

This directory contains utility scripts for deploying, managing, and maintaining the Pipeline Pulse application.

## 📚 Available Scripts

### 🚀 Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **[deploy-environment-fixes.sh](./deploy-environment-fixes.sh)** | Deploy backend to ECS Fargate | `./scripts/deploy-environment-fixes.sh` |
| **[test-production-deployment.sh](./test-production-deployment.sh)** | Test production deployment health | `./scripts/test-production-deployment.sh` |

### 🔧 Setup & Configuration Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **[setup-local-postgres.sh](./setup-local-postgres.sh)** | Setup local PostgreSQL for development | `./scripts/setup-local-postgres.sh` |
| **[setup-database-migration.sh](./setup-database-migration.sh)** | Initialize database migrations | `./scripts/setup-database-migration.sh` |
| **[quick-postgres-setup.sh](./quick-postgres-setup.sh)** | Quick PostgreSQL setup | `./scripts/quick-postgres-setup.sh` |

### 🔐 SSL & Certificate Management

| Script | Purpose | Usage |
|--------|---------|-------|
| **[ssl-setup.sh](./ssl-setup.sh)** | Complete SSL certificate setup | `./scripts/ssl-setup.sh` |
| **[setup-wildcard-certificate.sh](./setup-wildcard-certificate.sh)** | Setup wildcard SSL certificate | `./scripts/setup-wildcard-certificate.sh` |
| **[manage-certificates.sh](./manage-certificates.sh)** | Manage SSL certificates | `./scripts/manage-certificates.sh` |

### 🧪 Testing & Validation Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **[test-database-connections.py](./test-database-connections.py)** | Test database connectivity | `python scripts/test-database-connections.py` |
| **[get_zoho_saml_info.py](./get_zoho_saml_info.py)** | Get Zoho SAML configuration | `python scripts/get_zoho_saml_info.py` |

## 🚀 Quick Start Commands

### Deploy to Production
```bash
# Deploy backend
./scripts/deploy-environment-fixes.sh

# Deploy frontend
cd frontend && npm run build
aws s3 sync dist/ s3://pipeline-pulse-frontend-prod --delete
```

### Test Production Health
```bash
# Comprehensive production test
./scripts/test-production-deployment.sh

# Quick API health check
curl https://api.1chsalesreports.com/api/zoho/auth/status
```

### Local Development Setup
```bash
# Setup local PostgreSQL
./scripts/setup-local-postgres.sh

# Initialize database
cd backend && alembic upgrade head
```

## 🔧 Script Details

### deploy-environment-fixes.sh
**Purpose**: Deploys the backend application to AWS ECS Fargate
**Features**:
- Builds and pushes Docker image to ECR
- Updates ECS task definition with latest environment variables
- Forces new deployment with zero-downtime rolling update
- Monitors deployment progress and health checks

### test-production-deployment.sh
**Purpose**: Comprehensive testing of production deployment
**Features**:
- Tests all frontend endpoints (HTTPS)
- Tests API endpoints and authentication
- Checks SSL certificates
- Validates CloudFront distribution status
- Tests CORS configuration
- Provides detailed status report

### setup-local-postgres.sh
**Purpose**: Sets up local PostgreSQL for development
**Features**:
- Installs PostgreSQL (if not present)
- Creates development database and user
- Configures connection settings
- Sets up proper permissions

## 🏗️ Production Architecture

The scripts manage this production architecture:

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

## 🔐 Environment Variables

Scripts use these key environment variables:

```bash
# Production
DATABASE_URL=postgresql://username:password@host:port/database
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
CURRENCY_API_KEY=your_currencyfreaks_api_key
CORS_ORIGINS=https://1chsalesreports.com,https://www.1chsalesreports.com,https://api.1chsalesreports.com,https://app.1chsalesreports.com
```

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution | Script to Use |
|-------|----------|---------------|
| **Deployment Fails** | Check ECS logs and task definition | `./scripts/test-production-deployment.sh` |
| **Database Connection** | Verify RDS security groups | `python scripts/test-database-connections.py` |
| **SSL Certificate Issues** | Re-run certificate setup | `./scripts/ssl-setup.sh` |
| **Local Development** | Reset local PostgreSQL | `./scripts/setup-local-postgres.sh` |

### Debug Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster pipeline-pulse-prod --services pipeline-pulse-prod-service-v2 --region ap-southeast-1

# Check CloudFront distribution
aws cloudfront get-distribution --id E15EC47TVWETI2

# Check recent logs
aws logs filter-log-events --log-group-name /ecs/pipeline-pulse-prod --start-time $(date -d '1 hour ago' +%s)000 --region ap-southeast-1
```

## 📚 Additional Resources

- [Main Documentation](../docs/README.md)
- [AWS Deployment Guide](../docs/AWS_DEPLOYMENT_GUIDE.md)
- [Zoho Integration Guide](../docs/ZOHO_INTEGRATION.md)
- [Configuration Reference](../docs/CONFIGURATION_REFERENCE.md)

---

**Production Status**: ✅ Live at https://1chsalesreports.com  
**Last Updated**: December 2024
