# Pipeline Pulse - Production Deployment Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Application Configuration](#application-configuration)
5. [Docker & Container Deployment](#docker--container-deployment)
6. [Load Balancer & SSL Setup](#load-balancer--ssl-setup)
7. [DNS Configuration](#dns-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## 🎯 Overview

Pipeline Pulse is a FastAPI-based sales analytics application with React frontend, deployed on AWS using:

- **Compute:** ECS Fargate
- **Database:** RDS PostgreSQL
- **Load Balancer:** Application Load Balancer
- **DNS:** Route 53
- **SSL:** AWS Certificate Manager
- **Container Registry:** ECR
- **Authentication:** Zoho Directory SAML SSO
- **API Integration:** Zoho CRM

## 🔧 Prerequisites

### Required Tools
```bash
# AWS CLI v2
aws --version

# Docker
docker --version

# Git
git --version
```

### AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Region: `ap-southeast-1` (Singapore)

### Domain Requirements
- Domain name: `1chsalesreports.com`
- Route 53 hosted zone configured
- DNS management access

### Third-Party Integrations
- Zoho CRM account with API access
- Zoho Directory for SAML SSO
- CurrencyFreaks API key for exchange rates

## 🏗️ Infrastructure Setup

### 1. VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.1.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=pipeline-pulse-vpc}]' \
  --region ap-southeast-1

# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=pipeline-pulse-igw}]' \
  --region ap-southeast-1

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id igw-xxxxxxxxx \
  --vpc-id vpc-xxxxxxxxx \
  --region ap-southeast-1
```

### 2. Subnets

```bash
# Public Subnet 1 (AZ-a)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.1.1.0/24 \
  --availability-zone ap-southeast-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pipeline-pulse-public-1a}]' \
  --region ap-southeast-1

# Public Subnet 2 (AZ-b)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.1.2.0/24 \
  --availability-zone ap-southeast-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pipeline-pulse-public-1b}]' \
  --region ap-southeast-1

# Private Subnet 1 (AZ-a)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.1.3.0/24 \
  --availability-zone ap-southeast-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pipeline-pulse-private-1a}]' \
  --region ap-southeast-1

# Private Subnet 2 (AZ-b)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.1.4.0/24 \
  --availability-zone ap-southeast-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pipeline-pulse-private-1b}]' \
  --region ap-southeast-1
```

### 3. Route Tables

```bash
# Create public route table
aws ec2 create-route-table \
  --vpc-id vpc-xxxxxxxxx \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=pipeline-pulse-public-rt}]' \
  --region ap-southeast-1

# Add route to Internet Gateway
aws ec2 create-route \
  --route-table-id rtb-xxxxxxxxx \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-xxxxxxxxx \
  --region ap-southeast-1

# Associate public subnets with route table
aws ec2 associate-route-table \
  --subnet-id subnet-xxxxxxxxx \
  --route-table-id rtb-xxxxxxxxx \
  --region ap-southeast-1
```

### 4. Security Groups

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name pipeline-pulse-alb-sg \
  --description "Security group for Pipeline Pulse ALB" \
  --vpc-id vpc-xxxxxxxxx \
  --region ap-southeast-1

# Add HTTP and HTTPS rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region ap-southeast-1

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region ap-southeast-1

# Create security group for ECS
aws ec2 create-security-group \
  --group-name pipeline-pulse-ecs-sg \
  --description "Security group for Pipeline Pulse ECS service" \
  --vpc-id vpc-xxxxxxxxx \
  --region ap-southeast-1

# Add application port rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 8000 \
  --source-group sg-xxxxxxxxx \
  --region ap-southeast-1
```

### 5. RDS Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name pipeline-pulse-db-subnet-group \
  --db-subnet-group-description "Subnet group for Pipeline Pulse database" \
  --subnet-ids subnet-xxxxxxxxx subnet-xxxxxxxxx \
  --region ap-southeast-1

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier pipeline-pulse-db-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'PipelinePulse2025!' \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name pipeline-pulse-db-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted \
  --region ap-southeast-1
