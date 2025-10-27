#!/bin/bash

echo "Starting Real-time Document Editor..."
echo

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "ERROR: MongoDB is not installed"
    echo "Please install MongoDB and make sure it's running"
    exit 1
fi

# Start MongoDB if not running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    mongod --dbpath ./data/db &
    sleep 3
fi

# Start backend
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd client && npm start &
FRONTEND_PID=$!

echo
echo "Application is starting up..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

