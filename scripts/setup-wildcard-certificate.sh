#!/bin/bash

# Wildcard SSL Certificate Setup Script for *.1chsalesreports.com
# This script requests and validates a wildcard SSL certificate using AWS ACM and Route 53

set -e

# Configuration
DOMAIN_NAME="1chsalesreports.com"
WILDCARD_DOMAIN="*.1chsalesreports.com"
HOSTED_ZONE_ID="Z06882003RVZ48NS7EIIU"  # Your existing Route 53 hosted zone
REGION="us-east-1"  # Must be us-east-1 for CloudFront certificates

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Function to check if AWS CLI is configured
check_aws_cli() {
    log_step "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    log_success "AWS CLI is properly configured"
}

# Function to check if domain exists in Route 53
check_hosted_zone() {
    log_step "Verifying Route 53 hosted zone..."
    
    ZONE_CHECK=$(aws route53 get-hosted-zone \
        --id $HOSTED_ZONE_ID \
        --query 'HostedZone.Name' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$ZONE_CHECK" = "NOT_FOUND" ]; then
        log_error "Hosted zone $HOSTED_ZONE_ID not found"
        exit 1
    fi
    
    if [ "$ZONE_CHECK" != "${DOMAIN_NAME}." ]; then
        log_error "Hosted zone mismatch. Expected: ${DOMAIN_NAME}. Found: $ZONE_CHECK"
        exit 1
    fi
    
    log_success "Route 53 hosted zone verified: $ZONE_CHECK"
}

# Function to check for existing wildcard certificates
check_existing_certificates() {
    log_step "Checking for existing wildcard certificates..."
    
    EXISTING_CERTS=$(aws acm list-certificates \
        --region $REGION \
        --query "CertificateSummaryList[?starts_with(DomainName, '*')].{Arn:CertificateArn,Domain:DomainName,Status:Status}" \
        --output table)
    
    if [ -n "$EXISTING_CERTS" ]; then
        log_info "Found existing wildcard certificates:"
        echo "$EXISTING_CERTS"
        
        read -p "Do you want to proceed with creating a new wildcard certificate? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Exiting at user request"
            exit 0
        fi
    else
        log_info "No existing wildcard certificates found"
    fi
}

# Function to request wildcard certificate
request_wildcard_certificate() {
    log_step "Requesting wildcard SSL certificate..."
    
    # Request certificate with both apex domain and wildcard
    CERT_ARN=$(aws acm request-certificate \
        --domain-name $DOMAIN_NAME \
        --subject-alternative-names $WILDCARD_DOMAIN \
        --validation-method DNS \
        --region $REGION \
        --query 'CertificateArn' \
        --output text)
    
    if [ -z "$CERT_ARN" ]; then
        log_error "Failed to request certificate"
        exit 1
    fi
    
    log_success "Certificate requested successfully!"
    log_info "Certificate ARN: $CERT_ARN"
    
    # Save certificate ARN for later use
    echo "WILDCARD_CERT_ARN=$CERT_ARN" > /tmp/wildcard_cert.env
    
    return 0
}

# Function to get validation records
get_validation_records() {
    log_step "Retrieving certificate validation records..."
    
    # Wait a bit for AWS to generate validation records
    sleep 10
    
    # Try multiple times to get validation records (sometimes takes a moment)
    for i in {1..10}; do
        log_info "Attempt $i/10 to retrieve validation records..."
        
        aws acm describe-certificate \
            --certificate-arn $CERT_ARN \
            --region $REGION \
            --query 'Certificate.DomainValidationOptions[*].ResourceRecord' \
            --output json > /tmp/wildcard_validation_records.json
        
        # Check if we got valid records
        RECORD_COUNT=$(jq '. | length' /tmp/wildcard_validation_records.json 2>/dev/null || echo "0")
        
        if [ "$RECORD_COUNT" -gt 0 ]; then
            log_success "Retrieved $RECORD_COUNT validation record(s)"
            break
        fi
        
        if [ $i -eq 10 ]; then
            log_error "Failed to retrieve validation records after 10 attempts"
            cat /tmp/wildcard_validation_records.json
            exit 1
        fi
        
        log_info "Waiting 10 seconds before retry..."
        sleep 10
    done
    
    log_info "Validation records:"
    cat /tmp/wildcard_validation_records.json | jq '.'
}

# Function to create validation DNS records
create_validation_dns_records() {
    log_step "Creating DNS validation records in Route 53..."
    
    # Parse validation records and create Route 53 change batch
    VALIDATION_RECORDS=$(cat /tmp/wildcard_validation_records.json)
    
    # Create change batch JSON
    cat > /tmp/wildcard_change_batch.json << 'EOF'
{
    "Changes": []
}
EOF
    
    # Process each validation record
    echo "$VALIDATION_RECORDS" | jq -r '.[] | @base64' | while read -r record; do
        DECODED=$(echo "$record" | base64 --decode)
        
        VALIDATION_NAME=$(echo "$DECODED" | jq -r '.Name')
        VALIDATION_VALUE=$(echo "$DECODED" | jq -r '.Value')
        VALIDATION_TYPE=$(echo "$DECODED" | jq -r '.Type')
        
        log_info "Processing validation record:"
        log_info "  Name: $VALIDATION_NAME"
        log_info "  Type: $VALIDATION_TYPE"
        log_info "  Value: $VALIDATION_VALUE"
        
        # Create individual change batch
        cat > "/tmp/change_${VALIDATION_NAME//[^a-zA-Z0-9]/_}.json" << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$VALIDATION_NAME",
                "Type": "$VALIDATION_TYPE",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$VALIDATION_VALUE"
                    }
                ]
            }
        }
    ]
}
EOF
        
        # Apply the change
        CHANGE_ID=$(aws route53 change-resource-record-sets \
            --hosted-zone-id $HOSTED_ZONE_ID \
            --change-batch "file:///tmp/change_${VALIDATION_NAME//[^a-zA-Z0-9]/_}.json" \
            --query 'ChangeInfo.Id' \
            --output text)
        
        log_success "DNS record created. Change ID: $CHANGE_ID"
        
        # Save change ID for monitoring
        echo "$CHANGE_ID" >> /tmp/wildcard_change_ids.txt
    done
    
    log_success "All DNS validation records created"
}

