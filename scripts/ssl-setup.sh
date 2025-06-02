#!/bin/bash

# SSL Certificate Setup - Quick Start Script
# This script prepares your environment for wildcard SSL certificate creation

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 1CloudHub SSL Certificate Setup${NC}"
echo -e "${BLUE}====================================${NC}"
echo

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}📁 Scripts Directory: $SCRIPT_DIR${NC}"
echo

# Make scripts executable
echo -e "${BLUE}🔧 Making scripts executable...${NC}"
chmod +x "$SCRIPT_DIR/setup-wildcard-certificate.sh"
chmod +x "$SCRIPT_DIR/manage-certificates.sh"
chmod +x "$SCRIPT_DIR/validate-acm-certificate.sh"
echo -e "${GREEN}✅ All scripts are now executable${NC}"
echo

# Check AWS CLI
echo -e "${BLUE}🔍 Checking AWS CLI configuration...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}⚠️ AWS CLI not found. Please install it first.${NC}"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
else
    if aws sts get-caller-identity &> /dev/null; then
        echo -e "${GREEN}✅ AWS CLI is configured${NC}"
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        REGION=$(aws configure get region || echo "not set")
        echo "   Account: $ACCOUNT_ID"
        echo "   Region: $REGION"
    else
        echo -e "${YELLOW}⚠️ AWS CLI not configured. Run 'aws configure' first.${NC}"
    fi
fi
echo

# Show current certificate status
echo -e "${BLUE}📋 Current Certificate Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Goal: Create wildcard certificate for *.1chsalesreports.com"
echo "📍 Current: Single domain certificate for 1chsalesreports.com"
echo
echo "Benefits of wildcard certificate:"
echo "  ✅ Covers api.1chsalesreports.com"
echo "  ✅ Covers app.1chsalesreports.com" 
echo "  ✅ Covers any new subdomains"
echo "  ✅ Easier certificate management"
echo

# Show available commands
echo -e "${BLUE}🛠️ Available Commands${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📊 Certificate Management:"
echo "   ./manage-certificates.sh validate      # Check existing certificate"
echo "   ./manage-certificates.sh list          # List all certificates"
echo "   ./manage-certificates.sh compare       # Compare certificates"
echo "   ./manage-certificates.sh test          # Test subdomain SSL"
echo
echo "🆕 Create Wildcard Certificate:"
echo "   ./setup-wildcard-certificate.sh        # Create *.1chsalesreports.com cert"
echo
echo "🔧 Legacy Certificate Validation:"
echo "   ./validate-acm-certificate.sh          # Validate existing single cert"
echo

# Recommended next steps
echo -e "${BLUE}🎯 Recommended Next Steps${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "1️⃣ Check current certificate status:"
echo "   cd $SCRIPT_DIR"
echo "   ./manage-certificates.sh validate"
echo
echo "2️⃣ Create wildcard certificate:"
echo "   ./setup-wildcard-certificate.sh"
echo
echo "3️⃣ Verify new certificate:"
echo "   ./manage-certificates.sh compare"
echo "   ./manage-certificates.sh test"
echo
echo "4️⃣ Update your infrastructure:"
echo "   • Update CloudFront distributions"
echo "   • Update Application Load Balancers"
echo "   • Update CloudFormation templates"
echo

# Show timing expectations
echo -e "${BLUE}⏱️ Expected Timeline${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Certificate Request:    1-2 minutes"
echo "DNS Record Creation:    2-5 minutes"
echo "DNS Propagation:        5-15 minutes"
echo "AWS Validation:         5-30 minutes"
echo "────────────────────────────────────────"
echo "Total Time:            15-45 minutes"
echo

# Configuration summary
echo -e "${BLUE}⚙️ Configuration Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain:                 1chsalesreports.com"
echo "Wildcard Domain:        *.1chsalesreports.com"
echo "Route 53 Zone ID:       Z06882003RVZ48NS7EIIU"
echo "AWS Region:             us-east-1 (required for CloudFront)"
echo "Current Certificate:    arn:aws:acm:us-east-1:272858488437:certificate/e66b548f-8e9b-4c11-ba5d-40f7792227bf"
echo

echo -e "${GREEN}🎉 Setup Complete! You can now create your wildcard SSL certificate.${NC}"
echo
echo -e "${YELLOW}💡 Tip: Read README-SSL-Setup.md for detailed instructions and troubleshooting.${NC}"
echo
