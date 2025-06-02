#!/bin/bash

# Deploy to Your Existing AWS Infrastructure
# This script deploys to your current production environment in ap-southeast-1

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🚀 Pipeline Pulse - Manual Deployment Script${NC}"
echo -e "${BLUE}=============================================${NC}"
echo

# Configuration based on your current production deployment
AWS_REGION="ap-southeast-1"
ECR_REPO="pipeline-pulse" 
DOMAIN="1chsalesreports.com"
ECS_CLUSTER="pipeline-pulse-prod"
ECS_SERVICE="pipeline-pulse-prod-service-v2"
S3_BUCKET="1chsalesreports.com-frontend"
CLOUDFRONT_DIST_ID="E15EC47TVWETI2"

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the pipeline-pulse root directory${NC}"
    echo "   Expected files: backend/main.py and frontend/package.json"
    exit 1
fi

# Check prerequisites
echo -e "${PURPLE}🔍 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    echo "   Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "   Please install Node.js: https://nodejs.org/"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured or no valid credentials${NC}"
    echo "   Please run: aws configure"
    exit 1
fi

# Get account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"
USER_INFO=$(aws sts get-caller-identity --query Arn --output text)

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo

# Display current configuration
echo -e "${BLUE}📋 Current Deployment Configuration:${NC}"
echo "  AWS Account: $ACCOUNT_ID"
echo "  AWS Region: $AWS_REGION"
echo "  AWS User: $USER_INFO"
echo "  Domain: $DOMAIN"
echo "  ECR Repository: $ECR_URI"
echo "  ECS Cluster: $ECS_CLUSTER"
echo "  ECS Service: $ECS_SERVICE"
echo "  S3 Bucket: $S3_BUCKET"
echo "  CloudFront Distribution: $CLOUDFRONT_DIST_ID"
echo

# Check current application status
echo -e "${PURPLE}🔍 Checking current application status...${NC}"

# Test current API
if curl -f -s "https://api.$DOMAIN/health" > /dev/null; then
    echo -e "${GREEN}✅ API is currently responding${NC}"
    API_STATUS="healthy"
else
    echo -e "${YELLOW}⚠️ API is not responding (may be down for maintenance)${NC}"
    API_STATUS="unhealthy"
fi

# Test current frontend
if curl -f -s "https://$DOMAIN" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is currently accessible${NC}"
    FRONTEND_STATUS="healthy"
else
    echo -e "${YELLOW}⚠️ Frontend is not accessible${NC}"
    FRONTEND_STATUS="unhealthy"
fi

echo

# Ask what to deploy
echo -e "${YELLOW}🎯 What would you like to deploy?${NC}"
echo "1) Backend only (API/ECS service)"
echo "2) Frontend only (React app/S3+CloudFront)" 
echo "3) Both backend and frontend"
echo "4) Check deployment status only"
echo "5) Exit"
echo

while true; do
    read -p "Enter your choice (1-5): " DEPLOY_CHOICE
    case $DEPLOY_CHOICE in
        [1-5]) break;;
        *) echo "Please enter a number between 1 and 5.";;
    esac
done

case $DEPLOY_CHOICE in
    4)
        echo -e "${BLUE}📊 Current Deployment Status${NC}"
        echo "================================"
        echo "API Status: $API_STATUS"
        echo "Frontend Status: $FRONTEND_STATUS"
        echo
        echo "🌐 Application URLs:"
        echo "  Frontend: https://$DOMAIN"
        echo "  API: https://api.$DOMAIN"
        echo "  Health: https://api.$DOMAIN/health"
        exit 0
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
esac

# Confirmation prompt
echo -e "${YELLOW}⚠️ This will deploy to your PRODUCTION environment.${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo

# Backend deployment
if [ "$DEPLOY_CHOICE" = "1" ] || [ "$DEPLOY_CHOICE" = "3" ]; then
    echo -e "${BLUE}🐳 Deploying Backend...${NC}"
    echo "========================="
    
    # Check if ECR repo exists
    echo "🔍 Checking ECR repository..."
    if ! aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION &>/dev/null; then
        echo -e "${YELLOW}⚠️ ECR repository doesn't exist. Creating...${NC}"
        aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
        
        # Set lifecycle policy
        aws ecr put-lifecycle-policy \
            --repository-name $ECR_REPO \
            --lifecycle-policy-text '{
                "rules": [
                    {
                        "rulePriority": 1,
                        "selection": {
                            "tagStatus": "untagged",
                            "countType": "sinceImagePushed",
                            "countUnit": "days",
                            "countNumber": 7
                        },
                        "action": {
                            "type": "expire"
                        }
                    }
                ]
            }' > /dev/null
        
        echo -e "${GREEN}✅ ECR repository created with lifecycle policy${NC}"
    else
        echo -e "${GREEN}✅ ECR repository exists${NC}"
    fi
    
    # Login to ECR
    echo "🔐 Logging into ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
    
    # Build Docker image
    echo "🔨 Building Docker image..."
    cd backend
    
    # Get current git commit for tagging
    if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_COMMIT=$(git rev-parse --short HEAD)
        echo "📍 Git commit: $GIT_COMMIT"
    else
        GIT_COMMIT="manual-$(date +%Y%m%d-%H%M%S)"
        echo "📍 No git repository, using timestamp: $GIT_COMMIT"
    fi
    
    docker build -t $ECR_REPO:latest .
    docker tag $ECR_REPO:latest $ECR_URI:latest
    docker tag $ECR_REPO:latest $ECR_URI:$GIT_COMMIT
    
    echo "📤 Pushing images to ECR..."
    docker push $ECR_URI:latest
    docker push $ECR_URI:$GIT_COMMIT
    
    echo -e "${GREEN}✅ Images pushed successfully${NC}"
    echo "  Latest: $ECR_URI:latest"
    echo "  Tagged: $ECR_URI:$GIT_COMMIT"
    
    # Update ECS service
    echo "🔄 Updating ECS service..."
    UPDATE_RESULT=$(aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --force-new-deployment \
        --region $AWS_REGION)
    
    echo "⏳ Waiting for deployment to complete..."
    echo "   This may take 3-5 minutes..."
    
    # Wait for service to stabilize
    if aws ecs wait services-stable \
        --cluster $ECS_CLUSTER \
        --services $ECS_SERVICE \
        --region $AWS_REGION; then
        echo -e "${GREEN}✅ ECS deployment completed successfully${NC}"
    else
        echo -e "${RED}❌ ECS deployment failed or timed out${NC}"
        echo "Check the ECS console for more details"
        exit 1
    fi
    
    # Test the API
    echo "🔍 Testing API health..."
    sleep 30  # Give it a moment to fully start
    
    for i in {1..5}; do
        if curl -f -s "https://api.$DOMAIN/health" > /dev/null; then
            echo -e "${GREEN}✅ API health check passed${NC}"
            break
        else
            echo "⏳ API not ready yet (attempt $i/5), waiting 30 seconds..."
            if [ $i -eq 5 ]; then
                echo -e "${YELLOW}⚠️ API health check failed, but deployment may still be successful${NC}"
                echo "   Check https://api.$DOMAIN/health manually"
            else
                sleep 30
            fi
        fi
    done
    
    cd ..
    echo