# Function to wait for DNS propagation
wait_for_dns_propagation() {
    log_step "Waiting for DNS changes to propagate..."
    
    if [ ! -f /tmp/wildcard_change_ids.txt ]; then
        log_warning "No change IDs found, skipping DNS propagation wait"
        return 0
    fi
    
    while read -r change_id; do
        if [ -n "$change_id" ]; then
            log_info "Waiting for change ID: $change_id"
            aws route53 wait resource-record-sets-changed --id "$change_id"
            log_success "Change $change_id propagated"
        fi
    done < /tmp/wildcard_change_ids.txt
    
    log_success "All DNS changes have propagated"
}

# Function to test DNS resolution
test_dns_resolution() {
    log_step "Testing DNS resolution for validation records..."
    
    # Get validation record names from the JSON
    VALIDATION_NAMES=$(cat /tmp/wildcard_validation_records.json | jq -r '.[].Name')
    
    for validation_name in $VALIDATION_NAMES; do
        # Remove trailing dot if present
        clean_name=${validation_name%.}
        
        log_info "Testing DNS resolution for: $clean_name"
        
        # Test with multiple DNS servers
        for dns_server in "8.8.8.8" "1.1.1.1" "ns-183.awsdns-22.com"; do
            log_info "  Testing with $dns_server..."
            
            if dig @$dns_server CNAME "$clean_name" +short | head -1; then
                log_success "  ✅ Resolved via $dns_server"
            else
                log_warning "  ⚠️ Failed to resolve via $dns_server"
            fi
        done
    done
}

