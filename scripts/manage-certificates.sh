#!/bin/bash

# SSL Certificate Management Script for 1chsalesreports.com
# This script helps manage both the existing certificate and the new wildcard certificate

set -e

# Configuration
DOMAIN_NAME="1chsalesreports.com"
HOSTED_ZONE_ID="Z06882003RVZ48NS7EIIU"
REGION="us-east-1"

# Colors
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

# Function to list all certificates
list_certificates() {
    log_step "Listing all SSL certificates for $DOMAIN_NAME..."
    
    aws acm list-certificates \
        --region $REGION \
        --query "CertificateSummaryList[?contains(DomainName, '1chsalesreports.com') || contains(SubjectAlternativeNames[0], '1chsalesreports.com')].{Domain:DomainName,Status:Status,ARN:CertificateArn}" \
        --output table
}

# Function to show certificate details
show_certificate_details() {
    if [ -z "$1" ]; then
        log_error "Please provide a certificate ARN"
        return 1
    fi
    
    local cert_arn="$1"
    log_step "Certificate Details for: $cert_arn"
    
    aws acm describe-certificate \
        --certificate-arn "$cert_arn" \
        --region $REGION \
        --query 'Certificate.{DomainName:DomainName,SubjectAlternativeNames:SubjectAlternativeNames,Status:Status,KeyAlgorithm:KeyAlgorithm,NotBefore:NotBefore,NotAfter:NotAfter}' \
        --output table
}

# Function to compare certificates
compare_certificates() {
    log_step "Comparing your current certificates..."
    
    # Get all certificates
    CERTS=$(aws acm list-certificates \
        --region $REGION \
        --query "CertificateSummaryList[?contains(DomainName, '1chsalesreports.com') || contains(SubjectAlternativeNames[0], '1chsalesreports.com')]" \
        --output json)
    
    if [ "$(echo "$CERTS" | jq '. | length')" -eq 0 ]; then
        log_warning "No certificates found for $DOMAIN_NAME"
        return 1
    fi
    
    echo "$CERTS" | jq -r '.[] | @base64' | while read -r cert; do
        CERT_DATA=$(echo "$cert" | base64 --decode)
        CERT_ARN=$(echo "$CERT_DATA" | jq -r '.CertificateArn')
        DOMAIN=$(echo "$CERT_DATA" | jq -r '.DomainName')
        STATUS=$(echo "$CERT_DATA" | jq -r '.Status')
        
        echo
        log_info "Certificate: $DOMAIN"
        log_info "  ARN: $CERT_ARN"
        log_info "  Status: $STATUS"
        
        # Get SANs (Subject Alternative Names)
        SANS=$(aws acm describe-certificate \
            --certificate-arn "$CERT_ARN" \
            --region $REGION \
            --query 'Certificate.SubjectAlternativeNames' \
            --output json 2>/dev/null || echo '[]')
        
        if [ "$(echo "$SANS" | jq '. | length')" -gt 0 ]; then
            log_info "  Alternative Names:"
            echo "$SANS" | jq -r '.[]' | while read -r san; do
                log_info "    - $san"
            done
        fi
        
        # Check if it's a wildcard
        if [[ "$DOMAIN" == "*."* ]] || echo "$SANS" | jq -r '.[]' | grep -q '^\*\.'; then
            log_success "  🌟 This is a WILDCARD certificate"
        else
            log_info "  📄 This is a SINGLE-DOMAIN certificate"
        fi
    done
}

# Function to check certificate usage
check_certificate_usage() {
    if [ -z "$1" ]; then
        log_error "Please provide a certificate ARN"
        return 1
    fi
    
    local cert_arn="$1"
    log_step "Checking where certificate is being used..."
    
    # Check CloudFront distributions
    log_info "Checking CloudFront distributions..."
    CF_USAGE=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?ViewerCertificate.ACMCertificateArn=='$cert_arn'].{Id:Id,DomainName:DomainName,Aliases:Aliases}" \
        --output json 2>/dev/null || echo '[]')
    
    if [ "$(echo "$CF_USAGE" | jq '. | length')" -gt 0 ]; then
        log_success "Used in CloudFront distributions:"
        echo "$CF_USAGE" | jq -r '.[] | "  - Distribution: \(.Id) | Domain: \(.DomainName) | Aliases: \(.Aliases | join(", "))"'
    else
        log_info "Not used in any CloudFront distributions"
    fi
    
    # Check Load Balancers
    log_info "Checking Application Load Balancers..."
    ALB_USAGE=$(aws elbv2 describe-load-balancers \
        --query 'LoadBalancers[].LoadBalancerArn' \
        --output text 2>/dev/null | tr '\t' '\n' | while read -r alb_arn; do
        if [ -n "$alb_arn" ]; then
            aws elbv2 describe-listeners \
                --load-balancer-arn "$alb_arn" \
                --query "Listeners[?Certificates[?CertificateArn=='$cert_arn']].{LoadBalancer:'$alb_arn',ListenerArn:ListenerArn,Port:Port}" \
                --output json 2>/dev/null || echo '[]'
        fi
    done)
    
    if [ -n "$ALB_USAGE" ] && [ "$ALB_USAGE" != "[]" ]; then
        log_success "Used in Application Load Balancers"
        echo "$ALB_USAGE"
    else
        log_info "Not used in any Application Load Balancers"
    fi
}

