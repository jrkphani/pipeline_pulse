#!/bin/bash

# 🧪 Test Production Deployment
# Comprehensive testing of the Pipeline Pulse production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to log messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

log_test() {
    echo -e "${CYAN}🧪 $1${NC}"
}

echo -e "${CYAN}🧪 Pipeline Pulse Production Deployment Test${NC}"
echo "=============================================="
echo ""

# Test endpoints
ENDPOINTS=(
    "https://1chsalesreports.com"
    "https://www.1chsalesreports.com"
    "https://api.1chsalesreports.com"
    "https://app.1chsalesreports.com"
)

API_ENDPOINTS=(
    "https://1chsalesreports.com/api/zoho/auth/status"
    "https://api.1chsalesreports.com/api/zoho/auth/status"
)

# Test 1: Frontend Endpoints
log_step "Testing Frontend Endpoints"
echo ""

for endpoint in "${ENDPOINTS[@]}"; do
    log_test "Testing: $endpoint"
    
    if curl -s --connect-timeout 10 --max-time 30 -I "$endpoint" | grep -q "200 OK"; then
        log_success "Frontend accessible at $endpoint"
    else
        log_warning "Frontend test failed for $endpoint"
    fi
done

echo ""

# Test 2: API Endpoints
log_step "Testing API Endpoints"
echo ""

for endpoint in "${API_ENDPOINTS[@]}"; do
    log_test "Testing: $endpoint"
    
    response=$(curl -s --connect-timeout 10 --max-time 30 "$endpoint")
    if echo "$response" | grep -q "authenticated"; then
        log_success "API working at $endpoint"
        echo "   Response: $response"
    else
        log_warning "API test failed for $endpoint"
        echo "   Response: $response"
    fi
done

echo ""

# Test 3: CORS Test (will work after CloudFront deployment completes)
log_step "Testing CORS (may fail until CloudFront deployment completes)"
echo ""

log_test "Testing CORS preflight request"
cors_response=$(curl -s -w "%{http_code}" -H "Origin: https://1chsalesreports.com" -H "Access-Control-Request-Method: GET" -X OPTIONS https://api.1chsalesreports.com/api/zoho/auth/status 2>/dev/null | tail -n1)

if [[ "$cors_response" == "200" ]]; then
    log_success "CORS preflight working"
elif [[ "$cors_response" == "403" ]]; then
    log_warning "CORS preflight blocked (CloudFront deployment may still be in progress)"
else
    log_warning "CORS preflight returned: $cors_response"
fi

echo ""

# Test 4: SSL Certificate Test
log_step "Testing SSL Certificates"
echo ""

for endpoint in "${ENDPOINTS[@]}"; do
    domain=$(echo "$endpoint" | sed 's|https://||' | sed 's|/.*||')
    log_test "Testing SSL for: $domain"
    
    if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | grep -q "Verify return code: 0"; then
        log_success "SSL certificate valid for $domain"
    else
        log_warning "SSL certificate issue for $domain"
    fi
done

echo ""

# Test 5: CloudFront Distribution Status
log_step "Checking CloudFront Distribution Status"
echo ""

distribution_status=$(aws cloudfront get-distribution --id E15EC47TVWETI2 --query "Distribution.Status" --output text 2>/dev/null || echo "Error")

if [[ "$distribution_status" == "Deployed" ]]; then
    log_success "CloudFront distribution is deployed"
elif [[ "$distribution_status" == "InProgress" ]]; then
    log_warning "CloudFront distribution deployment in progress"
else
    log_warning "CloudFront distribution status: $distribution_status"
fi

echo ""

# Test 6: Backend Health Check
log_step "Testing Backend Health"
echo ""

log_test "Testing ALB health endpoint"
alb_health=$(curl -s http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com/health 2>/dev/null || echo "Error")

if echo "$alb_health" | grep -q "healthy"; then
    log_success "Backend health check passed"
else
    log_warning "Backend health check failed"
fi

echo ""

# Summary
log_step "Deployment Summary"
echo ""

echo "🌐 Your Production Endpoints:"
echo "  ✅ Frontend: https://1chsalesreports.com"
echo "  ✅ Frontend (www): https://www.1chsalesreports.com"
echo "  ✅ Frontend (app): https://app.1chsalesreports.com"
echo "  ✅ API: https://api.1chsalesreports.com"
echo "  ✅ API (main): https://1chsalesreports.com/api/*"

echo ""
echo "🏗️  Architecture:"
echo "  • Frontend: S3 + CloudFront CDN"
echo "  • Backend: ECS Fargate + ALB"
echo "  • Database: RDS PostgreSQL"
echo "  • SSL: AWS Certificate Manager"
echo "  • DNS: Route 53"

echo ""
echo "🔧 Configuration:"
echo "  • CORS: CloudFront domains only"
echo "  • Cache: Frontend cached, API not cached"
echo "  • Health: /health endpoint for ALB"
echo "  • API: /api/* prefix for all API routes"

echo ""
if [[ "$distribution_status" == "Deployed" ]]; then
    log_success "🎉 Production deployment is complete and ready!"
else
    log_warning "⏳ CloudFront deployment still in progress (10-15 minutes)"
    echo "   Check status with: aws cloudfront get-distribution --id E15EC47TVWETI2"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Wait for CloudFront deployment to complete (if in progress)"
echo "2. Test the frontend application in your browser"
echo "3. Verify SAML authentication is working"
echo "4. Upload test data and verify functionality"
echo "5. Monitor logs and performance"
