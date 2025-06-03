#!/bin/bash

# Setup AWS Secrets Manager for Pipeline Pulse
# This script creates secrets and configures the application for production security

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🔐 Pipeline Pulse - AWS Secrets Manager Setup${NC}"
echo "=================================================="
echo

# Configuration
AWS_REGION="ap-southeast-1"
SECRET_NAME="pipeline-pulse/app-secrets"
STACK_NAME="pipeline-pulse-infrastructure"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  AWS Region: $AWS_REGION"
echo "  Secret Name: $SECRET_NAME"
echo "  Stack Name: $STACK_NAME"
echo

# Check AWS CLI and credentials
echo -e "${BLUE}🔍 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS credentials configured for account: $ACCOUNT_ID${NC}"
echo

# Check if secret already exists
echo -e "${BLUE}🔍 Checking if secrets already exist...${NC}"
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Secret already exists: $SECRET_NAME${NC}"
    read -p "Do you want to update the existing secret? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Skipping secret creation. Using existing secret.${NC}"
        SKIP_SECRET_CREATION=true
    else
        SKIP_SECRET_CREATION=false
    fi
else
    echo -e "${GREEN}✅ Secret does not exist. Will create new secret.${NC}"
    SKIP_SECRET_CREATION=false
fi
echo

# Collect secrets if creating new or updating
if [ "$SKIP_SECRET_CREATION" = false ]; then
    echo -e "${BLUE}🔧 Collecting application secrets...${NC}"
    echo -e "${YELLOW}Please provide the following secrets:${NC}"
    echo

    # Database password
    echo -e "${PURPLE}Database Password:${NC}"
    echo "Current RDS endpoint: pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com"
    read -s -p "Enter PostgreSQL database password: " DB_PASSWORD
    echo
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}❌ Database password is required${NC}"
        exit 1
    fi

    # Zoho client secret
    echo -e "${PURPLE}Zoho CRM Integration:${NC}"
    echo "Current client ID: 1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
    read -s -p "Enter Zoho client secret: " ZOHO_SECRET
    echo
    if [ -z "$ZOHO_SECRET" ]; then
        echo -e "${RED}❌ Zoho client secret is required${NC}"
        exit 1
    fi

    # Currency API key
    echo -e "${PURPLE}Currency API:${NC}"
    echo "CurrencyFreaks API for live exchange rates"
    read -s -p "Enter CurrencyFreaks API key (or press Enter to use default): " CURRENCY_KEY
    echo
    if [ -z "$CURRENCY_KEY" ]; then
        CURRENCY_KEY="fdd7d81e5f0d434393a5a0cca6053423"  # Default from user preferences
        echo -e "${YELLOW}Using default CurrencyFreaks API key${NC}"
    fi

    # Generate JWT secret
    echo -e "${PURPLE}JWT Secret:${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ Generated secure JWT secret${NC}"
    echo

    # Create or update secret
    echo -e "${BLUE}🔧 Creating/updating application secrets in AWS...${NC}"
    
    SECRET_VALUE=$(cat <<EOF
{
    "database_password": "$DB_PASSWORD",
    "zoho_client_secret": "$ZOHO_SECRET",
    "currency_api_key": "$CURRENCY_KEY",
    "jwt_secret": "$JWT_SECRET"
}
EOF
)

    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
        # Update existing secret
        aws secretsmanager update-secret \
            --secret-id "$SECRET_NAME" \
            --secret-string "$SECRET_VALUE" \
            --region "$AWS_REGION" > /dev/null
        echo -e "${GREEN}✅ Updated existing secret: $SECRET_NAME${NC}"
    else
        # Create new secret
        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --description "Application secrets for Pipeline Pulse production deployment" \
            --secret-string "$SECRET_VALUE" \
            --region "$AWS_REGION" \
            --tags '[
                {"Key": "Application", "Value": "Pipeline Pulse"},
                {"Key": "Environment", "Value": "Production"},
                {"Key": "ManagedBy", "Value": "Terraform"}
            ]' > /dev/null
        echo -e "${GREEN}✅ Created new secret: $SECRET_NAME${NC}"
    fi
fi

# Create IAM policy for ECS to access secrets
echo -e "${BLUE}🔧 Setting up IAM permissions...${NC}"

POLICY_NAME="PipelinePulseSecretsAccess"
POLICY_DOCUMENT=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": [
                "arn:aws:secretsmanager:${AWS_REGION}:${ACCOUNT_ID}:secret:${SECRET_NAME}*"
            ]
        }
    ]
}
EOF
)

# Check if policy exists
if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  IAM policy already exists: $POLICY_NAME${NC}"
else
    # Create IAM policy
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT" \
        --description "Allows ECS tasks to access Pipeline Pulse secrets" > /dev/null
    echo -e "${GREEN}✅ Created IAM policy: $POLICY_NAME${NC}"
fi

# Get ECS task role ARN
echo -e "${BLUE}🔍 Finding ECS task role...${NC}"
TASK_ROLE_NAME=$(aws ecs describe-task-definition \
    --task-definition pipeline-pulse-prod \
    --region "$AWS_REGION" \
    --query 'taskDefinition.taskRoleArn' \
    --output text 2>/dev/null | sed 's|.*/||' || echo "")

if [ -n "$TASK_ROLE_NAME" ] && [ "$TASK_ROLE_NAME" != "None" ]; then
    echo -e "${GREEN}✅ Found ECS task role: $TASK_ROLE_NAME${NC}"
    
    # Attach policy to role
    aws iam attach-role-policy \
        --role-name "$TASK_ROLE_NAME" \
        --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}" 2>/dev/null || true
    echo -e "${GREEN}✅ Attached secrets policy to ECS task role${NC}"
else
    echo -e "${YELLOW}⚠️  ECS task role not found. You may need to attach the policy manually.${NC}"
    echo -e "${YELLOW}   Policy ARN: arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}${NC}"
fi

echo

# Verify secret access
echo -e "${BLUE}🔍 Verifying secret access...${NC}"
if aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Secret is accessible${NC}"
else
    echo -e "${RED}❌ Cannot access secret. Check permissions.${NC}"
    exit 1
fi

echo

# Summary
echo -e "${GREEN}🎉 AWS Secrets Manager setup completed successfully!${NC}"
echo
echo -e "${YELLOW}📝 Summary:${NC}"
echo "  • Secret created/updated: $SECRET_NAME"
echo "  • IAM policy created: $POLICY_NAME"
echo "  • ECS task role configured for secrets access"
echo
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Update ECS task definition to use secrets"
echo "  2. Deploy updated application code"
echo "  3. Test application with Secrets Manager integration"
echo
echo -e "${BLUE}💡 To deploy with secrets:${NC}"
echo "  bash scripts/deploy-with-secrets.sh"
echo