```

## 🔐 Application Configuration

### Environment Variables

Create `.env.production` file:

```bash
# Application Settings
APP_NAME=Pipeline Pulse
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=your-super-secret-production-key-change-this
JWT_SECRET=your-super-secret-jwt-key-for-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database Configuration
DATABASE_URL=postgresql://postgres:PipelinePulse2025!@pipeline-pulse-db-prod.xxxxxxxxx.ap-southeast-1.rds.amazonaws.com:5432/pipeline_pulse

# Zoho CRM Integration (Server-based Application)
ZOHO_CLIENT_ID=1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY
ZOHO_CLIENT_SECRET=47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7
ZOHO_REFRESH_TOKEN=1000.1f6445ad715711237fbf078342cc1975.efec29cda25213ee26264296c04dd176
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_DIR=/app/uploads

# Currency Configuration
BASE_CURRENCY=SGD
CURRENCY_API_KEY=fdd7d81e5f0d434393a5a0cca6053423
CURRENCY_CACHE_DAYS=7

# URL Configuration
BASE_URL=https://1chsalesreports.com
FRONTEND_URL=https://1chsalesreports.com
CORS_ORIGINS=https://1chsalesreports.com,https://www.1chsalesreports.com

# SAML Configuration
SAML_ENTITY_ID=https://1chsalesreports.com
SAML_ACS_URL=https://1chsalesreports.com/api/auth/saml/acs
SAML_SLS_URL=https://1chsalesreports.com/api/auth/saml/logout

# Zoho Directory SAML Configuration
ZOHO_SAML_ENTITY_ID=https://directory.zoho.in/p/60021093475/app/128434000000235001/sso
ZOHO_SAML_SSO_URL=https://directory.zoho.in/p/60021093475/app/128434000000235001/sso
ZOHO_SAML_SLS_URL=https://directory.zoho.in/p/60021093475/app/128434000000235001/sso/logout
ZOHO_SAML_X509_CERT=-----BEGIN CERTIFICATE-----\nMIICkTCCAXkCBgGXL8bXfDANBgkqhkiG9w0BAQsFADAMMQowCAYDVQQDEwFBMB4XDTI1MDYwMTA4MzQwOVoXDTI4MDYwMTA4MzQwOVowDDEKMAgGA1UEAxMBQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKcJ720ort1bFnm3+K4aX99PH8cxh6V0EBac5qbOJUdyCEiaSzDpDow+EuZgoxVIch6QQwz1yLiOTbTCMRIEMseLLuMn0S8SVgV1H6TiAbP6MHkRkCmJIyUNxpYbiCK5LAhUHic7yXjjybnTrCS8OQNRIW+E2kbQpFoOqHF/MI2Bf4tZeqXxXEPJgAuSnDDLKzJ2+Fx4ecTz4SHRq/GtwjrugWuCVIwfEotpsZM+YuguVT7QhgacjHcNJcmdCMzCZx/OHYUYksyp/eSQjTsoiuby4XP1FC3v539v9HBjDZydeXYmTecK1Ak5cRKIZ1xTHsSPjx0X09eLHrbPJ8ZXADcCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAbuRo5vAVUZ4WgdFgE+KN09HT2ABrMMKhnE5pywGEwielXe4TMncslnBa2AgEvrKBNIuwVfALo1w8WWJuqB6q9efDFefopgl7nwsWrsNpSJ48mrCauJfafsKMFJBd4Kgu66rD80UOrS/rVMJc98Ges0TgUfI5r3h8Y5CmUE4PYc9WYVq9wGT4zi6dzezyX/bxLLX8MzY2IByd5t2kcekPHwlbTRc363GWwVU7XXgHul0axF36X28bnS91ybUZL437hZfV6sOPJ2PaKzII/JIppmazx2hTWdTuulTll2n4FV6kaRnHUAVqX9h+fpITWaOzLW4zzQNnV8Ogk1V76RM/Hw==\n-----END CERTIFICATE-----

# AWS Configuration
AWS_REGION=ap-southeast-1
```

## 📦 Docker & Container Deployment

### 1. Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    pkg-config \
    libxml2-dev \
    libxmlsec1-dev \
    libxmlsec1-openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Build and Push to ECR

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name pipeline-pulse-prod \
  --region ap-southeast-1

# Get ECR login token
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  272858488437.dkr.ecr.ap-southeast-1.amazonaws.com

# Build Docker image
cd backend
docker build -t pipeline-pulse .

# Tag for ECR
docker tag pipeline-pulse:latest \
  272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse-prod:latest

# Push to ECR
docker push 272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse-prod:latest
```

