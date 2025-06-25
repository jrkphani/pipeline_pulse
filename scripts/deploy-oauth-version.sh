#!/bin/bash

# Deploy OAuth-enabled Pipeline Pulse to existing AWS infrastructure
# Uses IAM database authentication and existing ECS cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying OAuth-enabled Pipeline Pulse${NC}"
echo "=============================================="
echo

# Configuration
AWS_REGION="ap-southeast-1"
ACCOUNT_ID="272858488437"
ECR_REPO="pipeline-pulse"
CLUSTER_NAME="pipeline-pulse-prod"
SERVICE_NAME="pipeline-pulse-prod-service-v2"
TASK_FAMILY="pipeline-pulse-prod"

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Build and push Docker image
echo -e "${BLUE}🐳 Building and pushing Docker image...${NC}"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image with platform flag for ECS compatibility
echo "   Building Docker image for OAuth version..."
cd backend
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker build --platform linux/amd64 -t $ECR_REPO:oauth-$TIMESTAMP .
docker tag $ECR_REPO:oauth-$TIMESTAMP $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:oauth-latest

# Push image
echo "   Pushing image to ECR..."
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:oauth-latest

cd ..

echo -e "${GREEN}✅ Docker image built and pushed${NC}"

# Create new task definition for OAuth version
echo -e "${BLUE}📋 Creating OAuth task definition...${NC}"

cat > oauth-task-definition.json << EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/pipeline-pulse-direct-access-execution-role",
  "taskRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/pipeline-pulse-direct-access-task-role",
  "containerDefinitions": [
    {
      "name": "pipeline-pulse-backend",
      "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:oauth-latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        },
        {
          "name": "AWS_REGION",
          "value": "$AWS_REGION"
        },
        {
          "name": "CORS_ORIGINS",
          "value": "https://1chsalesreports.com,https://www.1chsalesreports.com,https://api.1chsalesreports.com,https://app.1chsalesreports.com"
        },
        {
          "name": "BASE_URL",
          "value": "https://api.1chsalesreports.com"
        },
        {
          "name": "FRONTEND_URL",
          "value": "https://1chsalesreports.com"
        },
        {
          "name": "S3_BUCKET_NAME",
          "value": "pipeline-pulse-uploads"
        },
        {
          "name": "DB_ENDPOINT",
          "value": "pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com"
        },
        {
          "name": "DB_NAME",
          "value": "pipeline_pulse"
        },
        {
          "name": "DB_USER",
          "value": "postgres"
        }
      ],
      "secrets": [
        {
          "name": "ZOHO_CLIENT_ID",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:pipeline-pulse/zoho/client-id-qLTcct"
        },
        {
          "name": "ZOHO_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:pipeline-pulse/zoho/client-secret-g5Rbef"
        },
        {
          "name": "ZOHO_REFRESH_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:pipeline-pulse/zoho/refresh-token-mMaxDV"
        },
        {
          "name": "ZOHO_BASE_URL",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:pipeline-pulse/zoho/base-url-kVG5rZ"
        },
        {
          "name": "ZOHO_ACCOUNTS_URL",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:pipeline-pulse/zoho/accounts-url-uSUGWo"
        },
        {
          "name": "CURRENCY_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$ACCOUNT_ID:secret:pipeline-pulse/app-secrets-3V0Qo0:currency_api_key::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pipeline-pulse-prod",
          "awslogs-region": "$AWS_REGION",
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
EOF

# Register new task definition
echo "   Registering OAuth task definition..."
TASK_DEF_ARN=$(aws ecs register-task-definition \
  --cli-input-json file://oauth-task-definition.json \
  --region $AWS_REGION \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo -e "${GREEN}✅ Task definition registered: $TASK_DEF_ARN${NC}"

# Update ECS service
echo -e "${BLUE}🔄 Updating ECS service...${NC}"

# Check if service exists
if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo "   Updating existing service..."
    aws ecs update-service \
      --cluster $CLUSTER_NAME \
      --service $SERVICE_NAME \
      --task-definition $TASK_DEF_ARN \
      --region $AWS_REGION > /dev/null
else
    echo "   Service not found. Please create the service manually or check the service name."
    echo "   Task definition ARN: $TASK_DEF_ARN"
fi

echo -e "${GREEN}✅ ECS service update initiated${NC}"

# Wait for deployment
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Cleanup
rm -f oauth-task-definition.json

echo
echo -e "${YELLOW}📊 Deployment Summary:${NC}"
echo "  • Application: Pipeline Pulse (OAuth-enabled)"
echo "  • Environment: Production"
echo "  • Authentication: OAuth 2.0 with Zoho CRM"
echo "  • Database: IAM Authentication"
echo "  • Frontend: https://1chsalesreports.com"
echo "  • API: https://api.1chsalesreports.com"
echo "  • Health: https://api.1chsalesreports.com/health"
echo
echo -e "${YELLOW}🔐 OAuth Features:${NC}"
echo "  • Login page with Zoho CRM integration"
echo "  • Protected routes requiring authentication"
echo "  • User profile and logout functionality"
echo "  • Secure token management"
echo
echo -e "${GREEN}🎉 OAuth deployment complete!${NC}"
