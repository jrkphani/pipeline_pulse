#!/bin/bash

# Pipeline Pulse Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
DOMAIN_NAME="1chsalesreports.com"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:272858488437:certificate/e66b548f-8e9b-4c11-ba5d-40f7792227bf"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="272858488437"
ECR_REPOSITORY="pipeline-pulse"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying main infrastructure..."
    
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation/main.yml \
        --stack-name pipeline-pulse-infrastructure \
        --parameter-overrides \
            DomainName=$DOMAIN_NAME \
            CertificateArn=$CERTIFICATE_ARN \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset \
        --region $AWS_REGION
    
    log_success "Main infrastructure deployed"
}

# Deploy RDS
deploy_rds() {
    log_info "Deploying RDS database..."
    
    # Prompt for database password if not set
    if [ -z "$DB_PASSWORD" ]; then
        echo -n "Enter database password (min 8 characters): "
        read -s DB_PASSWORD
        echo
    fi
    
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation/rds.yml \
        --stack-name pipeline-pulse-rds \
        --parameter-overrides \
            StackName=pipeline-pulse-infrastructure \
            DBUsername=postgres \
            DBPassword=$DB_PASSWORD \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset \
        --region $AWS_REGION
    
    log_success "RDS database deployed"
}

# Build and push Docker image
build_and_push_image() {
    log_info "Building and pushing Docker image..."
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build image
    cd backend
    docker build -t $ECR_REPOSITORY .
    docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    
    # Push image
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    
    cd ..
    log_success "Docker image built and pushed"
}

# Get RDS endpoint
get_rds_endpoint() {
    DB_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name pipeline-pulse-rds \
        --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" \
        --output text \
        --region $AWS_REGION)
    
    if [ -z "$DB_ENDPOINT" ]; then
        log_error "Could not retrieve RDS endpoint"
        exit 1
    fi
    
    log_info "RDS endpoint: $DB_ENDPOINT"
}

# Deploy frontend
deploy_frontend() {
    log_info "Building and deploying frontend..."
    
    cd frontend
    
    # Install dependencies and build
    npm ci
    VITE_API_URL=https://api.$DOMAIN_NAME \
    VITE_ENVIRONMENT=production \
    VITE_APP_NAME="Pipeline Pulse" \
    VITE_COMPANY_NAME="1CloudHub" \
    npm run build
    
    # Deploy to S3
    aws s3 sync dist/ s3://$DOMAIN_NAME-frontend --delete --region $AWS_REGION
    
    # Invalidate CloudFront
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name pipeline-pulse-infrastructure \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
        --output text \
        --region $AWS_REGION)
    
    if [ ! -z "$DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation \
            --distribution-id $DISTRIBUTION_ID \
            --paths "/*" \
            --region $AWS_REGION
    fi
    
    cd ..
    log_success "Frontend deployed"
}

# Main deployment function
main() {
    log_info "Starting Pipeline Pulse deployment..."
    
    check_prerequisites
    deploy_infrastructure
    deploy_rds
    build_and_push_image
    get_rds_endpoint
    deploy_frontend
    
    log_success "Deployment completed successfully!"
    log_info "Frontend URL: https://$DOMAIN_NAME"
    log_info "API URL: https://api.$DOMAIN_NAME"
}

# Run main function
main "$@"