# Function to monitor certificate validation
monitor_certificate_validation() {
    log_step "Monitoring certificate validation status..."
    
    MAX_ATTEMPTS=60  # 30 minutes maximum wait time
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        log_info "Validation check $ATTEMPT/$MAX_ATTEMPTS..."
        
        # Get certificate status
        STATUS=$(aws acm describe-certificate \
            --certificate-arn $CERT_ARN \
            --region $REGION \
            --query 'Certificate.Status' \
            --output text)
        
        log_info "Current status: $STATUS"
        
        if [ "$STATUS" = "ISSUED" ]; then
            log_success "🎉 Certificate has been ISSUED successfully!"
            
            # Display certificate details
            aws acm describe-certificate \
                --certificate-arn $CERT_ARN \
                --region $REGION \
                --query 'Certificate.{Status:Status,DomainName:DomainName,SubjectAlternativeNames:SubjectAlternativeNames,NotAfter:NotAfter}' \
                --output table
            
            return 0
        elif [ "$STATUS" = "FAILED" ]; then
            log_error "❌ Certificate validation FAILED"
            
            # Show failure reasons
            aws acm describe-certificate \
                --certificate-arn $CERT_ARN \
                --region $REGION \
                --query 'Certificate.DomainValidationOptions[*].{Domain:DomainName,Status:ValidationStatus,FailureReason:FailureReason}' \
                --output table
            
            return 1
        elif [ "$STATUS" = "PENDING_VALIDATION" ]; then
            log_info "⏳ Certificate is still pending validation..."
        else
            log_warning "⚠️ Unexpected status: $STATUS"
        fi
        
        # Force validation check by describing certificate multiple times
        if [ $((ATTEMPT % 5)) -eq 0 ]; then
            log_info "Nudging AWS validation process..."
            for i in {1..3}; do
                aws acm describe-certificate \
                    --certificate-arn $CERT_ARN \
                    --region $REGION \
                    --query 'Certificate.Status' \
                    --output text > /dev/null
                sleep 2
            done
        fi
        
        log_info "Waiting 30 seconds before next check..."
        sleep 30
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    log_error "❌ Certificate validation timed out after $((MAX_ATTEMPTS * 30 / 60)) minutes"
    return 1
}

