# Pipeline Pulse Local Development Setup

## 🎯 Overview

This guide provides comprehensive instructions for setting up Pipeline Pulse for local development, including environment configuration, branch strategy, and testing workflows.

## 📋 Prerequisites

### System Requirements
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher  
- **PostgreSQL**: 12 or higher
- **Git**: Latest version
- **AWS CLI**: Configured with appropriate permissions

### Development Tools
- **Code Editor**: VS Code recommended with Python and TypeScript extensions
- **Database Client**: pgAdmin, DBeaver, or command-line psql
- **API Testing**: Postman, Insomnia, or curl
- **Browser**: Chrome/Firefox with developer tools

## 🔧 Initial Setup

### 1. Repository Clone and Setup
```bash
# Clone the repository
git clone https://github.com/jrkphani/pipeline_pulse.git
cd pipeline_pulse

# Check available branches
git branch -a

# Choose your development branch (see Branch Strategy below)
git checkout local-testing  # For isolated development
# OR
git checkout dev           # For shared development
# OR  
git checkout main          # For production-like testing
```

### 2. Environment Configuration

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-test.txt  # For testing

# Create environment file
cp .env.example .env
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### 3. Database Setup

#### Local PostgreSQL Setup
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Install PostgreSQL (Ubuntu)
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
psql postgres
CREATE DATABASE pipeline_pulse_dev;
CREATE USER pipeline_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pipeline_pulse_dev TO pipeline_user;
\q
```

#### Database Configuration
```bash
# Update backend/.env with your database credentials
DATABASE_URL=postgresql://pipeline_user:your_secure_password@localhost:5432/pipeline_pulse_dev

# Run initial migrations
cd backend
alembic upgrade head

# Verify database setup
psql -h localhost -U pipeline_user -d pipeline_pulse_dev -c "\dt"
```

## 🌲 Branch Strategy & Environment Management

### Branch Configuration Strategy

Pipeline Pulse uses a branch-specific environment configuration approach to manage different development scenarios:

#### **Branch: `local-testing`**
**Purpose**: Complete isolation for development and testing
**Environment**: Local-only with mock data and services
**Configuration**:
```bash
# backend/.env
ENVIRONMENT=local-testing
DEBUG=true
LOG_LEVEL=DEBUG
USE_MOCK_ZOHO=true
DATABASE_URL=postgresql://user:pass@localhost:5432/pipeline_pulse_dev
DISABLE_AUTH=true  # For easier testing
RATE_LIMITING=false

# frontend/.env.local  
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=local-testing
VITE_ENABLE_AUTH=false
VITE_MOCK_DATA=true
```

#### **Branch: `dev`**
**Purpose**: Shared development with real integrations
**Environment**: Development with staging Zoho integration
**Configuration**:
```bash
# backend/.env
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
USE_MOCK_ZOHO=false
ZOHO_CLIENT_ID=dev_client_id
ZOHO_CLIENT_SECRET=dev_client_secret
DATABASE_URL=postgresql://user:pass@localhost:5432/pipeline_pulse_dev
DISABLE_AUTH=false

# frontend/.env.local
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
VITE_ENABLE_AUTH=true
VITE_MOCK_DATA=false
```

#### **Branch: `main`**
**Purpose**: Production-ready code testing
**Environment**: Local with production-like configuration
**Configuration**:
```bash
# backend/.env
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
USE_MOCK_ZOHO=false
# Use actual production Zoho credentials (carefully!)
DATABASE_URL=postgresql://user:pass@localhost:5432/pipeline_pulse_prod_test
DISABLE_AUTH=false
RATE_LIMITING=true

# frontend/.env.local
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=production
VITE_ENABLE_AUTH=true
VITE_MOCK_DATA=false
```

### Branch Migration Strategy

When moving between branches with different configurations:

```bash
# Save current work
git stash

# Switch branches
git checkout target-branch

# Update dependencies if needed
cd backend && pip install -r requirements.txt
cd frontend && npm install

# Update environment files based on branch
./scripts/setup-branch-environment.sh  # If available

# Apply any new migrations
cd backend && alembic upgrade head

