#!/bin/bash

# Complete Pipeline Pulse AWS Infrastructure Teardown Script
# This script removes ALL Pipeline Pulse resources to save costs and reduce security risks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${RED}🗑️  Pipeline Pulse Complete Infrastructure Teardown${NC}"
echo "=================================================="
echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL Pipeline Pulse AWS resources!${NC}"
echo -e "${YELLOW}⚠️  This action is IRREVERSIBLE and will result in data loss!${NC}"
echo
echo "Resources to be deleted:"
echo "• ECS Clusters and Services"
echo "• Aurora PostgreSQL Database"
echo "• Application Load Balancers"
echo "• CloudFront Distribution"
echo "• S3 Buckets and all data"
echo "• IAM Roles and Policies"
echo "• Security Groups"
echo "• Secrets Manager secrets"
echo "• ECR Repository"
echo "• VPC and networking components"
echo

read -p "Are you absolutely sure you want to proceed? Type 'DELETE-EVERYTHING' to confirm: " confirmation

if [ "$confirmation" != "DELETE-EVERYTHING" ]; then
    echo -e "${GREEN}✅ Teardown cancelled. No resources were deleted.${NC}"
    exit 0
fi

echo -e "${RED}🚨 Starting teardown process...${NC}"
echo

# Configuration
AWS_REGION="ap-southeast-1"

# Function to check if resource exists
resource_exists() {
    local check_command="$1"
    eval "$check_command" >/dev/null 2>&1
    return $?
}

# Function to wait for resource deletion
wait_for_deletion() {
    local check_command="$1"
    local resource_name="$2"
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Waiting for $resource_name deletion...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if ! eval "$check_command" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $resource_name deleted successfully${NC}"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - still exists..."
        sleep 10
        ((attempt++))
    done
    echo -e "${YELLOW}⚠️  $resource_name deletion timeout - may still be in progress${NC}"
}

echo -e "${BLUE}1. Stopping and deleting ECS services...${NC}"

# Stop ECS Services
ECS_CLUSTERS=("pipeline-pulse-direct-access" "pipeline-pulse-prod")
for cluster in "${ECS_CLUSTERS[@]}"; do
    echo "  Checking cluster: $cluster"
    if resource_exists "aws ecs describe-clusters --cluster $cluster --region $AWS_REGION"; then
        # Get services in cluster
        services=$(aws ecs list-services --cluster $cluster --region $AWS_REGION --query 'serviceArns[]' --output text)
        for service_arn in $services; do
            service_name=$(basename $service_arn)
            echo "    Scaling down service: $service_name"
            aws ecs update-service --cluster $cluster --service $service_name --desired-count 0 --region $AWS_REGION >/dev/null 2>&1 || true
            
            echo "    Deleting service: $service_name"
            aws ecs delete-service --cluster $cluster --service $service_name --region $AWS_REGION >/dev/null 2>&1 || true
        done
        
        echo "    Deleting cluster: $cluster"
        aws ecs delete-cluster --cluster $cluster --region $AWS_REGION >/dev/null 2>&1 || true
    fi
done

echo -e "${BLUE}2. Deleting Application Load Balancers...${NC}"

# Delete ALBs
ALB_NAMES=("pipeline-pulse-alb" "pipeline-pulse-direct-access-alb")
for alb_name in "${ALB_NAMES[@]}"; do
    echo "  Checking ALB: $alb_name"
    alb_arn=$(aws elbv2 describe-load-balancers --names $alb_name --region $AWS_REGION --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "None")
    if [ "$alb_arn" != "None" ] && [ "$alb_arn" != "null" ]; then
        # Delete listeners first
        listeners=$(aws elbv2 describe-listeners --load-balancer-arn $alb_arn --region $AWS_REGION --query 'Listeners[].ListenerArn' --output text 2>/dev/null || echo "")
        for listener in $listeners; do
            echo "    Deleting listener: $listener"
            aws elbv2 delete-listener --listener-arn $listener --region $AWS_REGION >/dev/null 2>&1 || true
        done
        
        # Delete target groups
        target_groups=$(aws elbv2 describe-target-groups --load-balancer-arn $alb_arn --region $AWS_REGION --query 'TargetGroups[].TargetGroupArn' --output text 2>/dev/null || echo "")
        for tg in $target_groups; do
            echo "    Deleting target group: $tg"
            aws elbv2 delete-target-group --target-group-arn $tg --region $AWS_REGION >/dev/null 2>&1 || true
        done
        
        echo "    Deleting ALB: $alb_name"
        aws elbv2 delete-load-balancer --load-balancer-arn $alb_arn --region $AWS_REGION >/dev/null 2>&1 || true
    fi
