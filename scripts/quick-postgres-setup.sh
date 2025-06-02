#!/bin/bash

# Pipeline Pulse - Quick PostgreSQL Setup
# Switches local development from SQLite to PostgreSQL

set -e

echo "🐘 Pipeline Pulse PostgreSQL Setup"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/Users/jrkphani/Projects/pipeline-pulse"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${BLUE}🎯 Goal: Switch from SQLite to PostgreSQL locally${NC}"
echo "This will make your local environment match production exactly."
echo ""

# Step 1: Install PostgreSQL
echo -e "${YELLOW}Step 1: Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql@14
            brew services start postgresql@14
            export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
        else
            echo "Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    else
        echo "Please install PostgreSQL for your system"
        exit 1
    fi
else
    echo "✅ PostgreSQL already installed"
fi

# Step 2: Create database
echo -e "${YELLOW}Step 2: Creating local database...${NC}"
createdb pipeline_pulse_dev 2>/dev/null || echo "Database may already exist"

# Step 3: Install Python PostgreSQL driver
echo -e "${YELLOW}Step 3: Installing psycopg2...${NC}"
cd "$BACKEND_DIR"
pip install psycopg2-binary

# Step 4: Update .env file
echo -e "${YELLOW}Step 4: Updating .env file...${NC}"
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
sed -i.bak 's|DATABASE_URL=sqlite://.*|DATABASE_URL=postgresql://localhost:5432/pipeline_pulse_dev|' .env

echo -e "${GREEN}✅ Environment updated:${NC}"
grep "DATABASE_URL" .env

# Step 5: Initialize PostgreSQL database
echo -e "${YELLOW}Step 5: Setting up database schema...${NC}"
python init_db.py

# Step 6: Test connection
echo -e "${YELLOW}Step 6: Testing database connection...${NC}"
python -c "
from app.core.database import engine
from sqlalchemy import text
try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT version()'))
        version = result.fetchone()[0]
        print(f'✅ Connected to: {version.split(\",\")[0]}')
except Exception as e:
    print(f'❌ Connection failed: {e}')
"

echo ""
echo -e "${GREEN}🎉 PostgreSQL setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 What changed:${NC}"
echo "• Local database: SQLite → PostgreSQL"
echo "• Database URL: Updated in .env"
echo "• Dependencies: Added psycopg2-binary"
echo "• Schema: Created in PostgreSQL"
echo ""
echo -e "${BLUE}🔍 Next steps:${NC}"
echo "1. Test your application locally"
echo "2. Deploy with consistent environment"
echo "3. Verify production connectivity"
echo ""
echo -e "${YELLOW}📁 Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)${NC}"
