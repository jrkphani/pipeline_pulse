# Pipeline Pulse - Configuration Reference

## 📋 Environment Variables

### Application Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application name | `Pipeline Pulse` | No |
| `DEBUG` | Enable debug mode | `False` | No |
| `ENVIRONMENT` | Environment name | `production` | No |
| `SECRET_KEY` | Application secret key | - | **Yes** |
| `JWT_SECRET` | JWT signing secret | - | **Yes** |
| `ALGORITHM` | JWT algorithm | `HS256` | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiry | `30` | No |

### Database Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | **Yes** |

### Zoho CRM Integration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ZOHO_CLIENT_ID` | Zoho CRM client ID | `1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY` | **Yes** |
| `ZOHO_CLIENT_SECRET` | Zoho CRM client secret | `47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7` | **Yes** |
| `ZOHO_REFRESH_TOKEN` | Zoho CRM refresh token | `1000.1f6445ad715711237fbf078342cc1975.efec29cda25213ee26264296c04dd176` | **Yes** |
| `ZOHO_BASE_URL` | Zoho CRM API base URL | `https://www.zohoapis.in/crm/v2` | **Yes** |

### File Upload Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MAX_FILE_SIZE` | Maximum file size in bytes | `52428800` (50MB) | No |
| `UPLOAD_DIR` | Upload directory path | `/app/uploads` | No |

### Currency Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BASE_CURRENCY` | Base currency for conversion | `SGD` | No |
| `CURRENCY_API_KEY` | CurrencyFreaks API key | - | **Yes** |
| `CURRENCY_CACHE_DAYS` | Currency cache duration | `7` | No |

### URL Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `BASE_URL` | Application base URL | `https://1chsalesreports.com` | **Yes** |
| `FRONTEND_URL` | Frontend URL | `https://1chsalesreports.com` | **Yes** |
| `CORS_ORIGINS` | Allowed CORS origins | `https://1chsalesreports.com,https://www.1chsalesreports.com` | **Yes** |

### SAML Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SAML_ENTITY_ID` | SAML entity identifier | `https://1chsalesreports.com` | **Yes** |
| `SAML_ACS_URL` | SAML assertion consumer service URL | `https://1chsalesreports.com/api/auth/saml/acs` | **Yes** |
| `SAML_SLS_URL` | SAML single logout service URL | `https://1chsalesreports.com/api/auth/saml/logout` | **Yes** |

### Zoho Directory SAML

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ZOHO_SAML_ENTITY_ID` | Zoho SAML entity ID | `https://directory.zoho.in/p/60021093475/app/128434000000235001/sso` | **Yes** |
| `ZOHO_SAML_SSO_URL` | Zoho SAML SSO URL | `https://directory.zoho.in/p/60021093475/app/128434000000235001/sso` | **Yes** |
| `ZOHO_SAML_SLS_URL` | Zoho SAML logout URL | `https://directory.zoho.in/p/60021093475/app/128434000000235001/sso/logout` | **Yes** |
| `ZOHO_SAML_X509_CERT` | Zoho SAML X.509 certificate | `-----BEGIN CERTIFICATE-----\n...` | **Yes** |

### AWS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AWS_REGION` | AWS region | `ap-southeast-1` | No |

## 🐳 Docker Configuration

### Dockerfile

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

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/pipeline_pulse
      - DEBUG=True
      - ENVIRONMENT=development
    volumes:
      - ./backend:/app
      - uploads:/app/uploads
    depends_on:
      - db
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=pipeline_pulse
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm start

volumes:
  postgres_data:
  uploads:
```

## ⚙️ AWS ECS Configuration

### Task Definition

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
          "name": "APP_NAME",
          "value": "Pipeline Pulse"
        },
        {
          "name": "DEBUG",
          "value": "False"
        },
        {
          "name": "ENVIRONMENT",
          "value": "production"
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

### Service Configuration

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
        "subnet-0a06ec9f913823080",
        "subnet-007e5b5c2a006cc50"
      ],
      "securityGroups": [
        "sg-0c4a2a9301780b8a1"
      ],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:targetgroup/pipeline-pulse-tg/eabf6ed0101632fa",
      "containerName": "pipeline-pulse-backend",
      "containerPort": 8000
    }
  ],
  "healthCheckGracePeriodSeconds": 300,
  "enableExecuteCommand": true
}
```

## 🔧 Database Configuration

### PostgreSQL Settings

```sql
-- Database creation
CREATE DATABASE pipeline_pulse;
CREATE USER pipeline_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE pipeline_pulse TO pipeline_user;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Performance settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

### RDS Configuration

```bash
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
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --region ap-southeast-1
```

## 🌐 Load Balancer Configuration

### Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name pipeline-pulse-alb \
  --subnets subnet-0a06ec9f913823080 subnet-007e5b5c2a006cc50 \
  --security-groups sg-0c4a2a9301780b8a1 \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --region ap-southeast-1
```

### Target Group

```bash
# Create target group
aws elbv2 create-target-group \
  --name pipeline-pulse-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-0ce689a64c180be51 \
  --target-type ip \
  --health-check-enabled \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200 \
  --region ap-southeast-1
```

## 🔒 Security Configuration

### Security Groups

```bash
# ALB Security Group
aws ec2 create-security-group \
  --group-name pipeline-pulse-alb-sg \
  --description "Security group for Pipeline Pulse ALB" \
  --vpc-id vpc-0ce689a64c180be51

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# ECS Security Group
aws ec2 create-security-group \
  --group-name pipeline-pulse-ecs-sg \
  --description "Security group for Pipeline Pulse ECS service" \
  --vpc-id vpc-0ce689a64c180be51

# Allow traffic from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 8000 \
  --source-group sg-xxxxxxxxx
```

### SSL/TLS Configuration

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name 1chsalesreports.com \
  --subject-alternative-names www.1chsalesreports.com \
  --validation-method DNS \
  --key-algorithm RSA-2048 \
  --region ap-southeast-1
```

## 📊 Monitoring Configuration

### CloudWatch Alarms

```bash
# ECS Service CPU Utilization
aws cloudwatch put-metric-alarm \
  --alarm-name "pipeline-pulse-high-cpu" \
  --alarm-description "Pipeline Pulse high CPU utilization" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-southeast-1:272858488437:pipeline-pulse-alerts \
  --dimensions Name=ServiceName,Value=pipeline-pulse-prod-service Name=ClusterName,Value=pipeline-pulse-prod

# ALB Target Response Time
aws cloudwatch put-metric-alarm \
  --alarm-name "pipeline-pulse-high-response-time" \
  --alarm-description "Pipeline Pulse high response time" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 2 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-southeast-1:272858488437:pipeline-pulse-alerts \
  --dimensions Name=LoadBalancer,Value=app/pipeline-pulse-alb/e9eb99c0be6aa857
```

---

**Last Updated:** June 2025  
**Version:** 1.0  
**Environment:** Production (ap-southeast-1)