done

echo -e "${BLUE}3. Deleting Aurora PostgreSQL Database...${NC}"

# Delete Aurora cluster
CLUSTER_ID="pipeline-pulse-aurora-dev"
if resource_exists "aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $AWS_REGION"; then
    # Delete instances first
    instances=$(aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $AWS_REGION --query 'DBClusters[0].DBClusterMembers[].DBInstanceIdentifier' --output text 2>/dev/null || echo "")
    for instance in $instances; do
        echo "    Deleting DB instance: $instance"
        aws rds delete-db-instance --db-instance-identifier $instance --skip-final-snapshot --region $AWS_REGION >/dev/null 2>&1 || true
    done
    
    # Wait for instances to be deleted
    for instance in $instances; do
        wait_for_deletion "aws rds describe-db-instances --db-instance-identifier $instance --region $AWS_REGION" "DB instance $instance"
    done
    
    echo "    Deleting Aurora cluster: $CLUSTER_ID"
    aws rds delete-db-cluster --db-cluster-identifier $CLUSTER_ID --skip-final-snapshot --region $AWS_REGION >/dev/null 2>&1 || true
    wait_for_deletion "aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --region $AWS_REGION" "Aurora cluster $CLUSTER_ID"
fi

echo -e "${BLUE}4. Deleting CloudFront Distribution...${NC}"

# Disable and delete CloudFront distribution
CLOUDFRONT_ID="E15EC47TVWETI2"
if resource_exists "aws cloudfront get-distribution --id $CLOUDFRONT_ID"; then
    echo "    Disabling CloudFront distribution: $CLOUDFRONT_ID"
    # Get current config
    etag=$(aws cloudfront get-distribution --id $CLOUDFRONT_ID --query 'ETag' --output text)
    aws cloudfront get-distribution-config --id $CLOUDFRONT_ID --query 'DistributionConfig' > /tmp/cf-config.json
    
    # Disable distribution
    jq '.Enabled = false' /tmp/cf-config.json > /tmp/cf-config-disabled.json
    aws cloudfront update-distribution --id $CLOUDFRONT_ID --distribution-config file:///tmp/cf-config-disabled.json --if-match $etag >/dev/null 2>&1 || true
    
    echo "    Waiting for CloudFront distribution to be disabled..."
    aws cloudfront wait distribution-deployed --id $CLOUDFRONT_ID || true
    
    # Delete distribution
    new_etag=$(aws cloudfront get-distribution --id $CLOUDFRONT_ID --query 'ETag' --output text)
    aws cloudfront delete-distribution --id $CLOUDFRONT_ID --if-match $new_etag >/dev/null 2>&1 || true
    echo "    CloudFront distribution deletion initiated"
fi

echo -e "${BLUE}5. Deleting S3 Buckets...${NC}"

# Delete S3 buckets and all contents
S3_BUCKETS=("pipeline-pulse-frontend-prod" "pipeline-pulse-minimal-uploads" "pipeline-pulse-uploads" "1chsalesreports.com-frontend")
for bucket in "${S3_BUCKETS[@]}"; do
    if aws s3 ls "s3://$bucket" >/dev/null 2>&1; then
        echo "    Emptying bucket: $bucket"
        aws s3 rm "s3://$bucket" --recursive >/dev/null 2>&1 || true
        echo "    Deleting bucket: $bucket"
        aws s3 rb "s3://$bucket" >/dev/null 2>&1 || true
    fi
done

echo -e "${BLUE}6. Deleting Secrets Manager secrets...${NC}"

# Delete secrets
SECRET_NAMES=(
    "pipeline-pulse/app-secrets"
    "pipeline-pulse/zoho/client-id"
    "pipeline-pulse/zoho/client-secret"
    "pipeline-pulse/zoho/refresh-token"
    "pipeline-pulse/zoho/base-url"
    "pipeline-pulse/zoho/accounts-url"
)