### 3. ECS Setup

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name pipeline-pulse-prod \
  --region ap-southeast-1

# Create CloudWatch log group
aws logs create-log-group \
  --log-group-name /ecs/pipeline-pulse-prod \
  --region ap-southeast-1
```

### 4. ECS Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "pipeline-pulse-prod",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::272858488437:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::272858488437:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "pipeline-pulse-backend",
      "image": "272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse-prod:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://postgres:PipelinePulse2025!@pipeline-pulse-db-prod.xxxxxxxxx.ap-southeast-1.rds.amazonaws.com:5432/pipeline_pulse"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pipeline-pulse-prod",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register the task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region ap-southeast-1
```

### 5. ECS Service

Create `ecs-service.json`:

```json
{
  "serviceName": "pipeline-pulse-prod-service",
  "cluster": "pipeline-pulse-prod",
  "taskDefinition": "pipeline-pulse-prod:1",
  "desiredCount": 1,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-xxxxxxxxx",
        "subnet-xxxxxxxxx"
      ],
      "securityGroups": [
        "sg-xxxxxxxxx"
      ],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:targetgroup/pipeline-pulse-tg/xxxxxxxxx",
      "containerName": "pipeline-pulse-backend",
      "containerPort": 8000
    }
  ],
  "healthCheckGracePeriodSeconds": 300,
  "enableExecuteCommand": true
}
```

Create the service:

```bash
aws ecs create-service \
  --cli-input-json file://ecs-service.json \
  --region ap-southeast-1
```

## 🔄 Load Balancer & SSL Setup

### 1. Application Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name pipeline-pulse-alb \
  --subnets subnet-xxxxxxxxx subnet-xxxxxxxxx \
  --security-groups sg-xxxxxxxxx \
  --region ap-southeast-1

# Create Target Group
aws elbv2 create-target-group \
  --name pipeline-pulse-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxxxxxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region ap-southeast-1

# Create HTTP Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:loadbalancer/app/pipeline-pulse-alb/xxxxxxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:targetgroup/pipeline-pulse-tg/xxxxxxxxx \
  --region ap-southeast-1
```

### 2. SSL Certificate

```bash
# Request SSL Certificate
aws acm request-certificate \
  --domain-name 1chsalesreports.com \
  --subject-alternative-names www.1chsalesreports.com \
  --validation-method DNS \
  --region ap-southeast-1

# Get certificate details for DNS validation
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:ap-southeast-1:272858488437:certificate/xxxxxxxxx \
  --region ap-southeast-1
```

### 3. DNS Validation Records

Create DNS validation records in Route 53:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_validation_record_name.1chsalesreports.com.",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "_validation_record_value.acm-validations.aws."
          }
        ]
      }
    }
  ]
}
```

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z06882003RVZ48NS7EIIU \
  --change-batch file://dns-validation-record.json \
  --region ap-southeast-1
```

### 4. HTTPS Listener

After certificate validation:

```bash
# Create HTTPS Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:loadbalancer/app/pipeline-pulse-alb/xxxxxxxxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:ap-southeast-1:272858488437:certificate/xxxxxxxxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:targetgroup/pipeline-pulse-tg/xxxxxxxxx \
  --region ap-southeast-1

# Modify HTTP listener to redirect to HTTPS
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:listener/app/pipeline-pulse-alb/xxxxxxxxx/xxxxxxxxx \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
  --region ap-southeast-1
```

## 🌐 DNS Configuration

### 1. Route 53 Setup

```bash
# List hosted zones (should already exist)
aws route53 list-hosted-zones \
  --query 'HostedZones[?Name==`1chsalesreports.com.`]' \
  --region ap-southeast-1

# Create A records pointing to ALB
```

Create `dns-a-records.json`:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "1chsalesreports.com.",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com.",
          "EvaluateTargetHealth": true,
          "HostedZoneId": "Z1LMS91P8CMLE5"
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.1chsalesreports.com.",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com.",
          "EvaluateTargetHealth": true,
          "HostedZoneId": "Z1LMS91P8CMLE5"
        }
      }
    }
  ]
}
```