# Restore work if applicable
git stash pop
```

## 🔧 Configuration Details

### Backend Environment Variables

#### Core Configuration
```bash
# Application Settings
ENVIRONMENT=local-testing
DEBUG=true
LOG_LEVEL=DEBUG
SECRET_KEY=your-secret-key-for-local-development

# Database Configuration
DATABASE_URL=postgresql://pipeline_user:password@localhost:5432/pipeline_pulse_dev
DB_ECHO=false  # Set to true for SQL logging

# Zoho Integration (branch-dependent)
USE_MOCK_ZOHO=true  # For local-testing branch
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_USER_EMAIL=admin@1cloudhub.com
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v8

# AWS Configuration (for production-like testing)
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-dev-bucket

# Feature Flags
DISABLE_AUTH=true  # For easier local testing
RATE_LIMITING=false
ENABLE_WEBHOOKS=false
```

#### Testing Configuration
```bash
# Test Database
TEST_DATABASE_URL=postgresql://pipeline_user:password@localhost:5432/pipeline_pulse_test

# Mock Services
MOCK_ZOHO_RESPONSES=true
MOCK_AWS_SERVICES=true
ENABLE_TEST_ENDPOINTS=true
```

### Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Application Settings
VITE_ENVIRONMENT=local-testing
VITE_APP_VERSION=3.0.0
VITE_DEBUG=true

# Feature Flags
VITE_ENABLE_AUTH=false  # Branch-dependent
VITE_MOCK_DATA=true     # Branch-dependent
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false

# Development Tools
VITE_SHOW_DEV_TOOLS=true
VITE_ENABLE_REDUX_DEVTOOLS=true
```

## 🚀 Starting the Development Environment

### Quick Start Script
```bash
#!/bin/bash
# scripts/start-local-development.sh

# Check prerequisites
./scripts/check-prerequisites.sh

# Start database
brew services start postgresql  # macOS
# sudo systemctl start postgresql  # Linux

# Start backend
cd backend
source .venv/bin/activate
export PYTHONPATH=$PWD
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "🚀 Development environment started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"

# Wait for user input to stop
read -p "Press Enter to stop all services..."
kill $BACKEND_PID $FRONTEND_PID
```

### Manual Start

#### Backend
```bash
cd backend
source .venv/bin/activate

# Run database migrations
alembic upgrade head

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Alternative: Use Python directly
python main.py
```

#### Frontend
```bash
cd frontend

# Development server with hot reload
npm run dev

# Build for testing
npm run build
npm run preview
```

## 🧪 Testing Workflows

### Backend Testing

#### Unit Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test module
pytest tests/test_zoho_integration.py -v

# Run tests with specific markers
pytest -m "integration" -v
pytest -m "unit" -v
```

#### API Testing
```bash
# Test health endpoints
curl http://localhost:8000/health
curl http://localhost:8000/health/database
curl http://localhost:8000/health/zoho

# Test API documentation
open http://localhost:8000/docs  # Interactive API docs
open http://localhost:8000/redoc # Alternative docs
```

#### Database Testing
```bash
# Test database connection
python -c "from app.core.database import get_db; print('✅ Database connected')"

# Run migration tests
pytest tests/test_migrations.py

# Manual database inspection
psql -h localhost -U pipeline_user -d pipeline_pulse_dev
```

### Frontend Testing

#### Unit Tests
```bash
cd frontend

# Run Jest tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### E2E Testing
```bash
# Run Playwright tests
npm run test:e2e

# Run specific test
npx playwright test tests/dashboard.spec.ts

# Run tests with UI
npx playwright test --ui
```

#### Build Testing
```bash
# Test production build
npm run build
npm run preview

# Test TypeScript compilation
npm run type-check

# Test linting
npm run lint
npm run lint:fix
```

## 🔧 Development Tools & Utilities

### Database Management

#### Reset Database
```bash
cd backend

# Drop and recreate database
dropdb pipeline_pulse_dev
createdb pipeline_pulse_dev

# Run fresh migrations
alembic upgrade head

# Seed with test data (if available)
python scripts/seed_test_data.py
```

#### Backup and Restore
```bash
# Backup database
pg_dump -h localhost -U pipeline_user pipeline_pulse_dev > backup.sql

# Restore database
psql -h localhost -U pipeline_user pipeline_pulse_dev < backup.sql
```

