#!/bin/bash
# AWS CloudShell script to fix IAM database authentication
# Run this script in AWS CloudShell for proper network access to RDS

set -e

echo "🔧 Pipeline Pulse - Aurora IAM Database Authentication Fix (CloudShell)"
echo "=============================================================="
echo

# Install PostgreSQL client if not available
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    sudo yum install -y postgresql15
fi

# Database connection parameters
DB_ENDPOINT="pipeline-pulse-aurora-dev.cluster-c39du3coqgj0.ap-southeast-1.rds.amazonaws.com"
DB_NAME="pipeline_pulse"
DB_USER="postgres"
PORT="5432"

# Get password from AWS Secrets Manager
echo "🔐 Retrieving database password from Secrets Manager..."
DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "pipeline-pulse/app-secrets" \
    --region ap-southeast-1 \
    --query SecretString \
    --output text | jq -r '.database_password')

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Failed to retrieve database password"
    exit 1
fi

echo "✅ Database password retrieved"

# Test connection
echo "🔗 Testing database connection..."
if psql "host=$DB_ENDPOINT port=$PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=require connect_timeout=10" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check if rds_iam role exists
echo "🔍 Checking if rds_iam role exists..."
if psql "host=$DB_ENDPOINT port=$PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=require" -t -c "SELECT 1 FROM pg_roles WHERE rolname = 'rds_iam';" | grep -q 1; then
    echo "✅ rds_iam role exists"
else
    echo "❌ rds_iam role does not exist. This might not be an RDS instance."
    exit 1
fi

# Check current roles for postgres user
echo "🔍 Checking current roles for postgres user..."
CURRENT_ROLES=$(psql "host=$DB_ENDPOINT port=$PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=require" -t -c "
    SELECT string_agg(r.rolname, ', ') 
    FROM pg_auth_members m 
    JOIN pg_roles r ON m.roleid = r.oid 
    JOIN pg_roles u ON m.member = u.oid 
    WHERE u.rolname = 'postgres';
" | xargs)

echo "📋 Current roles for postgres user: $CURRENT_ROLES"

# Check if rds_iam role is already granted
if echo "$CURRENT_ROLES" | grep -q "rds_iam"; then
    echo "✅ postgres user already has rds_iam role - no action needed"
else
    echo "🔧 Granting rds_iam role to postgres user..."
    if psql "host=$DB_ENDPOINT port=$PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=require" -c "GRANT rds_iam TO postgres;"; then
        echo "✅ Successfully granted rds_iam role to postgres user"
        
        # Verify the grant
        if psql "host=$DB_ENDPOINT port=$PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=require" -t -c "
            SELECT 1 
            FROM pg_auth_members m 
            JOIN pg_roles r ON m.roleid = r.oid 
            JOIN pg_roles u ON m.member = u.oid 
            WHERE u.rolname = 'postgres' AND r.rolname = 'rds_iam';
        " | grep -q 1; then
            echo "✅ Verified: rds_iam role successfully granted"
        else
            echo "❌ Failed to verify rds_iam role grant"
            exit 1
        fi
    else
        echo "❌ Failed to grant rds_iam role"
        exit 1
    fi
fi

echo
echo "🎉 IAM database authentication fix completed successfully!"
echo
echo "📋 Summary:"
echo "  • RDS instance: $DB_ENDPOINT"
echo "  • Database: $DB_NAME"
echo "  • User: $DB_USER"
echo "  • IAM authentication: ✅ Enabled"
echo "  • rds_iam role: ✅ Granted"
echo
echo "🚀 Your backend should now be able to start successfully!"
echo "   Try restarting your ECS service to verify the fix."
