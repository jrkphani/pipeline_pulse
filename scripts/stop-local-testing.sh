#!/bin/bash

# Pipeline Pulse Local Testing Stop Script
# Stops both backend and frontend servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping Pipeline Pulse Local Testing${NC}"
echo "========================================"

# Function to kill process by PID
kill_pid() {
    local pid=$1
    local name=$2
    if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}🔄 Stopping $name (PID: $pid)...${NC}"
        kill -TERM "$pid" 2>/dev/null || true
        sleep 2
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Force killing $name...${NC}"
            kill -9 "$pid" 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  $name not running or already stopped${NC}"
    fi
}

# Function to kill process by port
kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti :"$port" 2>/dev/null || echo "")
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}🔄 Stopping process on port $port ($name)...${NC}"
        kill -TERM $pid 2>/dev/null || true
        sleep 2
        if lsof -ti :"$port" >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Force killing process on port $port...${NC}"
            kill -9 $pid 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ Process on port $port stopped${NC}"
    else
        echo -e "${GREEN}✅ Port $port is already free${NC}"
    fi
}

# Stop using saved PIDs first
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill_pid "$BACKEND_PID" "Backend"
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill_pid "$FRONTEND_PID" "Frontend"
    rm -f .frontend.pid
fi

# Fallback: kill by port
echo -e "${BLUE}🔍 Checking ports...${NC}"
kill_port 8000 "Backend API"
kill_port 5173 "Frontend Dev Server"

# Clean up any remaining processes
echo -e "${BLUE}🧹 Cleaning up...${NC}"

# Kill any uvicorn processes
UVICORN_PIDS=$(pgrep -f "uvicorn.*main:app" 2>/dev/null || echo "")
if [ ! -z "$UVICORN_PIDS" ]; then
    echo -e "${YELLOW}🔄 Stopping remaining uvicorn processes...${NC}"
    echo "$UVICORN_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    echo "$UVICORN_PIDS" | xargs kill -9 2>/dev/null || true
fi

# Kill any npm/vite processes
NPM_PIDS=$(pgrep -f "npm.*run.*dev\|vite" 2>/dev/null || echo "")
if [ ! -z "$NPM_PIDS" ]; then
    echo -e "${YELLOW}🔄 Stopping remaining npm/vite processes...${NC}"
    echo "$NPM_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    echo "$NPM_PIDS" | xargs kill -9 2>/dev/null || true
fi

# Clean up log files
echo -e "${BLUE}📝 Cleaning up log files...${NC}"
if [ -f "backend.log" ]; then
    echo -e "${YELLOW}📄 Archiving backend.log...${NC}"
    mv backend.log "backend-$(date +%Y%m%d-%H%M%S).log"
fi

if [ -f "frontend.log" ]; then
    echo -e "${YELLOW}📄 Archiving frontend.log...${NC}"
    mv frontend.log "frontend-$(date +%Y%m%d-%H%M%S).log"
fi

# Final verification
echo -e "${BLUE}🔍 Final verification...${NC}"
if lsof -i :8000 >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Port 8000 still in use${NC}"
else
    echo -e "${GREEN}✅ Port 8000 is free${NC}"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Port 5173 still in use${NC}"
else
    echo -e "${GREEN}✅ Port 5173 is free${NC}"
fi

echo
echo -e "${GREEN}🎉 Pipeline Pulse local testing stopped successfully!${NC}"
echo
echo -e "${BLUE}📊 Summary:${NC}"
echo "✅ Backend server stopped"
echo "✅ Frontend server stopped"
echo "✅ Ports 8000 and 5173 freed"
echo "✅ Log files archived"
echo
echo -e "${YELLOW}💡 To start again: ./scripts/start-local-testing.sh${NC}"
