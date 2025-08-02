#!/bin/bash

# Start API server in background
echo "🚀 Starting API server on port 3001..."
node server.js &
API_PID=$!

# Wait a moment for API server to start
sleep 2

# Start Vite dev server
echo "📱 Starting Vite dev server on port 5173..."
npm run client

# Cleanup when Vite exits
kill $API_PID
echo "✅ Development servers stopped" 