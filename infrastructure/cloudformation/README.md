# Pipeline Pulse CloudFormation Templates

This directory contains AWS CloudFormation templates for deploying the Pipeline Pulse application infrastructure.

## 📋 Available Templates

### Production Template
- **[production-complete.yml](./production-complete.yml)** - Complete production infrastructure with CloudFront CDN

### Legacy Templates (Reference Only)
- **[main.yml](./main.yml)** - Original main template
- **[main-simple.yml](./main-simple.yml)** - Simplified version without CloudFront
- **[main-no-cloudfront.yml](./main-no-cloudfront.yml)** - ALB-only configuration
- **[rds.yml](./rds.yml)** - Standalone RDS template
- **[vpc-proper.yml](./vpc-proper.yml)** - VPC-only template

## 🚀 Production Architecture

The `production-complete.yml` template deploys the current production architecture:

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

## 🔧 Components Deployed

### Frontend Infrastructure
- **S3 Bucket**: Static website hosting for React frontend
- **CloudFront Distribution**: Global CDN with custom domain support
- **SSL Certificates**: ACM certificates for HTTPS

### Backend Infrastructure
- **ECS Fargate Cluster**: Containerized backend deployment
- **Application Load Balancer**: Traffic distribution and health checks
- **Auto Scaling**: Automatic scaling based on demand

### Database
- **RDS PostgreSQL**: Managed database with automated backups
- **Multi-AZ**: High availability configuration
- **Security Groups**: Restricted access from ECS only

### Networking
- **VPC**: Isolated network environment
- **Public/Private Subnets**: Proper network segmentation
- **Internet Gateway**: Public internet access
- **Security Groups**: Layered security controls

## 📦 Deployment Instructions

### Prerequisites
1. **AWS CLI** configured with appropriate permissions
2. **Domain registered** in Route 53
3. **SSL Certificates** created in ACM (us-east-1 for CloudFront, ap-southeast-1 for ALB)
4. **ECR Repository** created for container images

### Deploy Production Stack

```bash
# 1. Create the stack
aws cloudformation create-stack \
  --stack-name pipeline-pulse-prod \
  --template-body file://production-complete.yml \
  --parameters \
    ParameterKey=DomainName,ParameterValue=1chsalesreports.com \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
    ParameterKey=ALBCertificateArn,ParameterValue=arn:aws:acm:ap-southeast-1:ACCOUNT:certificate/CERT-ID \
    ParameterKey=DatabasePassword,ParameterValue=YourSecurePassword \
    ParameterKey=ZohoClientId,ParameterValue=your_zoho_client_id \
    ParameterKey=ZohoClientSecret,ParameterValue=your_zoho_client_secret \
    ParameterKey=CurrencyApiKey,ParameterValue=your_currency_api_key \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1

# 2. Monitor deployment
aws cloudformation describe-stacks \
  --stack-name pipeline-pulse-prod \
  --region ap-southeast-1

# 3. Get outputs
aws cloudformation describe-stacks \
  --stack-name pipeline-pulse-prod \
  --query 'Stacks[0].Outputs' \
  --region ap-southeast-1
```

### Update Existing Stack

```bash
aws cloudformation update-stack \
  --stack-name pipeline-pulse-prod \
  --template-body file://production-complete.yml \
  --parameters \
    ParameterKey=DomainName,UsePreviousValue=true \
    ParameterKey=CertificateArn,UsePreviousValue=true \
    ParameterKey=ALBCertificateArn,UsePreviousValue=true \
    ParameterKey=DatabasePassword,UsePreviousValue=true \
    ParameterKey=ZohoClientId,UsePreviousValue=true \
    ParameterKey=ZohoClientSecret,UsePreviousValue=true \
    ParameterKey=CurrencyApiKey,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

## 🔐 Security Features

### Network Security
- **Private Subnets**: Database and ECS tasks in private subnets
- **Security Groups**: Least privilege access controls
- **VPC Isolation**: Complete network isolation

### Data Security
- **RDS Encryption**: Database encryption at rest
- **SSL/TLS**: All traffic encrypted in transit
- **IAM Roles**: Least privilege access for services

### Application Security
- **CORS Configuration**: Restricted to production domains
- **Health Checks**: Automated health monitoring
- **Auto Scaling**: Automatic recovery from failures

## 📊 Monitoring & Logging

### CloudWatch Integration
- **ECS Logs**: Application logs in CloudWatch
- **Container Insights**: ECS performance metrics
- **ALB Metrics**: Load balancer performance
- **RDS Monitoring**: Database performance metrics

### Log Groups
- `/ecs/pipeline-pulse-prod` - Application logs
- Retention: 30 days

## 🔧 Configuration

### Environment Variables
The template automatically configures these environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `ZOHO_CLIENT_ID` - Zoho CRM API credentials
- `ZOHO_CLIENT_SECRET` - Zoho CRM API credentials
- `CURRENCY_API_KEY` - CurrencyFreaks API key
- `CORS_ORIGINS` - Allowed CORS origins
- `BASE_URL` - API base URL
- `FRONTEND_URL` - Frontend URL
- `AWS_REGION` - AWS region

### Resource Naming
All resources are named with the stack name prefix for easy identification:
- `{StackName}-cluster` - ECS Cluster
- `{StackName}-alb` - Application Load Balancer
- `{StackName}-db` - RDS Database
- `{StackName}-frontend` - S3 Bucket

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Stack Creation Fails** | Check IAM permissions and parameter values |
| **Certificate Issues** | Ensure certificates exist in correct regions |
| **Domain Issues** | Verify Route 53 hosted zone exists |
| **ECS Task Fails** | Check CloudWatch logs for container errors |

### Useful Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name pipeline-pulse-prod

# View stack events
aws cloudformation describe-stack-events --stack-name pipeline-pulse-prod

# Get stack outputs
aws cloudformation describe-stacks --stack-name pipeline-pulse-prod --query 'Stacks[0].Outputs'

# Delete stack (careful!)
aws cloudformation delete-stack --stack-name pipeline-pulse-prod
```

## 📚 Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [ECS Fargate Documentation](https://docs.aws.amazon.com/ecs/latest/developerguide/AWS_Fargate.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [RDS Documentation](https://docs.aws.amazon.com/rds/)

---

**Production Status**: ✅ Live Infrastructure  
**Last Updated**: December 2024  
**Template Version**: 1.0
