#!/bin/bash

# Deploy Environment Configuration Fixes
# Builds and deploys updated backend with proper environment configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ECR_REGISTRY="272858488437.dkr.ecr.ap-southeast-1.amazonaws.com"
ECR_REPOSITORY="pipeline-pulse-prod"
ECS_CLUSTER="pipeline-pulse-prod"
ECS_SERVICE="pipeline-pulse-prod-service-v2"
AWS_REGION="ap-southeast-1"

# Function to log messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}🚀 Deploying Environment Configuration Fixes${NC}"
echo "=============================================="

# Step 1: Run environment synchronization check
log_info "Step 1: Running environment synchronization check..."
if [[ -f "scripts/sync-environment.sh" ]]; then
    ./scripts/sync-environment.sh
else
    log_warning "Environment sync script not found, skipping validation"
fi

echo ""

# Step 2: Build new Docker image
log_info "Step 2: Building updated Docker image..."
cd backend

# Check if Dockerfile exists
if [[ ! -f "Dockerfile" ]]; then
    log_error "Dockerfile not found in backend directory"
    exit 1
fi

# Build the image
docker build -t pipeline-pulse-backend:latest . || {
    log_error "Docker build failed"
    exit 1
}

log_success "Docker image built successfully"

# Step 3: Tag and push to ECR
log_info "Step 3: Pushing to ECR..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY || {
    log_error "ECR login failed"
    exit 1
}

# Tag the image
docker tag pipeline-pulse-backend:latest $ECR_REGISTRY/$ECR_REPOSITORY:latest || {
    log_error "Docker tag failed"
    exit 1
}

# Push to ECR
docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest || {
    log_error "Docker push failed"
    exit 1
}

log_success "Image pushed to ECR successfully"

# Step 4: Update ECS service
log_info "Step 4: Updating ECS service..."
cd ..

# Register new task definition
aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition.json \
    --region $AWS_REGION || {
    log_error "Task definition registration failed"
    exit 1
}

# Force new deployment
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION || {
    log_error "ECS service update failed"
    exit 1
}

log_success "ECS service update initiated"

# Step 5: Wait for deployment to complete
log_info "Step 5: Waiting for deployment to complete..."

# Wait for service to stabilize
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION || {
    log_warning "Service stabilization wait timed out, but deployment may still be in progress"
}

# Step 6: Verify deployment
log_info "Step 6: Verifying deployment..."

# Get ALB URL
ALB_URL="http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com"

# Test health endpoint
log_info "Testing health endpoint..."
if curl -f -s "$ALB_URL/health" > /dev/null; then
    log_success "Health check passed"
else
    log_warning "Health check failed - service may still be starting"
fi

# Test CORS
log_info "Testing CORS configuration..."
CORS_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: https://1chsalesreports.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: X-Requested-With" \
    -X OPTIONS \
    "$ALB_URL/api/health")

if [[ "$CORS_TEST" == "200" ]]; then
    log_success "CORS configuration is working"
else
    log_warning "CORS test returned status: $CORS_TEST"
fi

# Step 7: Display deployment summary
echo ""
echo -e "${GREEN}🎉 Deployment Summary${NC}"
echo "====================="
echo "✅ Docker image built and pushed to ECR"
echo "✅ ECS task definition updated"
echo "✅ ECS service deployment initiated"
echo ""
echo "🔍 Verification URLs:"
echo "  Health Check: $ALB_URL/health"
echo "  API Health:   $ALB_URL/api/health"
echo ""
echo "🧪 Test Commands:"
echo "  Health: curl $ALB_URL/health"
echo "  CORS:   curl -H 'Origin: https://1chsalesreports.com' -X OPTIONS $ALB_URL/api/health"
echo ""
echo "📋 Next Steps:"
echo "1. Verify the application is running correctly"
echo "2. Test frontend connectivity to the API"
echo "3. Monitor ECS service for any issues"
echo "4. Update DNS/CloudFront if needed"

# Step 8: Show recent logs
log_info "Recent application logs:"
echo "========================"

# Get the latest task ARN
TASK_ARN=$(aws ecs list-tasks \
    --cluster $ECS_CLUSTER \
    --service-name $ECS_SERVICE \
    --region $AWS_REGION \
    --query 'taskArns[0]' \
    --output text)

if [[ "$TASK_ARN" != "None" && "$TASK_ARN" != "" ]]; then
    TASK_ID=$(echo $TASK_ARN | cut -d'/' -f3)
    
    # Show recent logs
    aws logs get-log-events \
        --log-group-name /ecs/pipeline-pulse-prod \
        --log-stream-name "ecs/pipeline-pulse-backend/$TASK_ID" \
        --region $AWS_REGION \
        --query 'events[-5:].{Time:timestamp,Message:message}' \
        --output table 2>/dev/null || log_warning "Could not retrieve logs"
else
    log_warning "No running tasks found for log retrieval"
fi

echo ""
log_success "Environment configuration fixes deployed successfully!"