```bash
# Add A records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z06882003RVZ48NS7EIIU \
  --change-batch file://dns-a-records.json \
  --region ap-southeast-1
```

### 2. DNS Propagation Check

```bash
# Check DNS propagation
nslookup 1chsalesreports.com
dig 1chsalesreports.com

# Test domain resolution
curl -I http://1chsalesreports.com
curl -I https://1chsalesreports.com
```

## 📊 Monitoring & Logging

### 1. CloudWatch Logs

```bash
# View ECS logs
aws logs describe-log-streams \
  --log-group-name /ecs/pipeline-pulse-prod \
  --region ap-southeast-1

# Get recent log events
aws logs get-log-events \
  --log-group-name /ecs/pipeline-pulse-prod \
  --log-stream-name "ecs/pipeline-pulse-backend/xxxxxxxxx" \
  --region ap-southeast-1
```

### 2. ECS Service Monitoring

```bash
# Check service status
aws ecs describe-services \
  --cluster pipeline-pulse-prod \
  --services pipeline-pulse-prod-service \
  --region ap-southeast-1

# List running tasks
aws ecs list-tasks \
  --cluster pipeline-pulse-prod \
  --service-name pipeline-pulse-prod-service \
  --region ap-southeast-1

# Describe task details
aws ecs describe-tasks \
  --cluster pipeline-pulse-prod \
  --tasks arn:aws:ecs:ap-southeast-1:272858488437:task/pipeline-pulse-prod/xxxxxxxxx \
  --region ap-southeast-1
```

### 3. Load Balancer Health

```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:targetgroup/pipeline-pulse-tg/xxxxxxxxx \
  --region ap-southeast-1

# Check ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/pipeline-pulse-alb/xxxxxxxxx \
  --start-time 2025-06-02T00:00:00Z \
  --end-time 2025-06-02T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region ap-southeast-1
```

## 🔧 Troubleshooting

### Common Issues

#### 1. ECS Task Failures

```bash
# Check task exit reason
aws ecs describe-tasks \
  --cluster pipeline-pulse-prod \
  --tasks arn:aws:ecs:ap-southeast-1:272858488437:task/pipeline-pulse-prod/xxxxxxxxx \
  --region ap-southeast-1 \
  --query 'tasks[0].containers[0].reason'

# Check CloudWatch logs for errors
aws logs filter-log-events \
  --log-group-name /ecs/pipeline-pulse-prod \
  --filter-pattern "ERROR" \
  --region ap-southeast-1
```

#### 2. Load Balancer Health Check Failures

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:targetgroup/pipeline-pulse-tg/xxxxxxxxx \
  --region ap-southeast-1

# Test health endpoint directly
curl http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com/health
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:ap-southeast-1:272858488437:certificate/xxxxxxxxx \
  --region ap-southeast-1 \
  --query 'Certificate.Status'

# Verify DNS validation records
aws route53 list-resource-record-sets \
  --hosted-zone-id Z06882003RVZ48NS7EIIU \
  --query 'ResourceRecordSets[?Type==`CNAME`]'
```

#### 4. Database Connection Issues

```bash
# Test database connectivity from ECS task
aws ecs execute-command \
  --cluster pipeline-pulse-prod \
  --task arn:aws:ecs:ap-southeast-1:272858488437:task/pipeline-pulse-prod/xxxxxxxxx \
  --container pipeline-pulse-backend \
  --interactive \
  --command "/bin/bash"

# Inside container:
# psql postgresql://postgres:PipelinePulse2025!@pipeline-pulse-db-prod.xxxxxxxxx.ap-southeast-1.rds.amazonaws.com:5432/pipeline_pulse
```

### Performance Optimization

#### 1. Auto Scaling

```bash
# Create auto scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/pipeline-pulse-prod/pipeline-pulse-prod-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10 \
  --region ap-southeast-1

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name pipeline-pulse-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/pipeline-pulse-prod/pipeline-pulse-prod-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json \
  --region ap-southeast-1
```

#### 2. Database Performance

```bash
# Enable Performance Insights
aws rds modify-db-instance \
  --db-instance-identifier pipeline-pulse-db-prod \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --region ap-southeast-1