### Code Quality Tools

#### Backend Code Quality
```bash
cd backend

# Format code
black app/
isort app/

# Type checking
mypy app/

# Linting
flake8 app/
pylint app/

# Security scanning
bandit -r app/
```

#### Frontend Code Quality
```bash
cd frontend

# Format code
npm run format
npm run format:check

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Dependency audit
npm audit
npm audit fix
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Symptoms**: `psycopg2.OperationalError`, connection refused
**Solutions**:
```bash
# Check PostgreSQL status
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Verify database exists
psql -l | grep pipeline_pulse

# Check connection
psql -h localhost -U pipeline_user -d pipeline_pulse_dev
```

#### 2. Python Virtual Environment Issues
**Symptoms**: Module not found, import errors
**Solutions**:
```bash
# Recreate virtual environment
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Verify Python path
which python
python --version
```

#### 3. Node.js Dependencies Issues
**Symptoms**: Module resolution errors, build failures
**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version
```

#### 4. Zoho Integration Issues (Dev/Main branches)
**Symptoms**: Authentication failures, API errors
**Solutions**:
```bash
# Verify Zoho credentials
curl -X POST https://accounts.zoho.in/oauth/v2/token \
  -d "grant_type=refresh_token" \
  -d "client_id=$ZOHO_CLIENT_ID" \
  -d "client_secret=$ZOHO_CLIENT_SECRET" \
  -d "refresh_token=$ZOHO_REFRESH_TOKEN"

# Use mock mode for testing
export USE_MOCK_ZOHO=true

# Check Zoho connectivity
python scripts/test_zoho_connection.py
```

#### 5. Port Conflicts
**Symptoms**: EADDRINUSE errors, services won't start
**Solutions**:
```bash
# Find processes using ports
lsof -i :8000  # Backend port
lsof -i :5173  # Frontend port

# Kill processes
kill -9 $(lsof -t -i :8000)
kill -9 $(lsof -t -i :5173)

# Use alternative ports
uvicorn main:app --port 8001  # Backend
npm run dev -- --port 5174   # Frontend
```

### Branch-Specific Issues

#### Local-Testing Branch
- **Issue**: Mock data not loading
- **Solution**: Verify `USE_MOCK_ZOHO=true` and check mock data files

#### Dev Branch  
- **Issue**: Zoho API rate limiting
- **Solution**: Implement request throttling or use staging environment

#### Main Branch
- **Issue**: Production credentials in local environment
- **Solution**: Use separate development credentials, never commit production secrets

## 📚 Additional Resources

### Documentation
- [API Documentation](http://localhost:8000/docs) - Interactive API documentation
- [Database Schema](./database-management.md) - Database design and migrations
- [Frontend Architecture](../frontend/architecture.md) - Component structure and state management

### Development Scripts
```bash
# Available scripts in scripts/ directory
./scripts/start-local-development.sh     # Complete environment startup
./scripts/setup-branch-environment.sh   # Configure branch-specific settings
./scripts/run-comprehensive-tests.py    # Full test suite
./scripts/validate-environment.py       # Environment validation
./scripts/debug-zoho-auth.py           # Zoho authentication debugging
```

### VS Code Configuration
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/.venv/bin/python",
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": [
    "backend/tests"
  ],
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "python.formatting.provider": "black"
}
```

## 🔄 Environment Migration Guide

### Switching Development Contexts

When switching between different development contexts (branches), follow this workflow:

```bash
# 1. Save current work
git add .
git commit -m "WIP: Current development state"

# 2. Switch branch
git checkout target-branch

# 3. Update environment configuration
cp .env.templates/.env.${branch} backend/.env
cp .env.templates/.env.local.${branch} frontend/.env.local

# 4. Update dependencies
cd backend && pip install -r requirements.txt
cd frontend && npm install

# 5. Update database if needed
cd backend && alembic upgrade head

# 6. Restart development servers
./scripts/start-local-development.sh
```

---

**Last Updated**: December 2024  
**Version**: 3.0.0  
**Target Audience**: Developers

*This guide consolidates local development setup, environment management, and branch strategy for efficient Pipeline Pulse development.*