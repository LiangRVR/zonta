#!/bin/bash

# Zonta Project - Development Server Startup Script

echo "🚀 Starting Zonta Development Servers..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Start Backend Server
echo -e "${BLUE}📦 Starting Backend Server (Node.js + Express + Supabase)...${NC}"
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing backend dependencies...${NC}"
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found in backend directory${NC}"
    echo "Please create a .env file with your Supabase credentials"
fi

# Start backend in background
node src/index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"
echo "   API: http://localhost:3000"
echo "   Logs: backend.log"
echo ""

# Return to project root
cd ..

# Start Frontend Server
echo -e "${BLUE}🌐 Starting Frontend Server (Static HTTP Server)...${NC}"
cd frontend

# Start frontend in background
python3 -m http.server 8000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"
echo "   Website: http://localhost:8000"
echo "   Shop Page: http://localhost:8000/pages/shop.html"
echo "   Logs: frontend.log"
echo ""

# Return to project root
cd ..

# Save PIDs for later shutdown
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo -e "${GREEN}🎉 All servers are running!${NC}"
echo ""
echo "📝 Quick Links:"
echo "   • API Docs:    http://localhost:3000/"
echo "   • Health:      http://localhost:3000/health"
echo "   • Products:    http://localhost:3000/api/products"
echo "   • Shop Page:   http://localhost:8000/pages/shop.html"
echo ""
echo "To stop the servers, run: ./stop-servers.sh"
echo "Or manually: kill $BACKEND_PID $FRONTEND_PID"