# Create read replica for read-heavy workloads
aws rds create-db-instance-read-replica \
  --db-instance-identifier pipeline-pulse-db-read-replica \
  --source-db-instance-identifier pipeline-pulse-db-prod \
  --db-instance-class db.t3.micro \
  --region ap-southeast-1
```

## 🔄 Maintenance

### Regular Updates

#### 1. Application Updates

```bash
# Build new image
docker build -t pipeline-pulse:v2.0.0 .

# Tag and push to ECR
docker tag pipeline-pulse:v2.0.0 \
  272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse-prod:v2.0.0

docker push 272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse-prod:v2.0.0

# Update task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition-v2.json \
  --region ap-southeast-1

# Update service
aws ecs update-service \
  --cluster pipeline-pulse-prod \
  --service pipeline-pulse-prod-service \
  --task-definition pipeline-pulse-prod:2 \
  --region ap-southeast-1
```

#### 2. Database Maintenance

```bash
# Create database snapshot
aws rds create-db-snapshot \
  --db-instance-identifier pipeline-pulse-db-prod \
  --db-snapshot-identifier pipeline-pulse-db-snapshot-$(date +%Y%m%d) \
  --region ap-southeast-1

# Apply minor version updates
aws rds modify-db-instance \
  --db-instance-identifier pipeline-pulse-db-prod \
  --auto-minor-version-upgrade \
  --apply-immediately \
  --region ap-southeast-1
```

#### 3. SSL Certificate Renewal

```bash
# Check certificate expiration
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:ap-southeast-1:272858488437:certificate/xxxxxxxxx \
  --region ap-southeast-1 \
  --query 'Certificate.NotAfter'

# ACM automatically renews certificates, but verify renewal
aws acm list-certificates \
  --certificate-statuses ISSUED \
  --region ap-southeast-1
```

### Backup Strategy

#### 1. Database Backups

```bash
# Automated backups are enabled by default
# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier pipeline-pulse-db-prod \
  --db-snapshot-identifier pipeline-pulse-manual-backup-$(date +%Y%m%d-%H%M) \
  --region ap-southeast-1

# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier pipeline-pulse-db-prod \
  --region ap-southeast-1
```

#### 2. Application Data Backups

```bash
# Backup uploaded files from ECS task
aws ecs execute-command \
  --cluster pipeline-pulse-prod \
  --task arn:aws:ecs:ap-southeast-1:272858488437:task/pipeline-pulse-prod/xxxxxxxxx \
  --container pipeline-pulse-backend \
  --interactive \
  --command "tar -czf /tmp/uploads-backup-$(date +%Y%m%d).tar.gz /app/uploads"

# Copy to S3
aws s3 cp /tmp/uploads-backup-$(date +%Y%m%d).tar.gz \
  s3://pipeline-pulse-backups/uploads/ \
  --region ap-southeast-1
```

### Security Updates

#### 1. Security Group Reviews

```bash
# Review security group rules
aws ec2 describe-security-groups \
  --group-ids sg-xxxxxxxxx \
  --region ap-southeast-1

# Remove unnecessary rules
aws ec2 revoke-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 \
  --region ap-southeast-1
```

#### 2. Access Key Rotation

```bash
# Rotate Zoho API credentials
# Update environment variables in task definition
# Deploy new task definition

# Rotate database password
aws rds modify-db-instance \
  --db-instance-identifier pipeline-pulse-db-prod \
  --master-user-password 'NewSecurePassword2025!' \
  --apply-immediately \
  --region ap-southeast-1
```

---

## 📞 Support

For deployment issues or questions:

1. **Check CloudWatch Logs:** `/ecs/pipeline-pulse-prod`
2. **Review ECS Service Events:** AWS Console → ECS → Services
3. **Monitor ALB Target Health:** AWS Console → EC2 → Target Groups
4. **Verify DNS Resolution:** `nslookup 1chsalesreports.com`

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Application Load Balancer Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [AWS Certificate Manager Documentation](https://docs.aws.amazon.com/acm/)
- [Route 53 Developer Guide](https://docs.aws.amazon.com/route53/)
- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/)

---

**Last Updated:** June 2025
**Version:** 1.0
**Environment:** Production (ap-southeast-1)
