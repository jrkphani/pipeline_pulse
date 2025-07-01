#!/bin/bash

# Pipeline Pulse Local Testing Startup Script
# Starts both backend and frontend for local development testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🧪 Pipeline Pulse Local Testing Startup${NC}"
echo "========================================"
echo -e "${YELLOW}Testing latest changes: Live CRM integration, API v8, Global navigation${NC}"
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :"$port")
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists psql; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew install postgresql@14
            brew services start postgresql@14
        else
            echo -e "${RED}❌ Please install Homebrew first: https://brew.sh${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Please install PostgreSQL manually${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Setup database if needed
echo -e "${BLUE}🐘 Setting up database...${NC}"
if ! psql -lqt | cut -d \| -f 1 | grep -qw pipeline_pulse_dev; then
    echo -e "${YELLOW}📦 Creating development database...${NC}"
    createdb pipeline_pulse_dev || {
        echo -e "${RED}❌ Failed to create database. Please check PostgreSQL installation${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database already exists${NC}"
fi

# Check and kill existing processes
echo -e "${BLUE}🔄 Checking for existing processes...${NC}"
if port_in_use 8000; then
    kill_port 8000
fi
if port_in_use 5173; then
    kill_port 5173
fi

# Setup backend
echo -e "${BLUE}🔧 Setting up backend...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip install -r requirements.txt >/dev/null 2>&1

# Initialize database
echo -e "${YELLOW}🗄️  Initializing database...${NC}"
python -c "
import sys
sys.path.append('.')
try:
    from app.core.database import create_tables
    create_tables()
    print('✅ Database initialized successfully!')
except Exception as e:
    print(f'❌ Database initialization failed: {e}')
    sys.exit(1)
" || {
    echo -e "${RED}❌ Database initialization failed${NC}"
    exit 1
}

# Test Zoho connectivity
echo -e "${YELLOW}🔗 Testing Zoho CRM connectivity...${NC}"
python -c "
import sys
sys.path.append('.')
try:
    from app.core.config import settings
    print(f'✅ Zoho API URL: {settings.ZOHO_BASE_URL}')
    print(f'✅ Client ID configured: {settings.ZOHO_CLIENT_ID[:20]}...')
    print('✅ Zoho configuration loaded successfully!')
except Exception as e:
    print(f'⚠️  Zoho configuration issue: {e}')
"

# Start backend in background
echo -e "${BLUE}🚀 Starting backend server...${NC}"
nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID) - Logs: backend.log${NC}"

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check backend.log${NC}"
        exit 1
    fi
    sleep 1
done

cd ..

# Setup frontend
echo -e "${BLUE}🎨 Setting up frontend...${NC}"
cd frontend

# Install dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install >/dev/null 2>&1

# Start frontend in background
echo -e "${BLUE}🚀 Starting frontend server...${NC}"
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID) - Logs: frontend.log${NC}"

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start. Check frontend.log${NC}"
        exit 1
    fi
    sleep 1
done

cd ..

# Test API endpoints
echo -e "${BLUE}🧪 Testing API endpoints...${NC}"
echo -e "${YELLOW}📡 Health check...${NC}"
curl -s http://localhost:8000/health | head -1

echo -e "${YELLOW}📡 Zoho status...${NC}"
curl -s http://localhost:8000/api/zoho/status | head -1

# Success message
echo
echo -e "${GREEN}🎉 Pipeline Pulse is now running locally!${NC}"
echo "=========================================="
echo
echo -e "${BLUE}📊 Application URLs:${NC}"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo
echo -e "${BLUE}🧪 Test the new features:${NC}"
echo "✅ Live CRM integration (dashboard shows real data)"
echo "✅ Global navigation (press Cmd/Ctrl+K)"
echo "✅ API v8 endpoints (/api/zoho/*)"
echo "✅ Token management (/crm-sync page)"
echo "✅ Background sync (check logs)"
echo
echo -e "${BLUE}📋 Process Information:${NC}"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Logs: backend.log, frontend.log"
echo
echo -e "${BLUE}🛑 To stop the servers:${NC}"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo "or run: ./scripts/stop-local-testing.sh"
echo
echo -e "${YELLOW}⚡ Ready for testing! Open http://localhost:5173 in your browser${NC}"

# Save PIDs for cleanup script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
