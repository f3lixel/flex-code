#!/bin/bash

echo "Starting backend server..."

# copy config file to backend directory
cp config.ts backend/config.ts
cd backend && pnpm dev &
BACKEND_PID=$!
cd ..

echo "Starting frontend server..."
cd frontend && pnpm dev &
FRONTEND_PID=$!
cd ..

echo "Both servers are starting..."
echo "Press Ctrl+C to stop both servers"

wait $BACKEND_PID $FRONTEND_PID
