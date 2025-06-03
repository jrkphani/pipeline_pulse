#!/bin/bash

# Deploy Pipeline Pulse - Direct Access Mode (No Authentication)
# This script deploys the application without authentication requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Pipeline Pulse - Direct Access Deployment${NC}"
echo "=============================================="
echo -e "${YELLOW}📢 Authentication Removed - Direct Access Mode${NC}"
echo

# Configuration
AWS_REGION="ap-southeast-1"
ECR_REPOSITORY="272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse"
CLUSTER_NAME="pipeline-pulse-prod"
SERVICE_NAME="pipeline-pulse-prod-service-v2"
TASK_DEFINITION_FAMILY="pipeline-pulse-prod"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  AWS Region: $AWS_REGION"
echo "  ECR Repository: $ECR_REPOSITORY"
echo "  ECS Cluster: $CLUSTER_NAME"
echo "  ECS Service: $SERVICE_NAME"
echo "  Mode: Direct Access (No Authentication)"
echo

# Step 1: Build and push Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
cd backend
docker build -t pipeline-pulse:latest .

echo -e "${BLUE}🏷️  Tagging image...${NC}"
docker tag pipeline-pulse:latest $ECR_REPOSITORY:latest

echo -e "${BLUE}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

echo -e "${BLUE}📤 Pushing image to ECR...${NC}"
docker push $ECR_REPOSITORY:latest

echo -e "${GREEN}✅ Docker image pushed successfully!${NC}"
echo

# Step 2: Register new task definition
echo -e "${BLUE}📝 Registering new task definition...${NC}"
cd ..

# Register the task definition
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition.json \
    --region $AWS_REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo -e "${GREEN}✅ Task definition registered: $TASK_DEFINITION_ARN${NC}"
echo

# Step 3: Update ECS service
echo -e "${BLUE}🔄 Updating ECS service...${NC}"

aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $TASK_DEFINITION_ARN \
    --region $AWS_REGION \
    --force-new-deployment

echo -e "${GREEN}✅ ECS service update initiated!${NC}"
echo

# Step 4: Wait for deployment to complete
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
echo "This may take a few minutes..."

aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo

# Step 5: Verify deployment
echo -e "${BLUE}🔍 Verifying deployment...${NC}"

# Get service status
SERVICE_STATUS=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION \
    --query 'services[0].status' \
    --output text)

RUNNING_COUNT=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION \
    --query 'services[0].runningCount' \
    --output text)

DESIRED_COUNT=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION \
    --query 'services[0].desiredCount' \
    --output text)

echo "  Service Status: $SERVICE_STATUS"
echo "  Running Tasks: $RUNNING_COUNT"
echo "  Desired Tasks: $DESIRED_COUNT"

if [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ] && [ "$SERVICE_STATUS" = "ACTIVE" ]; then
    echo -e "${GREEN}✅ Service is healthy and running!${NC}"
else
    echo -e "${YELLOW}⚠️  Service may still be starting up...${NC}"
fi

echo
echo -e "${BLUE}🌐 Application URLs (Direct Access):${NC}"
echo "  Frontend: https://1chsalesreports.com"
echo "  API: https://api.1chsalesreports.com"
echo "  Health Check: https://api.1chsalesreports.com/health"
echo "  API Docs: https://api.1chsalesreports.com/docs"
echo

echo -e "${GREEN}🎉 Direct Access Deployment Completed!${NC}"
echo -e "${BLUE}📝 Key Changes:${NC}"
echo "  ✅ Authentication removed - no login required"
echo "  ✅ Direct access to all application features"
echo "  ✅ Simplified architecture and faster performance"
echo "  ✅ All business functionality preserved"
echo
echo -e "${BLUE}🔍 Next steps:${NC}"
echo "  1. Test direct application access"
echo "  2. Verify all modules work without authentication"
echo "  3. Monitor application performance"
echo "  4. Check that Zoho CRM integration still works"
echo