# Function to update infrastructure with new certificate
update_infrastructure_certificate() {
    log_step "Would you like to update your infrastructure to use the new wildcard certificate?"
    
    read -p "Update CloudFormation stacks with new certificate ARN? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Updating infrastructure..."
        
        # Check if CloudFormation stacks exist
        MAIN_STACK_EXISTS=$(aws cloudformation describe-stacks \
            --stack-name pipeline-pulse-infrastructure \
            --region $REGION \
            --query 'Stacks[0].StackName' \
            --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$MAIN_STACK_EXISTS" != "NOT_FOUND" ]; then
            log_info "Updating main infrastructure stack..."
            aws cloudformation update-stack \
                --stack-name pipeline-pulse-infrastructure \
                --use-previous-template \
                --parameters ParameterKey=DomainName,UsePreviousValue=true \
                         ParameterKey=CertificateArn,ParameterValue=$CERT_ARN \
                --capabilities CAPABILITY_IAM \
                --region $REGION
            
            log_success "Infrastructure update initiated"
        else
            log_info "Main infrastructure stack not found, skipping update"
        fi
        
        # Check ECS stack
        ECS_STACK_EXISTS=$(aws cloudformation describe-stacks \
            --stack-name pipeline-pulse-ecs \
            --region $REGION \
            --query 'Stacks[0].StackName' \
            --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$ECS_STACK_EXISTS" != "NOT_FOUND" ]; then
            log_info "Updating ECS stack..."
            aws cloudformation update-stack \
                --stack-name pipeline-pulse-ecs \
                --use-previous-template \
                --parameters ParameterKey=StackName,UsePreviousValue=true \
                         ParameterKey=DomainName,UsePreviousValue=true \
                         ParameterKey=CertificateArn,ParameterValue=$CERT_ARN \
                         ParameterKey=ECRImageURI,UsePreviousValue=true \
                         ParameterKey=DBEndpoint,UsePreviousValue=true \
                --capabilities CAPABILITY_IAM \
                --region $REGION
            
            log_success "ECS stack update initiated"
        else
            log_info "ECS stack not found, skipping update"
        fi
    else
        log_info "Skipping infrastructure update"
    fi
}

# Function to display final results
display_final_results() {
    log_step "Certificate Setup Complete!"
    
    echo
    log_success "🎉 Wildcard SSL Certificate Successfully Created!"
    echo
    log_info "Certificate Details:"
    log_info "  ARN: $CERT_ARN"
    log_info "  Domain: $DOMAIN_NAME"
    log_info "  Wildcard: $WILDCARD_DOMAIN"
    log_info "  Region: $REGION"
    echo
    log_info "This certificate can now be used for:"
    log_info "  ✅ https://1chsalesreports.com"
    log_info "  ✅ https://www.1chsalesreports.com"
    log_info "  ✅ https://api.1chsalesreports.com"
    log_info "  ✅ https://app.1chsalesreports.com"
    log_info "  ✅ https://*.1chsalesreports.com (any subdomain)"
    echo
    log_info "Next Steps:"
    log_info "1. Update your CloudFront distributions to use this certificate"
    log_info "2. Update your Application Load Balancers to use this certificate"
    log_info "3. Update your CloudFormation templates with the new ARN"
    log_info "4. Test all your subdomains to ensure they work correctly"
    echo
    log_info "Certificate ARN saved to: /tmp/wildcard_cert.env"
    log_info "To use in scripts: source /tmp/wildcard_cert.env && echo \\$WILDCARD_CERT_ARN"
    echo
}

# Function to clean up temporary files
cleanup() {
    log_step "Cleaning up temporary files..."
    
    rm -f /tmp/wildcard_validation_records.json
    rm -f /tmp/wildcard_change_batch.json
    rm -f /tmp/change_*.json
    rm -f /tmp/wildcard_change_ids.txt
    
    log_success "Cleanup complete"
}

# Function to save certificate info for future reference
save_certificate_info() {
    log_step "Saving certificate information..."
    
    # Create certificate info file
    cat > "/tmp/1chsalesreports-wildcard-cert-info.txt" << EOF
# 1CloudHub Wildcard SSL Certificate Information
# Generated on: $(date)

DOMAIN_NAME=$DOMAIN_NAME
WILDCARD_DOMAIN=$WILDCARD_DOMAIN
CERTIFICATE_ARN=$CERT_ARN
REGION=$REGION
HOSTED_ZONE_ID=$HOSTED_ZONE_ID

# Use this ARN in your infrastructure:
# - CloudFront distributions
# - Application Load Balancers  
# - CloudFormation templates

# To verify certificate:
aws acm describe-certificate --certificate-arn $CERT_ARN --region $REGION

# To list all certificates:
aws acm list-certificates --region $REGION
EOF
    
    log_success "Certificate info saved to: /tmp/1chsalesreports-wildcard-cert-info.txt"
}

# Main execution function
main() {
    log_success "🚀 Starting Wildcard SSL Certificate Setup for *.1chsalesreports.com"
    echo
    log_info "This script will:"
    log_info "1. Request a wildcard SSL certificate for *.1chsalesreports.com"
    log_info "2. Include the apex domain (1chsalesreports.com) as well"
    log_info "3. Automatically validate using Route 53 DNS"
    log_info "4. Wait for certificate issuance"
    echo
    
    # Execution steps
    check_aws_cli
    check_hosted_zone
    check_existing_certificates
    request_wildcard_certificate
    
    # Load certificate ARN from file
    source /tmp/wildcard_cert.env
    CERT_ARN=$WILDCARD_CERT_ARN
    
    get_validation_records
    create_validation_dns_records
    wait_for_dns_propagation
    test_dns_resolution
    
    # Monitor validation (this may take up to 30 minutes)
    if monitor_certificate_validation; then
        save_certificate_info
        update_infrastructure_certificate
        display_final_results
    else
        log_error "Certificate validation failed. Please check the DNS records and try again."
        log_info "You can re-run this script or manually check the ACM console."
        exit 1
    fi
    
    cleanup
    
    log_success "🎉 Wildcard SSL Certificate setup completed successfully!"
}

# Error handling
trap 'log_error "Script failed on line $LINENO"' ERR

# Run the main function
main "$@"