fi

# Frontend deployment
if [ "$DEPLOY_CHOICE" = "2" ] || [ "$DEPLOY_CHOICE" = "3" ]; then
    echo -e "${BLUE}🌐 Deploying Frontend...${NC}"
    echo "========================="
    
    cd frontend
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    echo "📍 Node.js version: $NODE_VERSION"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm ci
    
    # Build the application
    echo "🔨 Building React application..."
    VITE_API_URL=https://api.$DOMAIN \
    VITE_ENVIRONMENT=production \
    VITE_APP_NAME="Pipeline Pulse" \
    VITE_COMPANY_NAME="1CloudHub" \
    npm run build
    
    # Check build output
    echo "📊 Build statistics:"
    du -sh dist/
    echo "📁 Build contents:"
    ls -la dist/
    
    # Deploy to S3
    echo "📤 Deploying to S3..."
    
    # Upload static assets with long cache headers
    echo "   Uploading assets with cache headers..."
    aws s3 sync dist/ s3://$S3_BUCKET \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "*.html" \
        --exclude "*.json" \
        --region $AWS_REGION
    
    # Upload HTML and JSON files with short cache
    echo "   Uploading HTML/JSON with no-cache headers..."
    aws s3 sync dist/ s3://$S3_BUCKET \
        --cache-control "public, max-age=0, must-revalidate" \
        --include "*.html" \
        --include "*.json" \
        --region $AWS_REGION
    
    echo -e "${GREEN}✅ Frontend deployed to S3${NC}"
    
    # Invalidate CloudFront
    echo "🔄 Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DIST_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo -e "${GREEN}✅ CloudFront invalidation created${NC}"
    echo "📍 Invalidation ID: $INVALIDATION_ID"
    echo "⏳ Cache invalidation will complete in 5-15 minutes globally"
    
    # Test frontend
    echo "🔍 Testing frontend accessibility..."
    sleep 10  # Brief wait
    
    if curl -f -s -I "https://$DOMAIN" | grep -q "200 OK"; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
        
        # Test if it contains our app
        if curl -f -s "https://$DOMAIN" | grep -q -i "pipeline"; then
            echo -e "${GREEN}✅ Frontend content verification passed${NC}"
        else
            echo -e "${YELLOW}⚠️ Frontend accessible but content may still be propagating${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Frontend may still be propagating through CloudFront${NC}"
        echo "   Check https://$DOMAIN in a few minutes"
    fi
    
    cd ..
    echo
fi

# Final summary
echo -e "${GREEN}🎉 Deployment Completed!${NC}"
echo "========================="
echo

case $DEPLOY_CHOICE in
    1)
        echo "✅ Backend deployed successfully"
        ;;
    2)
        echo "✅ Frontend deployed successfully"
        ;;
    3)
        echo "✅ Full application deployed successfully"
        ;;
esac

echo
echo -e "${BLUE}🌐 Your Application URLs:${NC}"
echo "  Frontend: https://$DOMAIN"
echo "  API: https://api.$DOMAIN"
echo "  Health Check: https://api.$DOMAIN/health"
echo

echo -e "${BLUE}📊 Next Steps:${NC}"
echo "  1. Test your application at the URLs above"
echo "  2. Monitor CloudWatch logs for any issues"
echo "  3. Check ECS service status in AWS console"
if [ "$DEPLOY_CHOICE" = "2" ] || [ "$DEPLOY_CHOICE" = "3" ]; then
    echo "  4. CloudFront cache invalidation may take 5-15 minutes"
fi

echo
echo -e "${PURPLE}💡 Tip: You can also use GitHub Actions for automated deployments!${NC}"
echo "   Push changes to the main branch to trigger automatic deployment."
echo

echo -e "${GREEN}Deployment script completed successfully! 🚀${NC}"
