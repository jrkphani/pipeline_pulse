# 🚀 Pipeline Pulse - Automated Deployment Strategy

## 📊 Current Production Environment Analysis

Based on your `PRODUCTION_DEPLOYMENT_COMPLETE.md` and infrastructure files, here's your current setup:

### ✅ **Successfully Deployed Components**

| Component | Status | Resource | Region |
|-----------|--------|----------|---------|
| **Frontend** | ✅ Live | CloudFront E15EC47TVWETI2 | Global CDN |
| **Backend API** | ✅ Live | ECS Cluster: pipeline-pulse-prod | ap-southeast-1 |
| **Database** | ✅ Live | RDS: pipeline-pulse-db-dev | ap-southeast-1 |
| **Load Balancer** | ✅ Live | ALB: pipeline-pulse-alb-1144051995 | ap-southeast-1 |
| **SSL Certificate** | ✅ Active | Valid until 2026 | us-east-1 |
| **Domain Setup** | ✅ Live | 1chsalesreports.com | Global |

### 🎯 **Your Production URLs**
- **Main Frontend**: https://1chsalesreports.com
- **API Endpoint**: https://api.1chsalesreports.com
- **App Frontend**: https://app.1chsalesreports.com

---

## 🔄 **CI/CD Strategy for Your Existing Setup**

Since your application is already deployed and working, I'll create a CI/CD pipeline that works with your current infrastructure without disrupting it.

### **Phase 1: Non-Disruptive CI/CD Setup (Recommended)**

This approach adds automation to your existing infrastructure without changing what's already working.

#### **Step 1: Create GitHub Actions for Your Existing Setup**

Create `.github/workflows/deploy-existing-infrastructure.yml`:

```yaml
name: Deploy to Existing Pipeline Pulse Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - '.github/workflows/**'
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-southeast-1  # Your current region
  ECR_REPOSITORY: pipeline-pulse
  DOMAIN_NAME: 1chsalesreports.com
  
  # Your existing resource names
  ECS_CLUSTER: pipeline-pulse-prod
  ECS_SERVICE: pipeline-pulse-prod-service-v2
  S3_BUCKET: 1chsalesreports.com-frontend
  CLOUDFRONT_DISTRIBUTION_ID: E15EC47TVWETI2

jobs:
  # Test phase
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        component: [frontend, backend]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Test Backend
      if: matrix.component == 'backend'
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        echo "✅ Backend dependencies installed"
        # Add actual tests when available: python -m pytest

    - name: Test Frontend  
      if: matrix.component == 'frontend'
      run: |
        cd frontend
        npm ci
        npm run lint
        npm run build
        echo "✅ Frontend build successful"

  # Deploy backend only when backend files change
  deploy-backend:
    if: github.ref == 'refs/heads/main' && contains(github.event.head_commit.modified, 'backend/')
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Check if ECR repository exists
      id: check-ecr
      run: |
        if aws ecr describe-repositories --repository-names ${{ env.ECR_REPOSITORY }} --region ${{ env.AWS_REGION }} 2>/dev/null; then
          echo "ecr-exists=true" >> $GITHUB_OUTPUT
        else
          echo "ecr-exists=false" >> $GITHUB_OUTPUT
        fi

    - name: Create ECR repository if it doesn't exist
      if: steps.check-ecr.outputs.ecr-exists == 'false'
      run: |
        aws ecr create-repository \
          --repository-name ${{ env.ECR_REPOSITORY }} \
          --region ${{ env.AWS_REGION }}
        echo "✅ ECR repository created"

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd backend
        
        # Build the image
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        
        # Push the image
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
        
        echo "✅ Image pushed: $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"

    - name: Update ECS service with new image
      run: |
        # Force new deployment to pick up the latest image
        aws ecs update-service \
          --cluster ${{ env.ECS_CLUSTER }} \
          --service ${{ env.ECS_SERVICE }} \
          --force-new-deployment \
          --region ${{ env.AWS_REGION }}
        
        echo "✅ ECS service update initiated"

    - name: Wait for deployment to complete
      run: |
        echo "⏳ Waiting for ECS deployment to complete..."
        aws ecs wait services-stable \
          --cluster ${{ env.ECS_CLUSTER }} \
          --services ${{ env.ECS_SERVICE }} \
          --region ${{ env.AWS_REGION }}
        
        echo "✅ ECS deployment completed successfully"

    - name: Verify deployment health
      run: |
        echo "🔍 Testing API health..."
        
        # Wait a bit for the service to be ready
        sleep 30
        
        # Test the health endpoint
        if curl -f -s "https://api.${{ env.DOMAIN_NAME }}/health" > /dev/null; then
          echo "✅ API health check passed"
        else
          echo "❌ API health check failed"
          exit 1
        fi

  # Deploy frontend only when frontend files change
  deploy-frontend:
    if: github.ref == 'refs/heads/main' && contains(github.event.head_commit.modified, 'frontend/')
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Build React application
      env:
        VITE_API_URL: https://api.${{ env.DOMAIN_NAME }}
        VITE_ENVIRONMENT: production
        VITE_APP_NAME: Pipeline Pulse
        VITE_COMPANY_NAME: 1CloudHub
      run: |
        cd frontend
        npm ci
        npm run build
        echo "✅ Frontend build completed"

    - name: Deploy to S3
      run: |
        cd frontend
        aws s3 sync dist/ s3://${{ env.S3_BUCKET }} \
          --delete \
          --cache-control "public, max-age=31536000" \
          --exclude "*.html" \
          --region ${{ env.AWS_REGION }}
        
        # Upload HTML files with different cache settings
        aws s3 sync dist/ s3://${{ env.S3_BUCKET }} \
          --delete \
          --cache-control "public, max-age=0, must-revalidate" \
          --include "*.html" \
          --region ${{ env.AWS_REGION }}
        
        echo "✅ Frontend deployed to S3"

    - name: Invalidate CloudFront cache
      run: |
        aws cloudfront create-invalidation \
          --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION_ID }} \
          --paths "/*" \
          --region us-east-1
        
        echo "✅ CloudFront cache invalidated"

    - name: Verify frontend deployment
      run: |
        echo "🔍 Testing frontend..."
        
        # Wait for CloudFront invalidation to start
        sleep 30
        
        # Test the main site
        if curl -f -s "https://${{ env.DOMAIN_NAME }}" > /dev/null; then
          echo "✅ Frontend is accessible"
        else
          echo "❌ Frontend health check failed"
          exit 1
        fi

  # Full deployment when both change or manual trigger
  deploy-full:
    if: github.ref == 'refs/heads/main' && (contains(github.event.head_commit.modified, 'backend/') && contains(github.event.head_commit.modified, 'frontend/'))
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - name: Trigger backend deployment
      uses: ./.github/workflows/deploy-existing-infrastructure.yml
      with:
        job: deploy-backend
        
    - name: Trigger frontend deployment  
      needs: deploy-backend
      uses: ./.github/workflows/deploy-existing-infrastructure.yml
      with:
        job: deploy-frontend

  # Notification job
  notify:
    if: always()
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    
    steps:
    - name: Deployment notification
      run: |
        if [ "${{ needs.deploy-backend.result }}" == "success" ] || [ "${{ needs.deploy-frontend.result }}" == "success" ]; then
          echo "🎉 Deployment completed successfully!"
          echo "🌐 Frontend: https://${{ env.DOMAIN_NAME }}"
          echo "🔗 API: https://api.${{ env.DOMAIN_NAME }}"
          echo "📊 Health: https://api.${{ env.DOMAIN_NAME }}/health"
        else
          echo "❌ Deployment failed. Check the logs above."
        fi
```

#### **Step 2: Create Deployment Scripts for Manual Use**

Create `scripts/deploy-to-existing-aws.sh`:

```bash
#!/bin/bash

# Deploy to Your Existing AWS Infrastructure
# This script deploys to your current production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying to Existing Pipeline Pulse Infrastructure${NC}"
echo

# Configuration based on your current setup
AWS_REGION="ap-southeast-1"
ECR_REPO="pipeline-pulse" 
DOMAIN="1chsalesreports.com"
ECS_CLUSTER="pipeline-pulse-prod"
ECS_SERVICE="pipeline-pulse-prod-service-v2"
S3_BUCKET="1chsalesreports.com-frontend"
CLOUDFRONT_DIST_ID="E15EC47TVWETI2"

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Please run this script from the pipeline-pulse root directory${NC}"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured${NC}"
    exit 1
fi

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Account: $ACCOUNT_ID"
echo "  Region: $AWS_REGION"
echo "  Domain: $DOMAIN"
echo "  ECR: $ECR_URI"
echo "  ECS Cluster: $ECS_CLUSTER"
echo "  ECS Service: $ECS_SERVICE"
echo

# Ask what to deploy
echo -e "${YELLOW}What would you like to deploy?${NC}"
echo "1) Backend only"
echo "2) Frontend only" 
echo "3) Both backend and frontend"
read -p "Enter your choice (1-3): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1|3)
        echo -e "${BLUE}🐳 Deploying Backend...${NC}"
        
        # Check if ECR repo exists
        if ! aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION &>/dev/null; then
            echo -e "${YELLOW}⚠️ ECR repository doesn't exist. Creating...${NC}"
            aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
        fi
        
        # Login to ECR
        aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
        
        # Build and push
        cd backend
        echo "Building Docker image..."
        docker build -t $ECR_REPO:latest .
        docker tag $ECR_REPO:latest $ECR_URI:latest
        docker tag $ECR_REPO:latest $ECR_URI:$(git rev-parse --short HEAD)
        
        echo "Pushing to ECR..."
        docker push $ECR_URI:latest
        docker push $ECR_URI:$(git rev-parse --short HEAD)
        
        # Update ECS service
        echo "Updating ECS service..."
        aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment \
            --region $AWS_REGION > /dev/null
        
        echo "Waiting for deployment to complete..."
        aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services $ECS_SERVICE \
            --region $AWS_REGION
        
        echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
        cd ..
        ;;
esac

case $DEPLOY_CHOICE in
    2|3)
        echo -e "${BLUE}🌐 Deploying Frontend...${NC}"
        
        # Build frontend
        cd frontend
        echo "Installing dependencies..."
        npm ci
        
        echo "Building frontend..."
        VITE_API_URL=https://api.$DOMAIN \
        VITE_ENVIRONMENT=production \
        VITE_APP_NAME="Pipeline Pulse" \
        VITE_COMPANY_NAME="1CloudHub" \
        npm run build
        
        # Deploy to S3
        echo "Deploying to S3..."
        aws s3 sync dist/ s3://$S3_BUCKET \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "*.html"
        
        # Upload HTML with different cache
        aws s3 sync dist/ s3://$S3_BUCKET \
            --cache-control "public, max-age=0, must-revalidate" \
            --include "*.html"
        
        # Invalidate CloudFront
        echo "Invalidating CloudFront..."
        INVALIDATION_ID=$(aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_DIST_ID \
            --paths "/*" \
            --query 'Invalidation.Id' \
            --output text)
        
        echo "Invalidation ID: $INVALIDATION_ID"
        echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
        cd ..
        ;;
esac

# Test the deployment
echo -e "${BLUE}🔍 Testing deployment...${NC}"

if [ "$DEPLOY_CHOICE" = "1" ] || [ "$DEPLOY_CHOICE" = "3" ]; then
    echo "Testing API..."
    sleep 30  # Wait for ECS to be ready
    if curl -f -s "https://api.$DOMAIN/health" > /dev/null; then
        echo -e "${GREEN}✅ API is responding${NC}"
    else
        echo -e "${YELLOW}⚠️ API might still be starting up${NC}"
    fi
fi

if [ "$DEPLOY_CHOICE" = "2" ] || [ "$DEPLOY_CHOICE" = "3" ]; then
    echo "Testing frontend..."
    if curl -f -s "https://$DOMAIN" > /dev/null; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️ Frontend might still be propagating${NC}"
    fi
fi

echo
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${BLUE}🌐 Your application:${NC}"
echo "  Frontend: https://$DOMAIN"
echo "  API: https://api.$DOMAIN" 
echo "  Health: https://api.$DOMAIN/health"
echo
```

