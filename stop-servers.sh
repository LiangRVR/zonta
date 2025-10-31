#!/bin/bash

# Zonta Project - Stop Development Servers Script

echo "🛑 Stopping Zonta Development Servers..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to kill process by PID
kill_process() {
    local pid=$1
    local name=$2

    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid"
        echo -e "${GREEN}✅ Stopped $name (PID: $pid)${NC}"
    else
        echo -e "${RED}⚠️  $name was not running${NC}"
    fi
}

# Read PIDs from files
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill_process "$BACKEND_PID" "Backend Server"
    rm .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill_process "$FRONTEND_PID" "Frontend Server"
    rm .frontend.pid
fi

# Also try to kill by port (backup method)
echo ""
echo "🔍 Checking for any remaining processes on ports 3000 and 8000..."

# Kill process on port 3000 (backend)
BACKEND_PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$BACKEND_PORT_PID" ]; then
    kill "$BACKEND_PORT_PID" 2>/dev/null
    echo -e "${GREEN}✅ Stopped process on port 3000${NC}"
fi

# Kill process on port 8000 (frontend)
FRONTEND_PORT_PID=$(lsof -ti:8000 2>/dev/null)
if [ -n "$FRONTEND_PORT_PID" ]; then
    kill "$FRONTEND_PORT_PID" 2>/dev/null
    echo -e "${GREEN}✅ Stopped process on port 8000${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All servers stopped!${NC}"