# Function to test subdomain access
test_subdomain_access() {
    local base_domain="1chsalesreports.com"
    local subdomains=("www" "api" "app" "admin" "dashboard")
    
    log_step "Testing subdomain SSL access..."
    
    for subdomain in "${subdomains[@]}"; do
        local full_domain="${subdomain}.${base_domain}"
        log_info "Testing: https://$full_domain"
        
        # Test SSL certificate
        if curl -s --connect-timeout 10 --max-time 30 -I "https://$full_domain" >/dev/null 2>&1; then
            log_success "  ✅ SSL works for $full_domain"
        else
            log_warning "  ⚠️ SSL test failed for $full_domain (may not exist yet)"
        fi
        
        # Check certificate details
        CERT_INFO=$(echo | openssl s_client -servername "$full_domain" -connect "$full_domain:443" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null || echo "")
        if [ -n "$CERT_INFO" ]; then
            log_info "  Certificate info: $(echo "$CERT_INFO" | grep 'subject=' | cut -d'=' -f2-)"
        fi
    done
}

# Function to show migration recommendations
show_migration_recommendations() {
    log_step "Certificate Migration Recommendations"
    
    echo
    log_info "Current Situation Analysis:"
    log_info "1. You have a certificate for '1chsalesreports.com'"
    log_info "2. You need wildcard support for '*.1chsalesreports.com'"
    echo
    log_success "Recommended Actions:"
    log_info "1. 🎯 Create wildcard certificate (*.1chsalesreports.com + 1chsalesreports.com)"
    log_info "2. 🔄 Update CloudFront to use wildcard certificate"
    log_info "3. 🔄 Update ALB to use wildcard certificate"
    log_info "4. ⏳ Wait for DNS propagation (up to 48 hours)"
    log_info "5. 🗑️ Remove old single-domain certificate after testing"
    echo
    log_warning "Benefits of Wildcard Certificate:"
    log_info "✅ Covers all subdomains (api.*, app.*, admin.*, etc.)"
    log_info "✅ Easier certificate management"
    log_info "✅ Future-proof for new subdomains"
    log_info "✅ Single certificate to renew"
    echo
    log_info "To create wildcard certificate, run:"
    log_info "  ./setup-wildcard-certificate.sh"
}

# Function to validate current certificate
validate_current_certificate() {
    log_step "Validating existing certificate..."
    
    # Your existing certificate ARN
    EXISTING_CERT_ARN="arn:aws:acm:us-east-1:272858488437:certificate/e66b548f-8e9b-4c11-ba5d-40f7792227bf"
    
    log_info "Checking certificate: $EXISTING_CERT_ARN"
    
    STATUS=$(aws acm describe-certificate \
        --certificate-arn "$EXISTING_CERT_ARN" \
        --region $REGION \
        --query 'Certificate.Status' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$STATUS" = "ISSUED" ]; then
        log_success "✅ Existing certificate is ISSUED and valid"
        show_certificate_details "$EXISTING_CERT_ARN"
    elif [ "$STATUS" = "NOT_FOUND" ]; then
        log_error "❌ Existing certificate not found"
    else
        log_warning "⚠️ Existing certificate status: $STATUS"
    fi
}

# Function to show help
show_help() {
    echo "SSL Certificate Management Script for 1chsalesreports.com"
    echo
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  list                    List all certificates"
    echo "  details <cert-arn>      Show certificate details"
    echo "  compare                 Compare all certificates"
    echo "  usage <cert-arn>        Check where certificate is used"
    echo "  test                    Test subdomain SSL access"
    echo "  recommendations         Show migration recommendations"
    echo "  validate                Validate existing certificate"
    echo "  help                    Show this help message"
    echo
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 details arn:aws:acm:us-east-1:account:certificate/cert-id"
    echo "  $0 compare"
    echo "  $0 test"
}

# Main function
main() {
    case "${1:-help}" in
        "list")
            list_certificates
            ;;
        "details")
            show_certificate_details "$2"
            ;;
        "compare")
            compare_certificates
            ;;
        "usage")
            check_certificate_usage "$2"
            ;;
        "test")
            test_subdomain_access
            ;;
        "recommendations")
            show_migration_recommendations
            ;;
        "validate")
            validate_current_certificate
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run the main function
main "$@"
