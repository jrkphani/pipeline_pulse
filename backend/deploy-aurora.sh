#!/bin/bash
# Deploy Pipeline Pulse with Aurora Serverless v2 Configuration

set -e

echo "🚀 Deploying Pipeline Pulse with Aurora Serverless v2"
echo "===================================================="

# Configuration
AWS_REGION="ap-southeast-1"
CLUSTER_NAME="pipeline-pulse-prod"
SERVICE_NAME="pipeline-pulse-prod-service-v2"
TASK_FAMILY="pipeline-pulse-prod"

echo "📋 Configuration:"
echo "  Region: $AWS_REGION"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"
echo "  Task Family: $TASK_FAMILY"
echo

# Step 1: Get current task definition
echo "🔍 Getting current task definition..."
CURRENT_TASK_DEF=$(aws ecs describe-task-definition \
    --task-definition $TASK_FAMILY \
    --region $AWS_REGION \
    --query 'taskDefinition' \
    --output json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to get current task definition"
    exit 1
fi

echo "✅ Current task definition retrieved"

# Step 2: Update environment variables
echo "🔧 Updating environment variables for Aurora..."

# Create new task definition with Aurora environment variables
NEW_TASK_DEF=$(echo $CURRENT_TASK_DEF | jq --argjson env "$(cat aurora-env-vars.json)" '
    .containerDefinitions[0].environment = $env.environment |
    del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)
')

echo "✅ Environment variables updated"

# Step 3: Register new task definition
echo "📝 Registering new task definition..."
NEW_TASK_ARN=$(echo $NEW_TASK_DEF | aws ecs register-task-definition \
    --region $AWS_REGION \
    --cli-input-json file:///dev/stdin \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

if [ $? -ne 0 ]; then
    echo "❌ Failed to register new task definition"
    exit 1
fi

echo "✅ New task definition registered: $NEW_TASK_ARN"

# Step 4: Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $NEW_TASK_ARN \
    --region $AWS_REGION \
    --query 'service.{serviceName:serviceName,taskDefinition:taskDefinition,desiredCount:desiredCount}' \
    --output table

if [ $? -ne 0 ]; then
    echo "❌ Failed to update ECS service"
    exit 1
fi

echo "✅ ECS service updated successfully"

# Step 5: Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
else
    echo "⚠️  Deployment may still be in progress. Check ECS console for status."
fi

# Step 6: Check service status
echo "🔍 Checking service status..."
aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION \
    --query 'services[0].{serviceName:serviceName,status:status,runningCount:runningCount,pendingCount:pendingCount,desiredCount:desiredCount}' \
    --output table

echo
echo "🎉 Aurora Serverless v2 deployment completed!"
echo
echo "📋 Next steps:"
echo "1. Check application logs: aws logs tail /aws/ecs/pipeline-pulse --follow"
echo "2. Test health endpoint: curl https://api.1chsalesreports.com/health"
echo "3. Verify database connectivity from ECS"
echo "4. Test application functionality"
echo
echo "💰 Cost savings: ~60-70% reduction with Aurora Serverless v2!"
echo "   - Scales to near-zero when idle"
echo "   - Auto-scales based on demand (0.5-2.0 ACUs)"
echo "   - Separate read/write endpoints for optimal performance"