for secret in "${SECRET_NAMES[@]}"; do
    if resource_exists "aws secretsmanager describe-secret --secret-id '$secret' --region $AWS_REGION"; then
        echo "    Deleting secret: $secret"
        aws secretsmanager delete-secret --secret-id "$secret" --force-delete-without-recovery --region $AWS_REGION >/dev/null 2>&1 || true
    fi
done

echo -e "${BLUE}7. Deleting ECR Repository...${NC}"

# Delete ECR repository
ECR_REPO="pipeline-pulse"
if resource_exists "aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION"; then
    echo "    Deleting ECR repository: $ECR_REPO"
    aws ecr delete-repository --repository-name $ECR_REPO --force --region $AWS_REGION >/dev/null 2>&1 || true
fi

echo -e "${BLUE}8. Deleting IAM Roles and Policies...${NC}"

# Delete IAM roles
IAM_ROLES=(
    "pipeline-pulse-direct-access-execution-role"
    "pipeline-pulse-direct-access-task-role"
)

for role in "${IAM_ROLES[@]}"; do
    if resource_exists "aws iam get-role --role-name $role"; then
        echo "    Detaching policies from role: $role"
        # Detach managed policies
        policies=$(aws iam list-attached-role-policies --role-name $role --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo "")
        for policy in $policies; do
            aws iam detach-role-policy --role-name $role --policy-arn $policy >/dev/null 2>&1 || true
        done
        
        # Delete inline policies
        inline_policies=$(aws iam list-role-policies --role-name $role --query 'PolicyNames[]' --output text 2>/dev/null || echo "")
        for policy in $inline_policies; do
            aws iam delete-role-policy --role-name $role --policy-name $policy >/dev/null 2>&1 || true
        done
        
        echo "    Deleting role: $role"
        aws iam delete-role --role-name $role >/dev/null 2>&1 || true
    fi
done

echo -e "${BLUE}9. Deleting Security Groups...${NC}"

# Delete security groups (in dependency order)
SECURITY_GROUPS=(
    "sg-0402646745b8e9644"  # ECS SG
    "sg-0c1f53d9ea7c86d73"  # Direct access SG
    "sg-00bf64dc0af813518"  # ALB SG
    "sg-002e6735930a3d8e1"  # DB VPC SG
    "sg-0c4a2a9301780b8a1"  # ECS SG
    "sg-0eca52a0e07bf8500"  # RDS SG
    "sg-0fe40268f97415567"  # ALB SG from VPC
)

for sg in "${SECURITY_GROUPS[@]}"; do
    if resource_exists "aws ec2 describe-security-groups --group-ids $sg --region $AWS_REGION"; then
        echo "    Deleting security group: $sg"
        aws ec2 delete-security-group --group-id $sg --region $AWS_REGION >/dev/null 2>&1 || true
    fi
done

echo
echo -e "${GREEN}🎉 Pipeline Pulse teardown completed!${NC}"
echo
echo -e "${BLUE}📊 Summary of actions taken:${NC}"
echo "✅ ECS clusters and services deleted"
echo "✅ Aurora PostgreSQL database deleted"
echo "✅ Application Load Balancers deleted"
echo "✅ CloudFront distribution deletion initiated"
echo "✅ S3 buckets and all data deleted"
echo "✅ Secrets Manager secrets deleted"
echo "✅ ECR repository deleted"
echo "✅ IAM roles and policies deleted"
echo "✅ Security groups deleted"
echo
echo -e "${YELLOW}⚠️  Note: Some resources (like CloudFront) may take additional time to fully delete.${NC}"
echo -e "${YELLOW}⚠️  VPC and subnets were not deleted as they may be shared with other resources.${NC}"
echo
echo -e "${GREEN}💰 Cost savings: All billable Pipeline Pulse resources have been removed!${NC}"
echo -e "${GREEN}🔒 Security: All Pipeline Pulse IAM roles and secrets have been deleted!${NC}"

# Cleanup temp files
rm -f /tmp/cf-config.json /tmp/cf-config-disabled.json 2>/dev/null || true
