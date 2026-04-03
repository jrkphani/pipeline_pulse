#!/bin/bash
# AWS Secrets Manager Update Script for Pipeline Pulse
# Updates Zoho API credentials for v8 compatibility

set -e  # Exit on any error

echo "🔐 Updating AWS Secrets Manager for Pipeline Pulse v8 API"
echo "========================================================"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
SECRET_PREFIX="pipeline-pulse/zoho"

# Credentials sourced from environment variables — set these before running
ZOHO_CLIENT_SECRET="${ZOHO_CLIENT_SECRET:?ZOHO_CLIENT_SECRET must be set}"
ZOHO_REFRESH_TOKEN="${ZOHO_REFRESH_TOKEN:?ZOHO_REFRESH_TOKEN must be set}"
ZOHO_BASE_URL="${ZOHO_BASE_URL:-https://www.zohoapis.in/crm/v8}"
ZOHO_ACCOUNTS_URL="${ZOHO_ACCOUNTS_URL:-https://accounts.zoho.in}"
ZOHO_CLIENT_ID="${ZOHO_CLIENT_ID:?ZOHO_CLIENT_ID must be set}"

echo "🌍 AWS Region: $AWS_REGION"
echo "🔑 Secret Prefix: $SECRET_PREFIX"
echo ""

# Function to update or create secret
update_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local description="$3"
    
    echo "📝 Updating secret: $secret_name"
    
    # Try to update existing secret
    if aws secretsmanager update-secret \
        --region "$AWS_REGION" \
        --secret-id "$secret_name" \
        --secret-string "$secret_value" \
        --description "$description" \
        > /dev/null 2>&1; then
        echo "   ✅ Updated existing secret: $secret_name"
    else
        # If update fails, try to create new secret
        echo "   📝 Creating new secret: $secret_name"
        if aws secretsmanager create-secret \
            --region "$AWS_REGION" \
            --name "$secret_name" \
            --secret-string "$secret_value" \
            --description "$description" \
            > /dev/null 2>&1; then
            echo "   ✅ Created new secret: $secret_name"
        else
            echo "   ❌ Failed to create/update secret: $secret_name"
            return 1
        fi
    fi
}

# Function to verify secret
verify_secret() {
    local secret_name="$1"
    local expected_length="$2"
    
    echo "🔍 Verifying secret: $secret_name"
    
    if secret_value=$(aws secretsmanager get-secret-value \
        --region "$AWS_REGION" \
        --secret-id "$secret_name" \
        --query 'SecretString' \
        --output text 2>/dev/null); then
        
        actual_length=${#secret_value}
        if [ "$actual_length" -ge "$expected_length" ]; then
            echo "   ✅ Verified: $secret_name (length: $actual_length)"
            return 0
        else
            echo "   ⚠️ Warning: $secret_name seems too short (length: $actual_length, expected: >=$expected_length)"
            return 1
        fi
    else
        echo "   ❌ Failed to retrieve secret: $secret_name"
        return 1
    fi
}

echo "🔄 Updating Zoho API Secrets..."
echo "--------------------------------"

# Update all secrets
update_secret "$SECRET_PREFIX/client-id" "$ZOHO_CLIENT_ID" "Zoho CRM API Client ID for Pipeline Pulse"
update_secret "$SECRET_PREFIX/client-secret" "$ZOHO_CLIENT_SECRET" "Zoho CRM API Client Secret for Pipeline Pulse"
update_secret "$SECRET_PREFIX/refresh-token" "$ZOHO_REFRESH_TOKEN" "Zoho CRM API Refresh Token for Pipeline Pulse"
update_secret "$SECRET_PREFIX/base-url" "$ZOHO_BASE_URL" "Zoho CRM API Base URL (v8) for Pipeline Pulse"
update_secret "$SECRET_PREFIX/accounts-url" "$ZOHO_ACCOUNTS_URL" "Zoho Accounts URL (India Data Center) for Pipeline Pulse"

echo ""
echo "🔍 Verifying Updated Secrets..."
echo "-------------------------------"

# Verify all secrets
verify_secret "$SECRET_PREFIX/client-id" 30
verify_secret "$SECRET_PREFIX/client-secret" 40
verify_secret "$SECRET_PREFIX/refresh-token" 50
verify_secret "$SECRET_PREFIX/base-url" 30
verify_secret "$SECRET_PREFIX/accounts-url" 20

echo ""
echo "📊 Secret Summary:"
echo "------------------"

# List all pipeline-pulse secrets
echo "🔑 All Pipeline Pulse secrets:"
aws secretsmanager list-secrets \
    --region "$AWS_REGION" \
    --query "SecretList[?contains(Name, 'pipeline-pulse')].{Name:Name,Description:Description,LastChangedDate:LastChangedDate}" \
    --output table

echo ""
echo "✅ AWS Secrets Manager Update Complete!"
echo "========================================"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy the updated application to AWS"
echo "2. Test the health endpoints"
echo "3. Verify Zoho API connectivity"
echo "4. Monitor application logs for any issues"
echo ""
echo "🧪 Test Commands:"
echo "curl https://1chsalesreports.com/api/health"
echo "curl https://1chsalesreports.com/api/zoho/test-connection"
echo "curl \"https://1chsalesreports.com/api/zoho/deals?limit=3&fields=Deal_Name,Amount,Stage\""
echo ""
echo "📊 Monitor with:"
echo "aws logs tail /aws/ecs/pipeline-pulse --follow"
echo ""
echo "🎉 Ready for production deployment!"
