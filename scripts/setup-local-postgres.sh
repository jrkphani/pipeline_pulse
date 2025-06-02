#!/bin/bash

# Setup Local PostgreSQL for Development
# Ensures development environment matches production database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐘 Setting Up Local PostgreSQL Development Environment${NC}"
echo "====================================================="

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

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    PACKAGE_MANAGER="brew"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v apt-get &> /dev/null; then
        PACKAGE_MANAGER="apt"
    elif command -v yum &> /dev/null; then
        PACKAGE_MANAGER="yum"
    else
        log_error "Unsupported Linux distribution"
        exit 1
    fi
else
    log_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Install PostgreSQL
install_postgresql() {
    log_info "Installing PostgreSQL..."
    
    case $PACKAGE_MANAGER in
        "brew")
            if ! command -v brew &> /dev/null; then
                log_error "Homebrew not found. Please install Homebrew first."
                exit 1
            fi
            
            if ! command -v psql &> /dev/null; then
                brew install postgresql
                brew services start postgresql
            else
                log_success "PostgreSQL already installed"
            fi
            ;;
        "apt")
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
        "yum")
            sudo yum install -y postgresql postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
    esac
    
    log_success "PostgreSQL installation completed"
}

# Create development database
create_database() {
    log_info "Creating development database..."
    
    # Database configuration
    DB_NAME="pipeline_pulse_dev"
    DB_USER="pipeline_pulse_user"
    DB_PASSWORD="dev_password_123"
    
    case $PACKAGE_MANAGER in
        "brew")
            # On macOS with Homebrew, we can create database directly
            if psql postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
                log_warning "Database $DB_NAME already exists"
            else
                createdb $DB_NAME
                log_success "Database $DB_NAME created"
            fi
            
            # Create user if not exists
            psql postgres -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || {
                psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
                psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
                log_success "User $DB_USER created and granted privileges"
            }
            ;;
        "apt"|"yum")
            # On Linux, we need to use sudo -u postgres
            sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
                sudo -u postgres createdb $DB_NAME
                log_success "Database $DB_NAME created"
            }
            
            sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || {
                sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
                sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
                log_success "User $DB_USER created and granted privileges"
            }
            ;;
    esac
}

# Update local environment file
update_env_file() {
    log_info "Updating local environment file..."
    
    ENV_FILE="backend/.env"
    ENV_DEV_FILE="backend/.env.development"
    
    # Create development environment file
    cat > "$ENV_DEV_FILE" << EOF
# Pipeline Pulse Development Environment Variables
# Uses PostgreSQL to match production environment

# App Settings
APP_NAME="Pipeline Pulse"
DEBUG=True
ENVIRONMENT=development

# Database - PostgreSQL (matches production)
DATABASE_URL=postgresql://pipeline_pulse_user:dev_password_123@localhost:5432/pipeline_pulse_dev

# File Upload Settings
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads

# Currency Settings
BASE_CURRENCY=SGD
CURRENCY_API_KEY=fdd7d81e5f0d434393a5a0cca6053423
CURRENCY_CACHE_DAYS=7

# Security (Development keys)
SECRET_KEY=dev-secret-key-change-in-production-please
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Settings (Development)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Production URLs (Development)
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Zoho CRM Integration (Development - India Data Center)
ZOHO_CLIENT_ID=1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH
ZOHO_CLIENT_SECRET=c1fe544d4217d145016d2b03ee78afa084498e04f4
ZOHO_REFRESH_TOKEN=1000.0646dfd795b795c77f83c4364b80553b.050d28502bc7f953c8b317a6f41efa89
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in

# AWS Region
AWS_REGION=ap-southeast-1
EOF

    log_success "Created $ENV_DEV_FILE with PostgreSQL configuration"
    
    # Backup existing .env and update it
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "${ENV_FILE}.backup"
        log_info "Backed up existing .env to .env.backup"
    fi
    
    # Update main .env file to use PostgreSQL
    cp "$ENV_DEV_FILE" "$ENV_FILE"
    log_success "Updated $ENV_FILE to use PostgreSQL"
}

# Install Python PostgreSQL adapter
install_python_deps() {
    log_info "Installing Python PostgreSQL dependencies..."
    
    cd backend
    
    # Check if psycopg2 is already installed
    if python -c "import psycopg2" 2>/dev/null; then
        log_success "psycopg2 already installed"
    else
        # Install psycopg2-binary (easier to install than psycopg2)
        pip install psycopg2-binary
        log_success "Installed psycopg2-binary"
    fi
    
    cd ..
}

# Test database connection
test_connection() {
    log_info "Testing database connection..."
    
    cd backend
    
    # Test connection with Python
    python -c "
import os
import sys
sys.path.append('.')
from app.core.config import settings
from sqlalchemy import create_engine

try:
    engine = create_engine(settings.DATABASE_URL)
    connection = engine.connect()
    connection.close()
    print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    sys.exit(1)
" || {
        log_error "Database connection test failed"
        exit 1
    }
    
    cd ..
    log_success "Database connection test passed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd backend
    
    # Create tables
    python -c "
import sys
sys.path.append('.')
from app.core.database import create_tables
create_tables()
print('✅ Database tables created successfully!')
" || {
        log_error "Database migration failed"
        exit 1
    }
    
    cd ..
    log_success "Database migrations completed"
}

# Main execution
main() {
    log_info "Starting PostgreSQL setup for development environment..."
    
    install_postgresql
    create_database
    update_env_file
    install_python_deps
    test_connection
    run_migrations
    
    echo ""
    log_success "PostgreSQL development environment setup completed!"
    echo ""
    echo "📋 Summary:"
    echo "==========="
    echo "✅ PostgreSQL installed and running"
    echo "✅ Development database 'pipeline_pulse_dev' created"
    echo "✅ Database user 'pipeline_pulse_user' created"
    echo "✅ Environment files updated to use PostgreSQL"
    echo "✅ Python PostgreSQL dependencies installed"
    echo "✅ Database connection tested successfully"
    echo "✅ Database tables created"
    echo ""
    echo "🔧 Configuration:"
    echo "=================="
    echo "Database: pipeline_pulse_dev"
    echo "User: pipeline_pulse_user"
    echo "Host: localhost:5432"
    echo "Environment: backend/.env.development"
    echo ""
    echo "🚀 Next Steps:"
    echo "=============="
    echo "1. Start your development server: cd backend && uvicorn main:app --reload"
    echo "2. Your development environment now matches production (PostgreSQL)"
    echo "3. Test the application to ensure everything works correctly"
}

# Run main function
main "$@"
