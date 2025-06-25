#!/bin/bash
# Verbose Aurora IAM Debug Script
set -e

echo "🔧 Aurora IAM Debug Script - Pipeline Pulse"
echo "==========================================="
echo

# Enable verbose output
set -x

# Aurora cluster endpoint
DB_ENDPOINT="pipeline-pulse-aurora-dev.cluster-c39du3coqgj0.ap-southeast-1.rds.amazonaws.com"
DB_NAME="pipeline_pulse"
DB_USER="postgres"
PORT="5432"

echo "📋 Connection Parameters:"
echo "  Endpoint: $DB_ENDPOINT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Port: $PORT"
echo

# Check if we're in CloudShell
echo "🌐 Environment Check:"
echo "  Current user: $(whoami)"
echo "  Current region: $(aws configure get region || echo 'Not set')"
echo "  AWS CLI version: $(aws --version)"
echo

# Test DNS resolution
echo "🔍 DNS Resolution Test:"
if nslookup $DB_ENDPOINT; then
    echo "✅ DNS resolution successful"
else
    echo "❌ DNS resolution failed"
    exit 1
fi
echo

# Test network connectivity
echo "🔗 Network Connectivity Test:"
echo "Testing connection to $DB_ENDPOINT:$PORT..."
if timeout 10 bash -c "</dev/tcp/$DB_ENDPOINT/$PORT"; then
    echo "✅ Network connection successful"
else
    echo "❌ Network connection failed - port $PORT is not reachable"
    echo "This could indicate:"
    echo "  - Security group blocking access"
    echo "  - Aurora instance not publicly accessible"
    echo "  - Network routing issues"
fi
echo

# Get password from Secrets Manager with verbose output
echo "🔐 Retrieving database password from Secrets Manager..."
echo "Secret ID: pipeline-pulse/app-secrets"
echo "Region: ap-southeast-1"

DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "pipeline-pulse/app-secrets" \
    --region ap-southeast-1 \
    --query SecretString \
    --output text 2>&1 | jq -r '.database_password' 2>&1)

if [ $? -eq 0 ] && [ ! -z "$DB_PASSWORD" ] && [ "$DB_PASSWORD" != "null" ]; then
    echo "✅ Password retrieved successfully (length: ${#DB_PASSWORD} characters)"
else
    echo "❌ Failed to retrieve password"
    echo "Error output: $DB_PASSWORD"
    exit 1
fi
echo

# Check if PostgreSQL client is available
echo "🔧 PostgreSQL Client Check:"
if command -v psql &> /dev/null; then
    echo "✅ psql is available: $(which psql)"
    echo "Version: $(psql --version)"
else
    echo "📦 Installing PostgreSQL client..."
    sudo yum install -y postgresql15
    if command -v psql &> /dev/null; then
        echo "✅ psql installed successfully"
    else
        echo "❌ Failed to install psql"
        exit 1
    fi
fi
echo

# Test Aurora cluster status
echo "🔍 Aurora Cluster Status Check:"
aws rds describe-db-clusters \
    --region ap-southeast-1 \
    --db-cluster-identifier pipeline-pulse-aurora-dev \
    --query 'DBClusters[0].{Status:Status,Endpoint:Endpoint,IAMAuth:IAMDatabaseAuthenticationEnabled}' \
    --output table
echo

# Test Aurora instance status
echo "🔍 Aurora Instance Status Check:"
aws rds describe-db-instances \
    --region ap-southeast-1 \
    --db-instance-identifier pipeline-pulse-aurora-dev-instance \
    --query 'DBInstances[0].{Status:DBInstanceStatus,PubliclyAccessible:PubliclyAccessible,Endpoint:Endpoint.Address}' \
    --output table
echo

# Detailed connection test with full error output
echo "🔗 Detailed PostgreSQL Connection Test:"
echo "Connection string: host=$DB_ENDPOINT port=$PORT dbname=$DB_NAME user=$DB_USER sslmode=require connect_timeout=10"
echo

# Test with verbose psql output
echo "Attempting connection with full error details..."
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_ENDPOINT" \
    -p "$PORT" \
    -d "$DB_NAME" \
    -U "$DB_USER" \
    --set=sslmode=require \
    -c "SELECT version(), current_database(), current_user;" \
    -v ON_ERROR_STOP=1 \
    --echo-errors \
    --echo-queries 2>&1

CONNECTION_RESULT=$?

if [ $CONNECTION_RESULT -eq 0 ]; then
    echo "✅ Aurora cluster connection successful!"
    
    # If connection works, proceed with IAM role grant
    echo
    echo "🔧 Granting rds_iam role to postgres user..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_ENDPOINT" \
        -p "$PORT" \
        -d "$DB_NAME" \
        -U "$DB_USER" \
        --set=sslmode=require \
        -c "GRANT rds_iam TO postgres;" \
        --echo-queries
    
    echo "✅ rds_iam role granted successfully!"
    
else
    echo "❌ Aurora cluster connection failed with exit code: $CONNECTION_RESULT"
    echo
    echo "🔍 Troubleshooting suggestions:"
    echo "1. Check if Aurora instance is in public subnets"
    echo "2. Verify security group allows port 5432 from CloudShell IP"
    echo "3. Confirm Aurora instance is publicly accessible"
    echo "4. Check if there are NACLs blocking traffic"
    echo "5. Verify the endpoint is correct"
    exit 1
fi

echo
echo "🎉 Script completed successfully!"