#### **Step 3: GitHub Repository Secrets Setup**

You need to add these secrets to your GitHub repository at:
`https://github.com/jrkphani/pipeline_pulse/settings/secrets/actions`

**Required Secrets:**
```
AWS_ACCESS_KEY_ID         # Your AWS access key
AWS_SECRET_ACCESS_KEY     # Your AWS secret key
```

**Optional Secrets (for enhanced features):**
```
SLACK_WEBHOOK_URL         # For deployment notifications
DISCORD_WEBHOOK_URL       # Alternative notification method
```

#### **Step 4: Environment-Specific Configuration**

Create `backend/.env.github` for CI/CD environment variables:
```bash
# GitHub Actions Environment
ENVIRONMENT=production
APP_NAME=Pipeline Pulse

# These will be set by secrets in GitHub Actions
# DATABASE_URL=${DATABASE_URL}
# ZOHO_CLIENT_SECRET=${ZOHO_CLIENT_SECRET}
# JWT_SECRET=${JWT_SECRET}

# Static production values
ZOHO_CLIENT_ID=1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
BASE_CURRENCY=SGD
AWS_REGION=ap-southeast-1
CORS_ORIGINS=https://1chsalesreports.com,https://www.1chsalesreports.com,https://api.1chsalesreports.com,https://app.1chsalesreports.com
```

---

## 🎯 **Quick Setup Instructions**

### **Step 1: Add the GitHub Actions Workflow**
```bash
cd /Users/jrkphani/Projects/pipeline-pulse

# Create the workflow directory
mkdir -p .github/workflows

# Copy the workflow file (content provided above)
# Create the file .github/workflows/deploy-existing-infrastructure.yml
```

### **Step 2: Add GitHub Secrets**
1. Go to https://github.com/jrkphani/pipeline_pulse/settings/secrets/actions
2. Add your AWS credentials:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### **Step 3: Make Deployment Script Executable**
```bash
chmod +x scripts/deploy-to-existing-aws.sh
```

### **Step 4: Test Manual Deployment**
```bash
# Test the manual deployment script
./scripts/deploy-to-existing-aws.sh
```

### **Step 5: Test Automated Deployment**
```bash
# Make a small change and push to trigger CI/CD
echo "# Test change" >> README.md
git add README.md
git commit -m "test: trigger CI/CD deployment"
git push origin main
```

---

## 🔍 **What This Strategy Provides**

### ✅ **Benefits**
1. **Zero Downtime**: Works with your existing running infrastructure
2. **Smart Deployment**: Only deploys what changed (backend or frontend)
3. **Health Checks**: Verifies deployment success
4. **Fast Setup**: Uses your existing AWS resources
5. **Manual Override**: Script for manual deployments when needed

### 🎯 **Deployment Triggers**
- **Backend changes**: Builds new Docker image and updates ECS
- **Frontend changes**: Builds and deploys to S3 + CloudFront
- **Both changed**: Deploys backend first, then frontend
- **Manual**: Use the deployment script for immediate deployments

### 📊 **Monitoring**
- GitHub Actions shows deployment status
- Health checks verify API and frontend
- CloudWatch logs capture deployment details
- ECS service shows deployment progress

This approach gives you full CI/CD automation while respecting your existing, working infrastructure!
